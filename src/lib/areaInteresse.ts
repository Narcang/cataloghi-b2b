import catalogo from '@/data/nazioniRegioni.json'

export type NazioneVoce = { id: string; nome: string }
export type RegioneVoce = { id: string; nazione: string; nome: string }

export const NAZIONI = catalogo.nazioni as NazioneVoce[]
export const REGIONI = catalogo.regioni as RegioneVoce[]

/** Nomi con cui la stessa nazione viene cercata, oltre a quello in elenco. */
const ALIAS_NAZIONE: Record<string, string[]> = {
  NL: ['Olanda', 'Paesi Bassi', 'Netherlands', 'The Netherlands', 'Holland', 'Netherland'],
}

const ETICHETTA_NAZIONE: Record<string, string> = {
  NL: 'Olanda (Paesi Bassi)',
}

export function etichettaNazione(id: string, nome: string): string {
  return ETICHETTA_NAZIONE[id] ?? nome
}

export function nazioneNelFiltro(id: string, nome: string, filtro: string): boolean {
  const cerca = filtro.trim().toLocaleLowerCase('it')
  if (!cerca) return true
  const testi = [nome, etichettaNazione(id, nome), id, ...(ALIAS_NAZIONE[id] ?? [])]
  return testi.some((testo) => testo.toLocaleLowerCase('it').includes(cerca))
}

export const NAZIONI_MENU: NazioneVoce[] = (() => {
  const italia = NAZIONI.find((nazione) => nazione.id === 'IT')
  const altre = NAZIONI.filter((nazione) => nazione.id !== 'IT')
    .map((nazione) => ({ id: nazione.id, nome: etichettaNazione(nazione.id, nazione.nome) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }))
  return italia ? [{ id: italia.id, nome: etichettaNazione(italia.id, italia.nome) }, ...altre] : altre
})()

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

const ID_NAZIONI = new Set(NAZIONI.map((nazione) => nazione.id))

export function nazioniValide(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const visti = new Set<string>()
  for (const id of raw) {
    const valore = String(id)
    if (ID_NAZIONI.has(valore)) visti.add(valore)
  }
  return [...visti]
}

export function nomeNazione(id: string): string | null {
  const voce = NAZIONI.find((nazione) => nazione.id === id)
  if (!voce) return null
  return etichettaNazione(id, voce.nome)
}

export function nomeNazioneGeocoding(id: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(id) ?? id
  } catch {
    return id
  }
}

export function regioniDelleNazioni(ids: string[]): string[] {
  const out: string[] = []
  for (const id of ids) {
    for (const regione of regioniDellaNazione(id)) out.push(regione.id)
  }
  return out
}

export function cittaCoperteDaTesto(testo: string): string[] {
  const visti = new Set<string>()
  for (const parte of testo.split(/[,;\n]/)) {
    const nome = parte.replace(/\s+/g, ' ').trim()
    if (nome) visti.add(nome)
  }
  return [...visti].slice(0, 40)
}

export type CittaCoperta = { nome: string; lat: number; lng: number }

export function cittaCoperteGeoValide(raw: unknown): CittaCoperta[] {
  if (!Array.isArray(raw)) return []
  const out: CittaCoperta[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as { nome?: unknown; lat?: unknown; lng?: unknown }
    const nome = String(record.nome ?? '').trim()
    const lat = Number(record.lat)
    const lng = Number(record.lng)
    if (!nome || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    out.push({ nome, lat, lng })
  }
  return out
}
