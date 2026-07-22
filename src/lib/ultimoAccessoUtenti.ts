import type { SupabaseClient } from '@supabase/supabase-js'

export const RUOLI_CON_ULTIMO_ACCESSO = new Set([
  'agente',
  'distributore',
  'partner_dipendente',
  'studio',
])

export function profiloMostraUltimoAccesso(ruolo: string): boolean {
  return RUOLI_CON_ULTIMO_ACCESSO.has(ruolo)
}

/** Chi può vedere l'orario di ultimo accesso di un profilo nella struttura organizzativa. */
export function canViewerSeeUltimoAccessoForProfile(viewerRole: string, targetRuolo: string): boolean {
  if (!profiloMostraUltimoAccesso(targetRuolo)) return false
  if (viewerRole === 'admin' || viewerRole === 'manager') return true
  if (viewerRole === 'agenzia') return targetRuolo === 'agente'
  if (viewerRole === 'rivenditore') {
    return targetRuolo === 'distributore' || targetRuolo === 'partner_dipendente' || targetRuolo === 'studio'
  }
  if (viewerRole === 'distributore') {
    return targetRuolo === 'partner_dipendente' || targetRuolo === 'studio'
  }
  return false
}

export async function fetchUltimoAccessoMap(svc: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  let page = 1
  const perPage = 1000

  while (page <= 20) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) break

    for (const user of data.users) {
      if (user.last_sign_in_at) {
        map.set(user.id, user.last_sign_in_at)
      }
    }

    if (data.users.length < perPage) break
    page++
  }

  return map
}

export function ultimoAccessoMapToRecord(map: Map<string, string>): Record<string, string> {
  return Object.fromEntries(map)
}

export function formatUltimoAccessoOrario(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatUltimoAccessoRiga(iso: string | null | undefined): string {
  const orario = formatUltimoAccessoOrario(iso)
  return orario ? `Ultimo accesso: ${orario}` : 'Ultimo accesso: mai'
}
