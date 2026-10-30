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

function ordinaProfili(lista: ProfiloGerarchiaRow[]): ProfiloGerarchiaRow[] {
  return [...lista].sort((a, b) =>
    profiloGerarchiaDisplayLabel(a).localeCompare(profiloGerarchiaDisplayLabel(b), 'it', {
      sensitivity: 'base',
    }),
  )
}

/**
 * Collegamenti diretti dei ruoli di questa fascia.
 * chiSegueQuestoProfilo esclude, per esempio, l'agenzia di un venditore:
 * in anagrafica l'agenzia non è genitore del venditore, ma dalla scheda il legame c'è.
 */
function profiliFasciaCollegati(
  fascia: FasciaAssociazione,
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
): ProfiloGerarchiaRow[] {
  const ruoli = new Set([fascia.sedeRuolo, ...fascia.personaRuoli])
  const byId = new Map(profili.map((p) => [p.id, p]))
  const scelti = new Map<string, ProfiloGerarchiaRow>()
  const aggiungi = (p: ProfiloGerarchiaRow | null | undefined) => {
    if (!p || p.id === profilo.id || !ruoli.has(p.ruolo)) return
    if (p.ruolo === 'admin' || p.ruolo === 'free') return
    scelti.set(p.id, p)
  }

  for (const p of chiSegueQuestoProfilo(profilo, profili, links)) aggiungi(p)
  aggiungi(byId.get(profilo.invitato_da ?? ''))
  for (const link of links) {
    const otherId =
      link.utente_id === profilo.id
        ? link.operatore_id
        : link.operatore_id === profilo.id
          ? link.utente_id
          : null
    if (otherId) aggiungi(byId.get(otherId))
  }
  return [...scelti.values()]
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

export type FasciaAssociazione = {
  id: string
  sedeRuolo: string
  personaRuoli: string[]
}

const FASCIA_MANAGER: FasciaAssociazione = { id: 'manager', sedeRuolo: 'manager', personaRuoli: [] }
const FASCIA_AGENZIA: FasciaAssociazione = { id: 'agenzia', sedeRuolo: 'agenzia', personaRuoli: [] }
const FASCIA_AGENZIA_PERSONE: FasciaAssociazione = {
  id: 'agenzia',
  sedeRuolo: 'agenzia',
  personaRuoli: ['agente', 'back_office'],
}
const FASCIA_RIVENDITORE: FasciaAssociazione = { id: 'rivenditore', sedeRuolo: 'rivenditore', personaRuoli: [] }
const FASCIA_RIVENDITORE_PERSONE: FasciaAssociazione = {
  id: 'rivenditore',
  sedeRuolo: 'rivenditore',
  personaRuoli: ['distributore', 'partner_dipendente'],
}
const FASCIA_STUDIO: FasciaAssociazione = { id: 'studio', sedeRuolo: 'studio', personaRuoli: [] }

/** Righe di associazione verso l'alto, dal ruolo più alto al più vicino. */
export function fasceAssociazione(ruolo: string | null | undefined): FasciaAssociazione[] {
  switch (ruolo) {
    case 'agenzia':
      return [FASCIA_MANAGER]
    case 'agente':
    case 'back_office':
      return [FASCIA_MANAGER, FASCIA_AGENZIA]
    case 'rivenditore':
      return [FASCIA_MANAGER, FASCIA_AGENZIA_PERSONE]
    case 'distributore':
    case 'partner_dipendente':
      return [FASCIA_MANAGER, FASCIA_AGENZIA_PERSONE, FASCIA_RIVENDITORE]
    case 'studio':
      return [FASCIA_MANAGER, FASCIA_AGENZIA_PERSONE, FASCIA_RIVENDITORE_PERSONE]
    case 'studio_associato':
      return [FASCIA_MANAGER, FASCIA_AGENZIA_PERSONE, FASCIA_RIVENDITORE_PERSONE, FASCIA_STUDIO]
    default:
      return []
  }
}

function profiloVisibile(p: ProfiloGerarchiaRow): boolean {
  return p.ruolo !== 'free' && p.registrazione_approvata !== false
}

export function sediFascia(
  fascia: FasciaAssociazione,
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  ruoloLabel: (ruolo: string) => string,
): VoceAssociazione[] {
  const lista = profili.filter((p) => p.id !== profilo.id && p.ruolo === fascia.sedeRuolo && profiloVisibile(p))
  return ordina(lista).map((p) => voce(p, ruoloLabel))
}

export function personeFascia(
  fascia: FasciaAssociazione,
  sedeId: string,
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
  ruoloLabel: (ruolo: string) => string,
  includiId?: string | null,
): VoceAssociazione[] {
  if (!fascia.personaRuoli.length || !sedeId) return []
  const sede = profili.find((p) => p.id === sedeId && p.ruolo === fascia.sedeRuolo)
  if (!sede) return []
  const lista = profili.filter(
    (p) =>
      p.id !== profilo.id &&
      p.id !== sede.id &&
      fascia.personaRuoli.includes(p.ruolo) &&
      profiloVisibile(p) &&
      appartieneAllaSede(p, sede.id, links),
  )
  if (includiId && !lista.some((p) => p.id === includiId)) {
    const extra = profili.find(
      (p) => p.id === includiId && fascia.personaRuoli.includes(p.ruolo) && p.id !== profilo.id,
    )
    if (extra) lista.push(extra)
  }
  const unici = new Map<string, ProfiloGerarchiaRow>()
  for (const p of lista) unici.set(p.id, p)
  return ordina([...unici.values()]).map((p) => voce(p, ruoloLabel))
}

export function selezioneFascia(
  fascia: FasciaAssociazione,
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
): { sedeId: string | null; personaId: string | null } {
  const collegatiFascia = profiliFasciaCollegati(fascia, profilo, profili, links)
  const sedi = collegatiFascia.filter((p) => p.ruolo === fascia.sedeRuolo)
  const persone = collegatiFascia.filter((p) => fascia.personaRuoli.includes(p.ruolo))
  let sede = sedi.find((p) => p.id === profilo.invitato_da) ?? null
  const sedeInvito = sede
  let persona: ProfiloGerarchiaRow | null = sedeInvito
    ? (persone.find((p) => appartieneAllaSede(p, sedeInvito.id, links)) ?? null)
    : null
  if (!sede) {
    const personaNota = ordinaProfili(persone).find((p) =>
      sedi.some((candidata) => appartieneAllaSede(p, candidata.id, links)),
    )
    if (personaNota) {
      persona = personaNota
      sede = sedi.find((candidata) => appartieneAllaSede(personaNota, candidata.id, links)) ?? null
    }
  }
  if (!sede && sedi.length > 0) sede = ordinaProfili(sedi)[0]
  if (sede && !persona) {
    persona = persone.find((p) => appartieneAllaSede(p, sede.id, links)) ?? null
  }
  return { sedeId: sede?.id ?? null, personaId: persona?.id ?? null }
}

export type FasciaScelta = { id: string; sedeId: string | null; personaId: string | null }

export type DiffFasceAssociazione = {
  rimuoviIds: string[]
  aggiungiIds: string[]
  propagaRemove: { id: string; ruolo: string }[]
  propagaAdd: { id: string; ruolo: string }[]
  invitatoDa: string | null | undefined
}

export function diffFasceAssociazione(
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: Link[],
  scelte: FasciaScelta[],
): { ok: true; diff: DiffFasceAssociazione } | { ok: false; message: string } {
  const fasce = fasceAssociazione(profilo.ruolo)
  if (fasce.length === 0) return { ok: false, message: 'Questo ruolo non ha associazioni verso l’alto' }

  const byId = new Map(profili.map((p) => [p.id, p]))
  const rimuovi = new Set<string>()
  const aggiungi = new Set<string>()
  const propagaRemove: { id: string; ruolo: string }[] = []
  const propagaAdd: { id: string; ruolo: string }[] = []
  const sediScelte: (string | null)[] = []

  for (const fascia of fasce) {
    const scelta = scelte.find((item) => item.id === fascia.id)
    const sedeId = scelta?.sedeId?.trim() || null
    let personaId = fascia.personaRuoli.length > 0 ? scelta?.personaId?.trim() || null : null
    const sede = sedeId ? (byId.get(sedeId) ?? null) : null
    if (sedeId && !sede) return { ok: false, message: 'Profilo da associare non trovato' }
    if (sede && sede.id === profilo.id) return { ok: false, message: 'Il collegamento deve essere un altro profilo' }
    if (sede && sede.ruolo !== fascia.sedeRuolo) {
      return { ok: false, message: 'Questo profilo non si può associare in questa casella' }
    }
    if (!sede) personaId = null

    const persona = personaId ? (byId.get(personaId) ?? null) : null
    if (personaId && !persona) return { ok: false, message: 'Persona non trovata' }
    if (persona && !fascia.personaRuoli.includes(persona.ruolo)) {
      return { ok: false, message: 'Questa persona non si può associare in questa casella' }
    }
    if (persona && sede) {
      const attuale = selezioneFascia(fascia, profilo, profili, links)
      const consentite = new Set(
        personeFascia(fascia, sede.id, profilo, profili, links, (ruolo) => ruolo).map((p) => p.id),
      )
      const giaQuesta = persona.id === attuale.personaId && sede.id === attuale.sedeId
      if (!consentite.has(persona.id) && !giaQuesta) {
        return { ok: false, message: 'Questa persona non fa parte della sede scelta' }
      }
    }

    const dellaFascia = profiliFasciaCollegati(fascia, profilo, profili, links)
    const sediAttuali = dellaFascia.filter((p) => p.ruolo === fascia.sedeRuolo)
    const personeAttuali = dellaFascia.filter((p) => fascia.personaRuoli.includes(p.ruolo))
    for (const attuale of sediAttuali) {
      if (attuale.id !== sede?.id) rimuovi.add(attuale.id)
    }
    for (const attuale of personeAttuali) {
      if (attuale.id !== persona?.id) rimuovi.add(attuale.id)
    }
    if (sede && !collegati(profilo.id, sede.id, links)) aggiungi.add(sede.id)
    if (persona && !collegati(profilo.id, persona.id, links)) aggiungi.add(persona.id)

    for (const id of personeAttuali.map((p) => p.id)) {
      if (id === persona?.id) continue
      const vecchia = byId.get(id)
      if (vecchia && personaSpostaLaSede(profilo.ruolo, vecchia.ruolo)) {
        propagaRemove.push({ id: vecchia.id, ruolo: vecchia.ruolo })
      }
    }
    if (persona && !collegati(profilo.id, persona.id, links) && personaSpostaLaSede(profilo.ruolo, persona.ruolo)) {
      propagaAdd.push({ id: persona.id, ruolo: persona.ruolo })
    }

    sediScelte.push(sede?.id ?? null)
  }

  for (const id of aggiungi) rimuovi.delete(id)

  const piuVicina = [...sediScelte].reverse().find((id) => id) ?? null
  const invitatoDa = piuVicina === (profilo.invitato_da ?? null) ? undefined : piuVicina

  return {
    ok: true,
    diff: {
      rimuoviIds: [...rimuovi],
      aggiungiIds: [...aggiungi],
      propagaRemove,
      propagaAdd,
      invitatoDa,
    },
  }
}
