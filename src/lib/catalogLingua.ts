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
 * File dedicato della lingua + PDF italiani delle categorie condivise (Family, fotografici, File 2D/3D).
 * Listini / Agenti / Merchandising / Power Point: file della lingua scelta;
 * in ucraino, se manca il PDF UK, si usa quello russo.
 */
export function catalogFallbackLocale(locale: AppLocale): CatalogLocale | null {
  if (locale === 'uk') return 'ru'
  return null
}

export function catalogLingueForLocale(locale: AppLocale): CatalogLocale[] {
  if (locale === 'it') return ['it']
  const fallback = catalogFallbackLocale(locale)
  if (fallback) return [locale, fallback, 'it']
  return [locale, 'it']
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

/** File della lingua; PDF italiani solo per le categorie condivise, se manca il dedicato.
 *  In ucraino le categorie testuali usano il PDF russo se non c’è il file UK. */
export function preferCatalogLingua<T extends CatalogLinguaRow>(rows: T[], locale: AppLocale): T[] {
  if (locale === 'it') {
    return rows.filter((row) => parseCatalogLingua(row.lingua) === 'it')
  }

  const dedicatedKeys = new Set(
    rows.filter((row) => parseCatalogLingua(row.lingua) === locale).map(catalogMatchKey),
  )
  const fallback = catalogFallbackLocale(locale)

  return rows.filter((row) => {
    const lang = parseCatalogLingua(row.lingua)
    const key = catalogMatchKey(row)
    if (lang === locale) return true
    if (
      fallback &&
      lang === fallback &&
      isLanguageSpecificCategory(rowCategory(row)) &&
      !dedicatedKeys.has(key)
    ) {
      return true
    }
    if (lang !== 'it') return false
    if (isLanguageSpecificCategory(rowCategory(row))) return false
    return !dedicatedKeys.has(key)
  })
}

export function pickCatalogForLocale<T extends { lingua?: unknown; categoria?: unknown }>(
  candidates: T[],
  locale: AppLocale,
): T | undefined {
  if (locale === 'it') {
    return candidates.find((row) => parseCatalogLingua(row.lingua) === 'it')
  }
  const dedicated = candidates.find((row) => parseCatalogLingua(row.lingua) === locale)
  if (dedicated) return dedicated
  const fallback = catalogFallbackLocale(locale)
  if (fallback) {
    const fbHit = candidates.find(
      (row) =>
        parseCatalogLingua(row.lingua) === fallback && isLanguageSpecificCategory(rowCategory(row)),
    )
    if (fbHit) return fbHit
  }
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

/** PDF russo mostrato nella scheda ucraina (Listini / Agenti / Merchandising / Power Point). */
export function isRussianFallbackCatalog(row: CatalogLinguaRow, tab: AppLocale | 'all'): boolean {
  if (tab !== 'uk') return false
  if (parseCatalogLingua(row.lingua) !== 'ru') return false
  return isLanguageSpecificCategory(rowCategory(row))
}

export function isEnglishFallbackCatalog(row: CatalogLinguaRow, tab: CatalogLocale | 'all'): boolean {
  return isItalianFallbackCatalog(row, tab)
}

export function defaultCatalogTab(uiLocale: AppLocale): CatalogLocale {
  return isCatalogLocale(uiLocale) ? uiLocale : 'it'
}
