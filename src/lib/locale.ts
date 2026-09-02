export const APP_LOCALES = ['it', 'ru', 'en', 'fr', 'de', 'el', 'pl', 'uk'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

/** Lingua del file catalogo (i PDF dedicati FR/DE/EL/PL/UK arriveranno dopo). */
export const CATALOG_LOCALES = ['it', 'ru', 'en'] as const
export type CatalogLocale = (typeof CATALOG_LOCALES)[number]

/** Selettore pubblico: tutte le lingue UI. */
export const CHOOSER_LOCALES = APP_LOCALES

export const DEFAULT_LOCALE: AppLocale = 'it'
export const LOCALE_COOKIE = 'ladiva_locale'

export const LOCALE_LABEL: Record<AppLocale, string> = {
  it: 'Italiano',
  ru: 'Русский',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  el: 'Ελληνικά',
  pl: 'Polski',
  uk: 'Українська',
}

export const LOCALE_NATIVE: Record<AppLocale, string> = {
  it: 'Italia',
  ru: 'Россия',
  en: 'English',
  fr: 'France',
  de: 'Deutschland',
  el: 'Ελλάδα',
  pl: 'Polska',
  uk: 'Україна',
}

export const LOCALE_SHORT: Record<AppLocale, string> = {
  it: 'IT',
  ru: 'RU',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
  el: 'EL',
  pl: 'PL',
  uk: 'UK',
}

export const LOCALE_FLAG: Record<AppLocale, string> = {
  it: '🇮🇹',
  ru: '🇷🇺',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  el: '🇬🇷',
  pl: '🇵🇱',
  uk: '🇺🇦',
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale)
}

export function isCatalogLocale(value: string | null | undefined): value is CatalogLocale {
  return value === 'it' || value === 'ru' || value === 'en'
}

export function parseAppLocale(value: string | null | undefined): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

export function parseCatalogLocale(value: string | null | undefined): CatalogLocale {
  return isCatalogLocale(value) ? value : 'it'
}
