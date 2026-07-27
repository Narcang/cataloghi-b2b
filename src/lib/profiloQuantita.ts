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

/** Normalizza una data inserita manualmente (testo libero): trim, vuoto => null. */
export function normalizeDataTesto(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

/** Compone valore + quantità + data manuale per i riepiloghi (es. "VALIGIA AGENTI ×20 · 27/07/2026"). */
export function componiValoreConQuantitaEData(
  valore: string | null | undefined,
  qta: number | null | undefined,
  data: string | null | undefined,
): string | null {
  const base = componiValoreConQuantita(valore, qta)
  if (!base) return null
  const dataTesto = normalizeDataTesto(data)
  return dataTesto ? `${base} · ${dataTesto}` : base
}
