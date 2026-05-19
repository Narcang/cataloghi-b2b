import { STUDIO_CATALOG_CATEGORY } from '@/lib/catalogCategories'

export type CatalogDeliveryMode = 'pdf' | 'zip-download'

export function isZipStoragePath(urlFile: string | null | undefined): boolean {
  return Boolean(urlFile?.toLowerCase().endsWith('.zip'))
}

/** Cataloghi Studio caricati come archivio ZIP (max 15 MB). */
export function isStudioZipCatalog(categoria: string | null | undefined, urlFile: string | null | undefined): boolean {
  return categoria === STUDIO_CATALOG_CATEGORY && isZipStoragePath(urlFile)
}

export function getCatalogDeliveryMode(
  categoria: string | null | undefined,
  urlFile: string | null | undefined,
): CatalogDeliveryMode {
  return isStudioZipCatalog(categoria, urlFile) ? 'zip-download' : 'pdf'
}

export function downloadFileNameFromCatalog(titolo: string | null, urlFile: string): string {
  const fromPath = urlFile.split('/').pop()
  if (fromPath && /\.zip$/i.test(fromPath)) return fromPath
  const base = (titolo ?? 'catalogo-studio').replace(/[^\w\s.-]/gi, '').trim() || 'catalogo-studio'
  return `${base}.zip`
}
