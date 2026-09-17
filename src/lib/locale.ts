export const APP_LOCALES = ['it', 'ru', 'en', 'es', 'fr', 'de', 'nl', 'el', 'pl', 'uk'] as const
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
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  nl: 'Nederlands',
  el: 'Ελληνικά',
  pl: 'Polski',
  uk: 'Українська',
}

export const LOCALE_NATIVE: Record<AppLocale, string> = {
  it: 'Italia',
  ru: 'Россия',
  en: 'English',
  es: 'España',
  fr: 'France',
  de: 'Deutschland',
  nl: 'Nederland',
  el: 'Ελλάδα',
  pl: 'Polska',
  uk: 'Україна',
}

export const LOCALE_SHORT: Record<AppLocale, string> = {
  it: 'IT',
  ru: 'RU',
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  nl: 'NL',
  el: 'EL',
  pl: 'PL',
  uk: 'UK',
}

export const LOCALE_FLAG: Record<AppLocale, string> = {
  it: '🇮🇹',
  ru: '🇷🇺',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  nl: '🇳🇱',
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
    es: 'Spagnolo',
    fr: 'Francese',
    de: 'Tedesco',
    nl: 'Olandese',
    el: 'Greco',
    pl: 'Polacco',
    uk: 'Ucraino',
  },
  ru: {
    it: 'Итальянский',
    ru: 'Русский',
    en: 'Английский',
    es: 'Испанский',
    fr: 'Французский',
    de: 'Немецкий',
    nl: 'Нидерландский',
    el: 'Греческий',
    pl: 'Польский',
    uk: 'Украинский',
  },
  en: {
    it: 'Italian',
    ru: 'Russian',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    nl: 'Dutch',
    el: 'Greek',
    pl: 'Polish',
    uk: 'Ukrainian',
  },
  es: {
    it: 'Italiano',
    ru: 'Ruso',
    en: 'Inglés',
    es: 'Español',
    fr: 'Francés',
    de: 'Alemán',
    nl: 'Neerlandés',
    el: 'Griego',
    pl: 'Polaco',
    uk: 'Ucraniano',
  },
  fr: {
    it: 'Italien',
    ru: 'Russe',
    en: 'Anglais',
    es: 'Espagnol',
    fr: 'Français',
    de: 'Allemand',
    nl: 'Néerlandais',
    el: 'Grec',
    pl: 'Polonais',
    uk: 'Ukrainien',
  },
  de: {
    it: 'Italienisch',
    ru: 'Russisch',
    en: 'Englisch',
    es: 'Spanisch',
    fr: 'Französisch',
    de: 'Deutsch',
    nl: 'Niederländisch',
    el: 'Griechisch',
    pl: 'Polnisch',
    uk: 'Ukrainisch',
  },
  nl: {
    it: 'Italiaans',
    ru: 'Russisch',
    en: 'Engels',
    es: 'Spaans',
    fr: 'Frans',
    de: 'Duits',
    nl: 'Nederlands',
    el: 'Grieks',
    pl: 'Pools',
    uk: 'Oekraïens',
  },
  el: {
    it: 'Ιταλικά',
    ru: 'Ρωσικά',
    en: 'Αγγλικά',
    es: 'Ισπανικά',
    fr: 'Γαλλικά',
    de: 'Γερμανικά',
    nl: 'Ολλανδικά',
    el: 'Ελληνικά',
    pl: 'Πολωνικά',
    uk: 'Ουκρανικά',
  },
  pl: {
    it: 'Włoski',
    ru: 'Rosyjski',
    en: 'Angielski',
    es: 'Hiszpański',
    fr: 'Francuski',
    de: 'Niemiecki',
    nl: 'Niderlandzki',
    el: 'Grecki',
    pl: 'Polski',
    uk: 'Ukraiński',
  },
  uk: {
    it: 'Італійська',
    ru: 'Російська',
    en: 'Англійська',
    es: 'Іспанська',
    fr: 'Французька',
    de: 'Німецька',
    nl: 'Нідерландська',
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
