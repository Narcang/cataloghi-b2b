import { isCatalogLocale, parseCatalogLocale, type AppLocale, type CatalogLocale } from '@/lib/locale'

export function parseCatalogLingua(value: unknown): CatalogLocale {
  return parseCatalogLocale(typeof value === 'string' ? value : null)
}

/**
 * Quali `lingua` in tabella servono per questa UI.
 * RU: solo PDF russi. EN: file EN dedicati, altrimenti IT.
 * FR/DE/EL/PL/UK: per ora i PDF italiani (file dedicati dopo).
 */
export function catalogLingueForLocale(locale: AppLocale): CatalogLocale[] {
  if (locale === 'ru') return ['ru']
  if (locale === 'en') return ['en', 'it']
  return ['it']
}

type CatalogLinguaRow = {
  id: string
  lingua?: unknown
  categoria?: unknown
  titolo?: unknown
}

function catalogMatchKey(row: CatalogLinguaRow): string {
  return `${String(row.categoria ?? '').trim()}|${String(row.titolo ?? '').trim()}`
}

/** Keep EN rows; keep IT rows only when no EN exists for the same category+title. */
export function preferCatalogLingua<T extends CatalogLinguaRow>(rows: T[], locale: AppLocale): T[] {
  if (locale === 'en') {
    const enKeys = new Set(
      rows.filter((row) => parseCatalogLingua(row.lingua) === 'en').map(catalogMatchKey),
    )

    return rows.filter((row) => {
      const lang = parseCatalogLingua(row.lingua)
      if (lang === 'en') return true
      if (lang !== 'it') return false
      return !enKeys.has(catalogMatchKey(row))
    })
  }

  if (locale === 'ru') {
    return rows.filter((row) => parseCatalogLingua(row.lingua) === 'ru')
  }

  return rows.filter((row) => parseCatalogLingua(row.lingua) === 'it')
}

export function pickCatalogForLocale<T extends { lingua?: unknown }>(
  candidates: T[],
  locale: AppLocale,
): T | undefined {
  if (locale === 'en') {
    return (
      candidates.find((row) => parseCatalogLingua(row.lingua) === 'en') ??
      candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
    )
  }
  if (locale === 'ru') {
    return candidates.find((row) => parseCatalogLingua(row.lingua) === 'ru')
  }
  return candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
}

/** Admin tabs: English lists dedicated EN files, otherwise the Italian catalog of the same title. */
export function catalogsForAdminLinguaTab<T extends CatalogLinguaRow>(
  rows: T[],
  tab: CatalogLocale | 'all',
): T[] {
  if (tab === 'all') return rows
  if (tab === 'en') return preferCatalogLingua(rows, 'en')
  return rows.filter((row) => parseCatalogLingua(row.lingua) === tab)
}

export function isEnglishFallbackCatalog(row: CatalogLinguaRow, tab: CatalogLocale | 'all'): boolean {
  return tab === 'en' && parseCatalogLingua(row.lingua) === 'it'
}

export function defaultCatalogTab(uiLocale: AppLocale): CatalogLocale {
  return isCatalogLocale(uiLocale) ? uiLocale : 'it'
}
