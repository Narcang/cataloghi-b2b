import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppLocale } from '@/lib/locale'

/** Dopo questo intervallo l'utente deve reinserire email e password. */
export const SESSIONE_MAX_MS = 24 * 60 * 60 * 1000
/** Da 10 giorni di inattività in poi l'icona è rossa (0–9 = verde). */
export const INATTIVITA_GIORNI_ROSSO = 10
/** Giro visita rosso da 90 giorni, telefonata da 10. Data assente = rossa. */
export const GIORNI_VISITA_ROSSO = 90
export const GIORNI_TELEFONATA_ROSSO = 10

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

const RUOLI_SENZA_ULTIMO_ACCESSO = new Set([
  'admin',
  'free',
  'agenzia',
  'rivenditore',
  'studio',
])

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

/** Visita rossa da 90 giorni, telefonata da 10. Data vuota o assente = rossa. */
export function statoDaDataCampo(
  iso: string | null | undefined,
  sogliaGiorni: number,
  now = new Date(),
): UltimoAccessoStato {
  const s = iso?.slice(0, 10) ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'rosso'
  const [anno, mese, giorno] = s.split('-').map(Number)
  const data = new Date(anno, mese - 1, giorno)
  const oggi = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const giorni = Math.floor((oggi.getTime() - data.getTime()) / MS_GIORNO)
  if (giorni >= sogliaGiorni) return 'rosso'
  return 'verde'
}

export function formattaDataCampo(iso: string | null | undefined): string | null {
  const s = iso?.slice(0, 10) ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [anno, mese, giorno] = s.split('-')
  return `${giorno}/${mese}/${anno}`
}

export function isSessioneScadutaPerRiloggio(
  lastSignInAt: string | null | undefined,
  now = Date.now(),
): boolean {
  const date = parseUltimoAccessoDate(lastSignInAt)
  if (!date) return false
  return now - date.getTime() > SESSIONE_MAX_MS
}

const LIST_USERS_PER_PAGE = 100
const LIST_USERS_MAX_PAGES = 40

/**
 * `listUsers` con perPage 1000 non risponde in tempo e Vercel chiude la funzione a 25s.
 * Pagine piccole e un tetto di tempo: se Auth non risponde, si esce con quello già letto.
 */
async function listUsersEntro(
  svc: SupabaseClient,
  page: number,
  budgetMs: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const pending = svc.auth.admin.listUsers({ page, perPage: LIST_USERS_PER_PAGE }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'listUsers'
    console.error('listUsers', message)
    return null
  })
  try {
    return await Promise.race([
      pending,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), Math.max(1, budgetMs))
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function fetchUltimoAccessoMap(
  svc: SupabaseClient,
  budgetMs = 8000,
): Promise<{ map: Map<string, string>; completo: boolean }> {
  const map = new Map<string, string>()
  const deadline = Date.now() + budgetMs
  let completo = false

  for (let page = 1; page <= LIST_USERS_MAX_PAGES; page++) {
    const remaining = deadline - Date.now()
    if (remaining < 400) break
    const result = await listUsersEntro(svc, page, remaining)
    if (!result) break
    if (result.error) {
      console.error('fetchUltimoAccessoMap: listUsers', result.error.message)
      break
    }
    const users = result.data?.users ?? []
    for (const user of users) {
      if (user.last_sign_in_at) {
        map.set(user.id, user.last_sign_in_at)
      }
    }
    if (users.length < LIST_USERS_PER_PAGE) {
      completo = true
      break
    }
  }

  return { map, completo }
}

/** Cerca un account Authentication per email, anche se manca la riga in `profili`. */
export async function findAuthUserByEmail(
  svc: SupabaseClient,
  email: string,
  budgetMs = 12000,
): Promise<{ id: string; email: string | undefined; last_sign_in_at: string | undefined; created_at: string } | null> {
  const needle = email.trim().toLowerCase()
  if (!needle.includes('@')) return null

  const deadline = Date.now() + budgetMs
  for (let page = 1; page <= LIST_USERS_MAX_PAGES; page++) {
    const remaining = deadline - Date.now()
    if (remaining < 400) break
    const result = await listUsersEntro(svc, page, remaining)
    if (!result) break
    if (result.error) {
      console.error('findAuthUserByEmail: listUsers', result.error.message)
      break
    }
    const users = result.data?.users ?? []
    if (users.length === 0) break
    const hit = users.find((user) => (user.email ?? '').toLowerCase() === needle)
    if (hit) {
      return {
        id: hit.id,
        email: hit.email,
        last_sign_in_at: hit.last_sign_in_at,
        created_at: hit.created_at,
      }
    }
    if (users.length < LIST_USERS_PER_PAGE) break
  }
  return null
}

export function recoveryRedirectTo(origin?: string | null): string | undefined {
  const base = (origin || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  return base ? `${base}/reset-password` : undefined
}

/** Link per impostare la password: si copia e si manda a mano (WhatsApp/email). Non invia mail. */
export async function generatePasswordRecoveryLink(
  svc: SupabaseClient,
  email: string,
  redirectTo?: string,
): Promise<{ link: string | null; error: string | null }> {
  const needle = email.trim().toLowerCase()
  if (!needle.includes('@')) return { link: null, error: 'Email non valida' }

  const { data, error } = await svc.auth.admin.generateLink({
    type: 'recovery',
    email: needle,
    ...(redirectTo ? { options: { redirectTo } } : {}),
  })
  if (error) {
    console.error('generatePasswordRecoveryLink', error.message)
    return { link: null, error: error.message }
  }
  const link = data?.properties?.action_link ?? null
  return { link, error: link ? null : 'Link di recupero non generato' }
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
