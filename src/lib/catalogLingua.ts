import { isLanguageSharedCategory } from '@/lib/catalogCategories'
import { isCatalogLocale, parseCatalogLocale, type AppLocale, type CatalogLocale } from '@/lib/locale'

export function parseCatalogLingua(value: unknown): CatalogLocale {
  return parseCatalogLocale(typeof value === 'string' ? value : null)
}

function rowCategory(row: { categoria?: unknown }): string | null {
  return typeof row.categoria === 'string' ? row.categoria : null
}

/**
 * Quali `lingua` in tabella servono per questa UI.
 * RU: PDF russi + italiani delle categorie condivise.
 * EN: file EN dedicati, altrimenti IT.
 * FR/DE/EL/PL/UK: PDF italiani (file dedicati dopo, tranne le categorie già condivise).
 */
export function catalogLingueForLocale(locale: AppLocale): CatalogLocale[] {
  if (locale === 'ru') return ['ru', 'it']
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

/** Keep locale-specific rows; keep IT rows as fallback when allowed. */
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
    const ruKeys = new Set(
      rows.filter((row) => parseCatalogLingua(row.lingua) === 'ru').map(catalogMatchKey),
    )

    return rows.filter((row) => {
      const lang = parseCatalogLingua(row.lingua)
      if (lang === 'ru') return true
      if (lang !== 'it') return false
      if (!isLanguageSharedCategory(rowCategory(row))) return false
      return !ruKeys.has(catalogMatchKey(row))
    })
  }

  return rows.filter((row) => parseCatalogLingua(row.lingua) === 'it')
}

export function pickCatalogForLocale<T extends { lingua?: unknown; categoria?: unknown }>(
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
    const ruHit = candidates.find((row) => parseCatalogLingua(row.lingua) === 'ru')
    if (ruHit) return ruHit
    const itHit = candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
    if (itHit && isLanguageSharedCategory(rowCategory(itHit))) return itHit
    return undefined
  }
  return candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
}

/** Admin tabs: EN/RU list dedicated files, otherwise the shared Italian PDF. */
export function catalogsForAdminLinguaTab<T extends CatalogLinguaRow>(
  rows: T[],
  tab: CatalogLocale | 'all',
): T[] {
  if (tab === 'all') return rows
  if (tab === 'en') return preferCatalogLingua(rows, 'en')
  if (tab === 'ru') return preferCatalogLingua(rows, 'ru')
  return rows.filter((row) => parseCatalogLingua(row.lingua) === tab)
}

/** Italian PDF shown in a non-Italian admin tab (EN fallback, or shared categories on RU). */
export function isItalianFallbackCatalog(row: CatalogLinguaRow, tab: CatalogLocale | 'all'): boolean {
  if (tab === 'all' || tab === 'it') return false
  if (parseCatalogLingua(row.lingua) !== 'it') return false
  if (tab === 'en') return true
  if (tab === 'ru') return isLanguageSharedCategory(rowCategory(row))
  return false
}

export function isEnglishFallbackCatalog(row: CatalogLinguaRow, tab: CatalogLocale | 'all'): boolean {
  return isItalianFallbackCatalog(row, tab)
}

export function defaultCatalogTab(uiLocale: AppLocale): CatalogLocale {
  return isCatalogLocale(uiLocale) ? uiLocale : 'it'
}
