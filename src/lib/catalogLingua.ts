import { parseAppLocale, type AppLocale } from '@/lib/locale'

export function parseCatalogLingua(value: unknown): AppLocale {
  return parseAppLocale(typeof value === 'string' ? value : null)
}

/** English uses dedicated EN files, otherwise the Italian PDF (same file). */
export function catalogLingueForLocale(locale: AppLocale): AppLocale[] {
  if (locale === 'en') return ['en', 'it']
  return [locale]
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
  if (locale !== 'en') {
    return rows.filter((row) => parseCatalogLingua(row.lingua) === locale)
  }

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
  return candidates.find((row) => parseCatalogLingua(row.lingua) === locale)
}

/** Admin tabs: English lists dedicated EN files, otherwise the Italian catalog of the same title. */
export function catalogsForAdminLinguaTab<T extends CatalogLinguaRow>(
  rows: T[],
  tab: AppLocale | 'all',
): T[] {
  if (tab === 'all') return rows
  if (tab === 'en') return preferCatalogLingua(rows, 'en')
  return rows.filter((row) => parseCatalogLingua(row.lingua) === tab)
}

export function isEnglishFallbackCatalog(row: CatalogLinguaRow, tab: AppLocale | 'all'): boolean {
  return tab === 'en' && parseCatalogLingua(row.lingua) === 'it'
}
