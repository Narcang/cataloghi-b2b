import { isLanguageSpecificCategory } from '@/lib/catalogCategories'
import { isCatalogLocale, parseCatalogLocale, type AppLocale, type CatalogLocale } from '@/lib/locale'

export function parseCatalogLingua(value: unknown): CatalogLocale {
  return parseCatalogLocale(typeof value === 'string' ? value : null)
}

function rowCategory(row: { categoria?: unknown }): string | null {
  return typeof row.categoria === 'string' ? row.categoria : null
}

/**
 * Quali `lingua` in tabella servono per questa UI.
 * RU/EN: file dedicati + PDF italiani delle categorie condivise (Family, fotografici, File 2D/3D).
 * Listini / Agenti / Merchandising / Power Point: solo il file della lingua.
 * FR/DE/EL/PL/UK: PDF italiani (le categorie testuali arriveranno per lingua).
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

/** File della lingua; PDF italiani solo per le categorie condivise, se manca il dedicato. */
export function preferCatalogLingua<T extends CatalogLinguaRow>(rows: T[], locale: AppLocale): T[] {
  if (locale === 'it') {
    return rows.filter((row) => parseCatalogLingua(row.lingua) === 'it')
  }

  const dedicatedKeys = new Set(
    rows.filter((row) => String(row.lingua ?? '') === locale).map(catalogMatchKey),
  )

  return rows.filter((row) => {
    const lang = parseCatalogLingua(row.lingua)
    if (String(row.lingua ?? '') === locale || lang === locale) return true
    if (lang !== 'it') return false
    if (isLanguageSpecificCategory(rowCategory(row))) return false
    return !dedicatedKeys.has(catalogMatchKey(row))
  })
}

export function pickCatalogForLocale<T extends { lingua?: unknown; categoria?: unknown }>(
  candidates: T[],
  locale: AppLocale,
): T | undefined {
  if (locale === 'it') {
    return candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
  }
  const dedicated = candidates.find((row) => String(row.lingua ?? '') === locale)
  if (dedicated) return dedicated
  const catalogHit = candidates.find((row) => parseCatalogLingua(row.lingua) === locale)
  if (catalogHit) return catalogHit
  const itHit = candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
  if (itHit && !isLanguageSpecificCategory(rowCategory(itHit))) return itHit
  return undefined
}

/** Admin: in ogni lingua l’elenco Family resta visibile (PDF italiano); le categorie testuali solo se c’è il file dedicato. */
export function catalogsForAdminLinguaTab<T extends CatalogLinguaRow>(
  rows: T[],
  tab: AppLocale | 'all',
): T[] {
  if (tab === 'all') return rows
  return preferCatalogLingua(rows, tab)
}

/** Italian PDF shown in a non-Italian admin tab (categorie condivise). */
export function isItalianFallbackCatalog(row: CatalogLinguaRow, tab: AppLocale | 'all'): boolean {
  if (tab === 'all' || tab === 'it') return false
  if (parseCatalogLingua(row.lingua) !== 'it') return false
  return !isLanguageSpecificCategory(rowCategory(row))
}

export function isEnglishFallbackCatalog(row: CatalogLinguaRow, tab: CatalogLocale | 'all'): boolean {
  return isItalianFallbackCatalog(row, tab)
}

export function defaultCatalogTab(uiLocale: AppLocale): CatalogLocale {
  return isCatalogLocale(uiLocale) ? uiLocale : 'it'
}
