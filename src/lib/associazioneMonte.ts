import {
  chiSegueQuestoProfilo,
  profiloGerarchiaDisplayLabel,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type Link = { utente_id: string; operatore_id: string }

type Regola = {
  sedeRuoli: string[]
  /** Ruoli della persona, in base al ruolo della sede scelta. */
  personaRuoliPerSede: Record<string, string[]>
}

/**
 * Collegamento verso l'alto, dalla scheda del profilo.
 * La sede è l'azienda. La persona è facoltativa: se manca, resta solo la sede.
 */
const REGOLA: Record<string, Regola> = {
  rivenditore: {
    sedeRuoli: ['agenzia'],
    personaRuoliPerSede: { agenzia: ['agente', 'back_office'] },
  },
  distributore: {
    sedeRuoli: ['rivenditore'],
    personaRuoliPerSede: { rivenditore: ['agente', 'back_office'] },
  },
  partner_dipendente: {
    sedeRuoli: ['rivenditore'],
    personaRuoliPerSede: { rivenditore: ['agente', 'back_office'] },
  },
  studio: {
    sedeRuoli: ['agenzia', 'rivenditore'],
    personaRuoliPerSede: {
      agenzia: ['agente', 'back_office'],
      rivenditore: ['distributore'],
    },
  },
  studio_associato: {
    sedeRuoli: ['studio'],
    personaRuoliPerSede: { studio: ['agente', 'back_office', 'distributore'] },
  },
  agente: {
    sedeRuoli: ['agenzia'],
    personaRuoliPerSede: {},
  },
  agenzia: {
    sedeRuoli: ['manager'],
    personaRuoliPerSede: {},
  },
  back_office: {
    sedeRuoli: ['agenzia'],
    personaRuoliPerSede: {},
  },
}

export type VoceAssociazione = { id: string; label: string; ruolo: string }

export type DiffAssociazioneMonte = {
  rimuoviSedi: string[]
  rimuoviPersone: string[]
  aggiungiSede: string | null
  aggiungiPersona: string | null
  /** undefined = non toccare invitato_da. */
  invitatoDa: string | null | undefined
  /** undefined = non toccare seguito_da. */
  seguitoDa: string | null | undefined
  propagaRemoveIds: string[]
  propagaAddId: string | null
}

export function regolaAssociazioneMonte(ruolo: string | null | undefined): Regola | null {
  if (!ruolo) return null
  return REGOLA[ruolo] ?? null
}

export function haPersonaAssociazione(ruolo: string | null | undefined): boolean {
  const regola = regolaAssociazioneMonte(ruolo)
  if (!regola) return false
  return Object.keys(regola.personaRuoliPerSede).length > 0
}

function personaRuoliDi(regola: Regola, sedeRuolo: string | null | undefined): string[] {
  if (!sedeRuolo) return []
  return regola.personaRuoliPerSede[sedeRuolo] ?? []
}

function personaRuoliQualsiasi(regola: Regola): string[] {
  const set = new Set<string>()
  for (const ruoli of Object.values(regola.personaRuoliPerSede)) {
    for (const ruolo of ruoli) set.add(ruolo)
  }
  return [...set]
}

function collegati(a: string, b: string, links: Link[]): boolean {
  return links.some(
    (link) =>
      (link.utente_id === a && link.operatore_id === b) ||
      (link.utente_id === b && link.operatore_id === a),
  )
}

function appartieneAllaSede(persona: ProfiloGerarchiaRow, sedeId: string, links: Link[]): boolean {
  if (persona.invitato_da === sedeId) return true
  return collegati(persona.id, sedeId, links)
}

function nomeProfilo(p: Pick<ProfiloGerarchiaRow, 'nome_completo' | 'societa' | 'email'>): string {
  return p.nome_completo?.trim() || p.societa?.trim() || p.email?.trim() || ''
}

function voce(p: ProfiloGerarchiaRow, ruoloLabel: (ruolo: string) => string): VoceAssociazione {
  return {
    id: p.id,
    ruolo: p.ruolo,
    label: `${profiloGerarchiaDisplayLabel(p)} · ${ruoloLabel(p.ruolo)}`,
  }
}

function ordina(lista: ProfiloGerarchiaRow[]): ProfiloGerarchiaRow[] {
  return [...lista].sort((a, b) =>
    profiloGerarchiaDisplayLabel(a).localeCompare(profiloGerarchiaDisplayLabel(b), 'it', { sensitivity: 'base' }),
  )
}

/** Cambiare la persona su una sede sposta venditori, promoter e studi di quella sede. */
export function personaSpostaLaSede(profiloRuolo: string, personaRuolo: string): boolean {
  if (profiloRuolo === 'rivenditore') return personaRuolo === 'agente' || personaRuolo === 'back_office'
  if (profiloRuolo === 'studio') {
    return personaRuolo === 'agente' || personaRuolo === 'back_office' || personaRuolo === 'distributore'
  }
  return false
}

function usaFollowerDellaSede(profiloRuolo: string): boolean {
  return profiloRuolo === 'distributore' || profiloRuolo === 'partner_dipendente' || profiloRuolo === 'studio_associato'
}

export function sediDisponibili(
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  ruoloLabel: (ruolo: string) => string,
): VoceAssociazione[] {
  const regola = regolaAssociazioneMonte(profilo.ruolo)
  if (!regola) return []
  const lista = profili.filter(
    (p) =>
      p.id !== profilo.id &&
      regola.sedeRuoli.includes(p.ruolo) &&
      p.ruolo !== 'free' &&
      p.registrazione_approvata !== false,
  )
  return ordina(lista).map((p) => voce(p, ruoloLabel))
}

export function personeDisponibili(
  profilo: ProfiloGerarchiaRow,
  sedeId: string,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
  ruoloLabel: (ruolo: string) => string,
  includiId?: string | null,
): VoceAssociazione[] {
  const regola = regolaAssociazioneMonte(profilo.ruolo)
  if (!regola || !sedeId) return []
  const sede = profili.find((p) => p.id === sedeId)
  if (!sede || !regola.sedeRuoli.includes(sede.ruolo)) return []
  const ruoli = personaRuoliDi(regola, sede.ruolo)
  if (ruoli.length === 0) return []

  const lista = usaFollowerDellaSede(profilo.ruolo)
    ? chiSegueQuestoProfilo(sede, profili, links).filter((p) => ruoli.includes(p.ruolo))
    : profili.filter(
        (p) =>
          p.id !== profilo.id &&
          p.id !== sede.id &&
          ruoli.includes(p.ruolo) &&
          p.ruolo !== 'free' &&
          p.registrazione_approvata !== false &&
          appartieneAllaSede(p, sede.id, links),
      )

  if (includiId && !lista.some((p) => p.id === includiId)) {
    const extra = profili.find((p) => p.id === includiId && ruoli.includes(p.ruolo) && p.id !== profilo.id)
    if (extra) lista.push(extra)
  }

  const unici = new Map<string, ProfiloGerarchiaRow>()
  for (const p of lista) {
    if (p.id !== profilo.id) unici.set(p.id, p)
  }
  return ordina([...unici.values()]).map((p) => voce(p, ruoloLabel))
}

export function associazioneMonteAttuale(
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
): { sedeId: string | null; personaId: string | null } {
  const regola = regolaAssociazioneMonte(profilo.ruolo)
  if (!regola) return { sedeId: null, personaId: null }
  const segue = chiSegueQuestoProfilo(profilo, profili, links)
  const sedi = segue.filter((p) => regola.sedeRuoli.includes(p.ruolo))
  const sede = sedi.find((p) => p.id === profilo.invitato_da) ?? sedi[0] ?? null
  const ruoliPersona = personaRuoliQualsiasi(regola)
  const persone = segue.filter((p) => ruoliPersona.includes(p.ruolo))
  const seguito = (profilo.seguito_da ?? '').trim().toLocaleLowerCase('it')
  const persona =
    persone.find((p) => p.id === profilo.invitato_da) ??
    persone.find((p) => {
      const nome = nomeProfilo(p).toLocaleLowerCase('it')
      return Boolean(seguito && nome && seguito === nome)
    }) ??
    persone[0] ??
    null
  return { sedeId: sede?.id ?? null, personaId: persona?.id ?? null }
}

export function diffAssociazioneMonte(
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
  sedeId: string | null,
  personaId: string | null,
): { ok: true; diff: DiffAssociazioneMonte } | { ok: false; message: string } {
  const regola = regolaAssociazioneMonte(profilo.ruolo)
  if (!regola) return { ok: false, message: 'Questo ruolo non ha l’associazione verso la sede' }

  const sedeScelta = sedeId ? (profili.find((p) => p.id === sedeId) ?? null) : null
  if (sedeId && !sedeScelta) return { ok: false, message: 'Sede non trovata' }
  if (sedeScelta && sedeScelta.id === profilo.id) return { ok: false, message: 'La sede deve essere un altro profilo' }
  if (sedeScelta && !regola.sedeRuoli.includes(sedeScelta.ruolo)) {
    return { ok: false, message: 'Questa sede non si può associare a questo profilo' }
  }

  let personaScelta = personaId ? (profili.find((p) => p.id === personaId) ?? null) : null
  if (!sedeScelta || personaRuoliQualsiasi(regola).length === 0) personaScelta = null
  if (personaId && sedeScelta && personaRuoliQualsiasi(regola).length > 0 && !personaScelta) {
    return { ok: false, message: 'Persona non trovata' }
  }
  if (personaScelta && personaScelta.id === profilo.id) {
    return { ok: false, message: 'La persona deve essere un altro profilo' }
  }

  const attuale = associazioneMonteAttuale(profilo, profili, links)
  if (personaScelta && sedeScelta) {
    const consentite = new Set(
      personeDisponibili(profilo, sedeScelta.id, profili, links, (ruolo) => ruolo).map((p) => p.id),
    )
    const giaQuesta =
      personaScelta.id === attuale.personaId && sedeScelta.id === attuale.sedeId
    if (!consentite.has(personaScelta.id) && !giaQuesta) {
      return { ok: false, message: 'Questa persona non è collegata alla sede scelta' }
    }
  }

  const segue = chiSegueQuestoProfilo(profilo, profili, links)
  const sediAttuali = segue.filter((p) => regola.sedeRuoli.includes(p.ruolo))
  const personeAttuali = segue.filter((p) => personaRuoliQualsiasi(regola).includes(p.ruolo))
  const sedeFinale = sedeScelta?.id ?? null
  const personaFinale = personaScelta?.id ?? null

  const rimuoviSedi = sediAttuali.filter((p) => p.id !== sedeFinale).map((p) => p.id)
  const rimuoviPersone = personeAttuali.filter((p) => p.id !== personaFinale).map((p) => p.id)
  const aggiungiSede = sedeFinale && !collegati(profilo.id, sedeFinale, links) ? sedeFinale : null
  const aggiungiPersona = personaFinale && !collegati(profilo.id, personaFinale, links) ? personaFinale : null

  const rimossi = new Set([...rimuoviSedi, ...rimuoviPersone])
  const invitato = profilo.invitato_da
  const invitatoEraMonte = Boolean(
    invitato &&
      (rimossi.has(invitato) ||
        sediAttuali.some((p) => p.id === invitato) ||
        personeAttuali.some((p) => p.id === invitato)),
  )
  let invitatoDa: string | null | undefined
  if (!sedeFinale) {
    invitatoDa = invitato && rimossi.has(invitato) ? null : undefined
  } else if (!invitato || (invitato !== sedeFinale && invitatoEraMonte)) {
    invitatoDa = sedeFinale
  } else {
    invitatoDa = undefined
  }

  let seguitoDa: string | null | undefined
  if (personaScelta) {
    const nome = nomeProfilo(personaScelta)
    seguitoDa = nome && nome !== (profilo.seguito_da ?? '').trim() ? nome : undefined
  } else if (rimuoviPersone.length > 0) {
    const nomi = new Set(
      personeAttuali
        .filter((p) => rimuoviPersone.includes(p.id))
        .map((p) => nomeProfilo(p).toLocaleLowerCase('it'))
        .filter(Boolean),
    )
    const seguito = (profilo.seguito_da ?? '').trim().toLocaleLowerCase('it')
    seguitoDa = seguito && nomi.has(seguito) ? null : undefined
  } else {
    seguitoDa = undefined
  }

  const propagaRemoveIds = rimuoviPersone.filter((id) => {
    const persona = personeAttuali.find((p) => p.id === id)
    return Boolean(persona && personaSpostaLaSede(profilo.ruolo, persona.ruolo))
  })
  const propagaAddId =
    aggiungiPersona && personaScelta && personaSpostaLaSede(profilo.ruolo, personaScelta.ruolo)
      ? aggiungiPersona
      : null

  return {
    ok: true,
    diff: {
      rimuoviSedi,
      rimuoviPersone,
      aggiungiSede,
      aggiungiPersona,
      invitatoDa,
      seguitoDa,
      propagaRemoveIds,
      propagaAddId,
    },
  }
}
