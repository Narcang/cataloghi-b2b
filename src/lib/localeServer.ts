import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE, type AppLocale } from '@/lib/locale'

export async function getLocaleCookie(): Promise<AppLocale | null> {
  const store = await cookies()
  const raw = store.get(LOCALE_COOKIE)?.value
  return isAppLocale(raw) ? raw : null
}

export async function getAppLocale(): Promise<AppLocale> {
  return (await getLocaleCookie()) ?? DEFAULT_LOCALE
}
