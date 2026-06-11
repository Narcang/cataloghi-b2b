import { STUDIO_CATALOG_CATEGORY } from '@/lib/catalogCategories'

export type CatalogDeliveryMode = 'pdf' | 'zip-download'

/** Categorie che supportano il download ZIP (oltre alla categoria Studio base). */
const ZIP_DOWNLOAD_CATEGORIES = new Set<string>([
  STUDIO_CATALOG_CATEGORY,
  'File 2D',
  'File 3D',
])

export function isZipStoragePath(urlFile: string | null | undefined): boolean {
  return Boolean(urlFile?.toLowerCase().endsWith('.zip'))
}

/** Restituisce true se la categoria prevede upload ZIP (indipendentemente dall'estensione del file). */
export function isZipDownloadCategory(categoria: string | null | undefined): boolean {
  return ZIP_DOWNLOAD_CATEGORIES.has(categoria ?? '')
}

/** Cataloghi caricati come archivio ZIP scaricabile (Studio, Studio 2D, Studio 3D). */
export function isStudioZipCatalog(categoria: string | null | undefined, urlFile: string | null | undefined): boolean {
  return isZipDownloadCategory(categoria) && isZipStoragePath(urlFile)
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
