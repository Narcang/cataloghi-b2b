/** Quantità massima ammessa per una voce di specializzazione. */
export const QUANTITA_MAX = 9999

/**
 * Normalizza un valore di quantità proveniente da form/body.
 * - undefined => undefined (campo non inviato, non toccare)
 * - vuoto/null/0/non numerico => null (nessuna quantità)
 * - intero positivo => valore limitato a QUANTITA_MAX
 */
export function normalizeQuantita(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  if (trimmed === '') return null
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.min(parsed, QUANTITA_MAX)
}

/** Etichetta breve della quantità da mostrare accanto al valore (es. "×3"). */
export function formatQuantitaBadge(qta: number | null | undefined): string | null {
  if (qta === null || qta === undefined) return null
  if (!Number.isFinite(qta) || qta <= 0) return null
  return `×${qta}`
}

/** Compone valore + quantità per la visualizzazione nei riepiloghi. */
export function componiValoreConQuantita(
  valore: string | null | undefined,
  qta: number | null | undefined,
): string | null {
  const testo = valore?.trim()
  if (!testo) return null
  const badge = formatQuantitaBadge(qta)
  return badge ? `${testo} ${badge}` : testo
}
