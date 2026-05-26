/**
 * Ordinamento titoli catalogo: i titoli che iniziano con caratteri non
 * alfanumerici (es. `~ ELEMENTI ~`, `* Promo`, `- Speciale`) finiscono in fondo
 * invece che in cima alla lista.
 */
export function compareCatalogTitoli(a: string | null, b: string | null): number {
  const titoloA = (a ?? '').trim()
  const titoloB = (b ?? '').trim()

  const startsWithAlnumA = startsWithAlphanumeric(titoloA)
  const startsWithAlnumB = startsWithAlphanumeric(titoloB)

  if (startsWithAlnumA !== startsWithAlnumB) {
    return startsWithAlnumA ? -1 : 1
  }

  return titoloA.localeCompare(titoloB, 'it', { sensitivity: 'base' })
}

function startsWithAlphanumeric(value: string): boolean {
  if (!value) return false
  const first = value.charAt(0)
  return /[\p{L}\p{N}]/u.test(first)
}
