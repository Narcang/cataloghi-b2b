export const APP_LOCALES = ['it', 'ru', 'en', 'fr', 'de', 'el', 'pl', 'uk'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

/** Lingua del file in tabella cataloghi: stessa lista della UI. */
export const CATALOG_LOCALES = APP_LOCALES
export type CatalogLocale = AppLocale

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

/** Nome della lingua `target` scritto nella lingua dell’interfaccia `ui`. */
export const LOCALE_NAME_IN: Record<AppLocale, Record<AppLocale, string>> = {
  it: {
    it: 'Italiano',
    ru: 'Russo',
    en: 'Inglese',
    fr: 'Francese',
    de: 'Tedesco',
    el: 'Greco',
    pl: 'Polacco',
    uk: 'Ucraino',
  },
  ru: {
    it: 'Итальянский',
    ru: 'Русский',
    en: 'Английский',
    fr: 'Французский',
    de: 'Немецкий',
    el: 'Греческий',
    pl: 'Польский',
    uk: 'Украинский',
  },
  en: {
    it: 'Italian',
    ru: 'Russian',
    en: 'English',
    fr: 'French',
    de: 'German',
    el: 'Greek',
    pl: 'Polish',
    uk: 'Ukrainian',
  },
  fr: {
    it: 'Italien',
    ru: 'Russe',
    en: 'Anglais',
    fr: 'Français',
    de: 'Allemand',
    el: 'Grec',
    pl: 'Polonais',
    uk: 'Ukrainien',
  },
  de: {
    it: 'Italienisch',
    ru: 'Russisch',
    en: 'Englisch',
    fr: 'Französisch',
    de: 'Deutsch',
    el: 'Griechisch',
    pl: 'Polnisch',
    uk: 'Ukrainisch',
  },
  el: {
    it: 'Ιταλικά',
    ru: 'Ρωσικά',
    en: 'Αγγλικά',
    fr: 'Γαλλικά',
    de: 'Γερμανικά',
    el: 'Ελληνικά',
    pl: 'Πολωνικά',
    uk: 'Ουκρανικά',
  },
  pl: {
    it: 'Włoski',
    ru: 'Rosyjski',
    en: 'Angielski',
    fr: 'Francuski',
    de: 'Niemiecki',
    el: 'Grecki',
    pl: 'Polski',
    uk: 'Ukraiński',
  },
  uk: {
    it: 'Італійська',
    ru: 'Російська',
    en: 'Англійська',
    fr: 'Французька',
    de: 'Німецька',
    el: 'Грецька',
    pl: 'Польська',
    uk: 'Українська',
  },
}

export function localeNameIn(uiLocale: AppLocale, target: AppLocale): string {
  return LOCALE_NAME_IN[uiLocale][target]
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale)
}

export function isCatalogLocale(value: string | null | undefined): value is CatalogLocale {
  return isAppLocale(value)
}

export function parseAppLocale(value: string | null | undefined): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

export function parseCatalogLocale(value: string | null | undefined): CatalogLocale {
  return isCatalogLocale(value) ? value : 'it'
}
