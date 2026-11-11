import comuni from '@/data/comuniItalia.json'

const PER_REGIONE = comuni as Record<string, string[]>

export const REGIONI_COMUNI_ITALIA = Object.keys(PER_REGIONE)

function piega(testo: string): string {
  return testo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it')
}

/** Comuni italiani delle regioni indicate il cui nome inizia con il testo. */
export function suggerisciComuniItalia(regioni: string[], filtro: string, giaScelti: string[]): string[] {
  const cerca = piega(filtro)
  if (!cerca) return []
  const esclusi = new Set(giaScelti.map(piega))
  const visti = new Set<string>()
  const out: string[] = []
  for (const id of regioni) {
    for (const nome of PER_REGIONE[id] ?? []) {
      const chiave = piega(nome)
      if (esclusi.has(chiave) || visti.has(chiave) || !chiave.startsWith(cerca)) continue
      visti.add(chiave)
      out.push(nome)
    }
  }
  out.sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
  return out.slice(0, 40)
}
