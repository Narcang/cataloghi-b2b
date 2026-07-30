export function canViewProfiloSpecializzazioneAggiornato(viewerRole: string): boolean {
  return (
    viewerRole === 'admin' ||
    viewerRole === 'manager' ||
    viewerRole === 'agenzia' ||
    viewerRole === 'agente'
  )
}

export function canDeleteProfiloSpecializzazioneStoricoVoce(
  viewerRole: string,
  targetProfiloRuolo: string,
): boolean {
  if (viewerRole === 'admin' || viewerRole === 'manager') return true
  if (viewerRole === 'agenzia' && targetProfiloRuolo === 'rivenditore') return true
  return false
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
