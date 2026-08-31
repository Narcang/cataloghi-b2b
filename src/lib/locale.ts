export const APP_LOCALES = ['it', 'ru', 'en'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

/** Bandiere in home: IT e RU. EN si attiva dopo, ma i cataloghi si possono già caricare. */
export const CHOOSER_LOCALES = ['it', 'ru'] as const satisfies readonly AppLocale[]

export const DEFAULT_LOCALE: AppLocale = 'it'
export const LOCALE_COOKIE = 'ladiva_locale'

export const LOCALE_LABEL: Record<AppLocale, string> = {
  it: 'Italiano',
  ru: 'Русский',
  en: 'English',
}

export const LOCALE_NATIVE: Record<AppLocale, string> = {
  it: 'Italia',
  ru: 'Россия',
  en: 'English',
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'it' || value === 'ru' || value === 'en'
}

export function parseAppLocale(value: string | null | undefined): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}
