export const REGIONI_ITALIA = [
  { id: '13', nome: 'Abruzzo' },
  { id: '17', nome: 'Basilicata' },
  { id: '18', nome: 'Calabria' },
  { id: '15', nome: 'Campania' },
  { id: '08', nome: 'Emilia-Romagna' },
  { id: '06', nome: 'Friuli-Venezia Giulia' },
  { id: '12', nome: 'Lazio' },
  { id: '07', nome: 'Liguria' },
  { id: '03', nome: 'Lombardia' },
  { id: '11', nome: 'Marche' },
  { id: '14', nome: 'Molise' },
  { id: '01', nome: 'Piemonte' },
  { id: '16', nome: 'Puglia' },
  { id: '20', nome: 'Sardegna' },
  { id: '19', nome: 'Sicilia' },
  { id: '09', nome: 'Toscana' },
  { id: '04', nome: 'Trentino-Alto Adige' },
  { id: '10', nome: 'Umbria' },
  { id: '02', nome: "Valle d'Aosta" },
  { id: '05', nome: 'Veneto' },
] as const

export const COLORI_AREA = [
  { id: 'blu', hex: '#3b82f6', label: 'Blu' },
  { id: 'verde', hex: '#22c55e', label: 'Verde' },
  { id: 'arancione', hex: '#f97316', label: 'Arancione' },
  { id: 'viola', hex: '#8b5cf6', label: 'Viola' },
  { id: 'azzurro', hex: '#38bdf8', label: 'Azzurro' },
] as const

const ID_REGIONI = new Set<string>(REGIONI_ITALIA.map((regione) => regione.id))
const ID_COLORI = new Set<string>(COLORI_AREA.map((colore) => colore.id))

export function nomeRegione(id: string): string | null {
  return REGIONI_ITALIA.find((regione) => regione.id === id)?.nome ?? null
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
