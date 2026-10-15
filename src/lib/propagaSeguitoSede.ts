import type { SupabaseClient } from '@supabase/supabase-js'
import {
  chiSegueQuestoProfilo,
  getChildrenProfiles,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type Lato = { id: string; ruolo: string }
type LinkRow = { utente_id: string; operatore_id: string }

/** Chi può seguire la sede, e quali utenti della sede si spostano con lei. */
const REGOLA_SEDE: Record<string, { follower: string[]; figli: string[] }> = {
  rivenditore: {
    follower: ['agente', 'back_office'],
    figli: ['distributore', 'partner_dipendente', 'studio', 'studio_associato'],
  },
  studio: {
    follower: ['agente', 'back_office', 'distributore'],
    figli: ['studio_associato'],
  },
}

function regolaDi(ruolo: string) {
  return REGOLA_SEDE[ruolo] ?? null
}

function interpreta(a: Lato, b: Lato):
  | { tipo: 'follower'; sede: Lato; persona: Lato }
  | { tipo: 'figlio'; sede: Lato; persona: Lato }
  | null {
  const regolaA = regolaDi(a.ruolo)
  const regolaB = regolaDi(b.ruolo)
  if (regolaA?.follower.includes(b.ruolo)) return { tipo: 'follower', sede: a, persona: b }
  if (regolaB?.follower.includes(a.ruolo)) return { tipo: 'follower', sede: b, persona: a }
  if (regolaA?.figli.includes(b.ruolo)) return { tipo: 'figlio', sede: a, persona: b }
  if (regolaB?.figli.includes(a.ruolo)) return { tipo: 'figlio', sede: b, persona: a }
  return null
}

function nomeProfilo(p: Pick<ProfiloGerarchiaRow, 'nome_completo' | 'societa' | 'email'>): string {
  return p.nome_completo?.trim() || p.societa?.trim() || p.email?.trim() || ''
}

async function collega(db: SupabaseClient, a: string, b: string) {
  if (!a || !b || a === b) return
  await db.from('connessioni_utente_operatore').upsert(
    [
      { utente_id: a, operatore_id: b },
      { utente_id: b, operatore_id: a },
    ],
    { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
  )
}

async function scollega(db: SupabaseClient, a: string, b: string) {
  if (!a || !b || a === b) return
  await db.from('connessioni_utente_operatore').delete().eq('utente_id', a).eq('operatore_id', b)
  await db.from('connessioni_utente_operatore').delete().eq('utente_id', b).eq('operatore_id', a)
}

/**
 * Se una sede (rivenditore o sede studio) viene associata a un agente o a un venditore,
 * i suoi venditori, promoter e studi seguono quella persona.
 * Se l'associazione si sposta, il seguito da dei suoi utenti si sposta con lei.
 */
export async function propagaAssociazioneSede(
  db: SupabaseClient,
  latoA: Lato,
  latoB: Lato,
  azione: 'add' | 'remove',
): Promise<void> {
  const coppia = interpreta(latoA, latoB)
  if (!coppia) return
  const regola = regolaDi(coppia.sede.ruolo)
  if (!regola) return

  const [{ data: profili }, { data: links }] = await Promise.all([
    db
      .from('profili')
      .select('id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata, seguito_da')
      .neq('ruolo', 'free')
      .limit(2000),
    db.from('connessioni_utente_operatore').select('utente_id, operatore_id').limit(2000),
  ])
  const rows = (profili ?? []) as ProfiloGerarchiaRow[]
  const linkRows = (links ?? []) as LinkRow[]
  const sede = rows.find((p) => p.id === coppia.sede.id)
  if (!sede) return

  const figliAlbero = getChildrenProfiles(sede.id, sede, sede.id, sede.ruolo, rows, linkRows)
  const figliInvito = rows.filter((p) => p.invitato_da === sede.id && regola.figli.includes(p.ruolo))
  const figli = new Map<string, ProfiloGerarchiaRow>()
  for (const figlio of [...figliAlbero, ...figliInvito]) {
    if (!regola.figli.includes(figlio.ruolo)) continue
    if (figlio.id === coppia.persona.id) continue
    figli.set(figlio.id, figlio)
  }

  if (coppia.tipo === 'figlio') {
    if (azione !== 'add') return
    const follower = chiSegueQuestoProfilo(sede, rows, linkRows).filter((p) =>
      regola.follower.includes(p.ruolo),
    )
    const principale = follower[0]
    if (!principale) return
    for (const persona of follower) {
      await collega(db, persona.id, coppia.persona.id)
    }
    const nome = nomeProfilo(principale)
    if (nome) {
      await db.from('profili').update({ seguito_da: nome }).eq('id', coppia.persona.id)
    }
    return
  }

  const persona = rows.find((p) => p.id === coppia.persona.id)
  const nomePersona = persona ? nomeProfilo(persona) : ''
  const nomePersonaKey = nomePersona.toLocaleLowerCase('it')

  if (azione === 'remove') {
    for (const figlio of figli.values()) {
      await scollega(db, persona?.id ?? coppia.persona.id, figlio.id)
      const patch: Record<string, string | null> = {}
      if (figlio.invitato_da === coppia.persona.id) patch.invitato_da = sede.id
      const seguito = (figlio.seguito_da ?? '').trim().toLocaleLowerCase('it')
      if (nomePersonaKey && seguito === nomePersonaKey) patch.seguito_da = null
      if (Object.keys(patch).length > 0) {
        await db.from('profili').update(patch).eq('id', figlio.id)
      }
    }
    return
  }

  const vecchi = chiSegueQuestoProfilo(sede, rows, linkRows).filter(
    (p) => regola.follower.includes(p.ruolo) && p.id !== coppia.persona.id,
  )

  for (const figlio of figli.values()) {
    const daTogliere = new Map<string, ProfiloGerarchiaRow>()
    for (const vecchio of vecchi) daTogliere.set(vecchio.id, vecchio)
    for (const segue of chiSegueQuestoProfilo(figlio, rows, linkRows)) {
      if (segue.id === sede.id || segue.id === coppia.persona.id) continue
      if (regola.follower.includes(segue.ruolo)) daTogliere.set(segue.id, segue)
    }
    for (const vecchio of daTogliere.values()) {
      await scollega(db, vecchio.id, figlio.id)
    }
    await collega(db, coppia.persona.id, figlio.id)
    const patch: Record<string, string | null> = {}
    if (figlio.invitato_da && daTogliere.has(figlio.invitato_da)) {
      patch.invitato_da = coppia.persona.id
    }
    if (nomePersona) patch.seguito_da = nomePersona
    if (Object.keys(patch).length > 0) {
      await db.from('profili').update(patch).eq('id', figlio.id)
    }
  }
}
