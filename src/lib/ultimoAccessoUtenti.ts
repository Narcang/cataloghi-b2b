import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppLocale } from '@/lib/locale'

/** Dopo questo intervallo l'utente deve reinserire email e password. */
export const SESSIONE_MAX_MS = 24 * 60 * 60 * 1000
/** Da 10 giorni di inattività in poi l'icona è rossa (0–9 = verde). */
export const INATTIVITA_GIORNI_ROSSO = 10

const MS_GIORNO = 24 * 60 * 60 * 1000

const DATETIME_LOCALE: Record<AppLocale, string> = {
  it: 'it-IT',
  ru: 'ru-RU',
  en: 'en-GB',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  nl: 'nl-NL',
  el: 'el-GR',
  pl: 'pl-PL',
  uk: 'uk-UA',
}

export type UltimoAccessoStato = 'verde' | 'rosso'

const RUOLI_SENZA_ULTIMO_ACCESSO = new Set(['admin', 'free'])

export function profiloMostraUltimoAccesso(ruolo: string): boolean {
  return Boolean(ruolo) && !RUOLI_SENZA_ULTIMO_ACCESSO.has(ruolo)
}

/** Chi può vedere l'orario di ultimo accesso di un profilo nella struttura organizzativa. */
export function canViewerSeeUltimoAccessoForProfile(_viewerRole: string, targetRuolo: string): boolean {
  return profiloMostraUltimoAccesso(targetRuolo)
}

export function parseUltimoAccessoDate(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Giorni interi dall'ultimo accesso; `null` se non ha mai fatto login. */
export function giorniDaUltimoAccesso(iso: string | null | undefined, now = Date.now()): number | null {
  const date = parseUltimoAccessoDate(iso)
  if (!date) return null
  return Math.max(0, Math.floor((now - date.getTime()) / MS_GIORNO))
}

export function ultimoAccessoStato(iso: string | null | undefined, now = Date.now()): UltimoAccessoStato {
  const giorni = giorniDaUltimoAccesso(iso, now)
  if (giorni === null || giorni >= INATTIVITA_GIORNI_ROSSO) return 'rosso'
  return 'verde'
}

export function isSessioneScadutaPerRiloggio(
  lastSignInAt: string | null | undefined,
  now = Date.now(),
): boolean {
  const date = parseUltimoAccessoDate(lastSignInAt)
  if (!date) return false
  return now - date.getTime() > SESSIONE_MAX_MS
}

export async function fetchUltimoAccessoMap(svc: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  let page = 1
  const perPage = 1000

  while (page <= 20) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('fetchUltimoAccessoMap: listUsers', error.message)
      break
    }
    if (!data?.users?.length) break

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

export function formatUltimoAccessoOrario(
  iso: string | null | undefined,
  locale: AppLocale = 'it',
): string | null {
  const date = parseUltimoAccessoDate(iso)
  if (!date) return null
  return date.toLocaleString(DATETIME_LOCALE[locale] ?? 'it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatUltimoAccessoRiga(
  iso: string | null | undefined,
  locale: AppLocale = 'it',
  label = 'Ultimo accesso',
  mai = 'mai',
): string {
  const orario = formatUltimoAccessoOrario(iso, locale)
  return orario ? `${label}: ${orario}` : `${label}: ${mai}`
}
