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

function dedicatedKeysForLocale<T extends CatalogLinguaRow>(rows: T[], locale: CatalogLocale): Set<string> {
  return new Set(
    rows.filter((row) => parseCatalogLingua(row.lingua) === locale).map(catalogMatchKey),
  )
}

/** File della lingua; PDF italiani solo per le categorie condivise, se manca il dedicato. */
export function preferCatalogLingua<T extends CatalogLinguaRow>(rows: T[], locale: AppLocale): T[] {
  if (locale === 'en' || locale === 'ru') {
    const dedicatedKeys = dedicatedKeysForLocale(rows, locale)

    return rows.filter((row) => {
      const lang = parseCatalogLingua(row.lingua)
      if (lang === locale) return true
      if (lang !== 'it') return false
      if (isLanguageSpecificCategory(rowCategory(row))) return false
      return !dedicatedKeys.has(catalogMatchKey(row))
    })
  }

  return rows.filter((row) => parseCatalogLingua(row.lingua) === 'it')
}

export function pickCatalogForLocale<T extends { lingua?: unknown; categoria?: unknown }>(
  candidates: T[],
  locale: AppLocale,
): T | undefined {
  if (locale === 'en' || locale === 'ru') {
    const dedicated = candidates.find((row) => parseCatalogLingua(row.lingua) === locale)
    if (dedicated) return dedicated
    const itHit = candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
    if (itHit && !isLanguageSpecificCategory(rowCategory(itHit))) return itHit
    return undefined
  }
  return candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
}

/** Admin: in RU/EN l’elenco Family resta visibile (PDF italiano); le categorie testuali solo se c’è il file dedicato. */
export function catalogsForAdminLinguaTab<T extends CatalogLinguaRow>(
  rows: T[],
  tab: CatalogLocale | 'all',
): T[] {
  if (tab === 'all') return rows
  if (tab === 'en' || tab === 'ru') return preferCatalogLingua(rows, tab)
  return rows.filter((row) => parseCatalogLingua(row.lingua) === tab)
}

/** Italian PDF shown in a non-Italian admin tab (categorie condivise). */
export function isItalianFallbackCatalog(row: CatalogLinguaRow, tab: CatalogLocale | 'all'): boolean {
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
