export function canViewProfiloSpecializzazioneAggiornato(viewerRole: string): boolean {
  return viewerRole === 'admin' || viewerRole === 'manager'
}

export function formatProfiloAggiornatoIl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function normalizeProfiloCampoValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

export function profiloSezioneCampiModificati(
  fields: readonly string[],
  patch: Record<string, unknown>,
  existing: Record<string, unknown> | null | undefined,
): boolean {
  return fields.some((field) => {
    if (!(field in patch)) return false
    const next = normalizeProfiloCampoValue(patch[field])
    const prev = normalizeProfiloCampoValue(existing?.[field])
    return next !== prev
  })
}
