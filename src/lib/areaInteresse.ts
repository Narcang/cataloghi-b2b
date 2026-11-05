import catalogo from '@/data/nazioniRegioni.json'

export type NazioneVoce = { id: string; nome: string }
export type RegioneVoce = { id: string; nazione: string; nome: string }

export const NAZIONI = catalogo.nazioni as NazioneVoce[]
export const REGIONI = catalogo.regioni as RegioneVoce[]

const PER_ID = new Map(REGIONI.map((regione) => [regione.id, regione]))
const ID_REGIONI = new Set(PER_ID.keys())

const PER_NAZIONE = new Map<string, RegioneVoce[]>()
for (const regione of REGIONI) {
  const lista = PER_NAZIONE.get(regione.nazione) ?? []
  lista.push(regione)
  PER_NAZIONE.set(regione.nazione, lista)
}
for (const lista of PER_NAZIONE.values()) {
  lista.sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }))
}

export const COLORI_AREA = [
  { id: 'blu', hex: '#3b82f6', label: 'Blu' },
  { id: 'verde', hex: '#22c55e', label: 'Verde' },
  { id: 'arancione', hex: '#f97316', label: 'Arancione' },
  { id: 'viola', hex: '#8b5cf6', label: 'Viola' },
  { id: 'azzurro', hex: '#38bdf8', label: 'Azzurro' },
] as const

const ID_COLORI = new Set<string>(COLORI_AREA.map((colore) => colore.id))

export function regioniDellaNazione(id: string): RegioneVoce[] {
  return PER_NAZIONE.get(id) ?? []
}

export function nomeRegione(id: string): string | null {
  return PER_ID.get(id)?.nome ?? null
}

export function nazioneDi(id: string): string | null {
  return PER_ID.get(id)?.nazione ?? null
}

export function nazioneIniziale(ids: string[]): string {
  for (const id of ids) {
    const nazione = PER_ID.get(id)?.nazione
    if (nazione) return nazione
  }
  return 'IT'
}

export function colorePredefinitoRuolo(ruolo: string): string {
  if (ruolo === 'rivenditore') return 'verde'
  if (ruolo === 'studio') return 'arancione'
  return 'blu'
}

export function coloreAreaValido(id: string | null | undefined): string | null {
  const valore = id?.trim() ?? ''
  return ID_COLORI.has(valore) ? valore : null
}

export function hexColoreArea(id: string | null | undefined, ruolo: string): string {
  const scelto = coloreAreaValido(id) ?? colorePredefinitoRuolo(ruolo)
  return COLORI_AREA.find((colore) => colore.id === scelto)?.hex ?? '#3b82f6'
}

export function areeInteresseValide(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const visti = new Set<string>()
  for (const id of raw) {
    const valore = String(id)
    if (ID_REGIONI.has(valore)) visti.add(valore)
  }
  return [...visti]
}
