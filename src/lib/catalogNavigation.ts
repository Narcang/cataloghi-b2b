import { categoryToDomId, categoryToSlug } from '@/lib/catalogCategories'

export const CATALOG_RETURN_TO_PARAM = 'returnTo'

/** Link al viewer PDF con destinazione del pulsante indietro. */
export function catalogPdfHref(catalogoId: string, returnTo: string): string {
  const params = new URLSearchParams()
  params.set(CATALOG_RETURN_TO_PARAM, returnTo)
  return `/cataloghi/${catalogoId}?${params.toString()}`
}

/** Solo percorsi relativi interni (no //). */
export function safeCatalogReturnTo(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.includes('\\') || trimmed.includes('\n') || trimmed.includes('\r')) return fallback
  return trimmed
}

/** Vetrina pubblica per categoria (homepage → categoria → PDF). */
export function publicCategoryCatalogReturnTo(categoria: string | null | undefined): string {
  if (categoria) {
    return `/cataloghi/categoria/${categoryToSlug(categoria)}`
  }
  return '/'
}

export function dashboardCatalogReturnTo(categoria?: string | null): string {
  const hash = categoria ? `#${categoryToDomId(categoria)}` : ''
  return `/dashboard${hash}`
}

/** Back dal PDF verso dashboard o sotto-sezioni riservate (con ancora categoria). */
export function reservedAreaCatalogReturnTo(
  basePath: string,
  categoria?: string | null,
): string {
  if (basePath === '/dashboard') return dashboardCatalogReturnTo(categoria)
  const hash = categoria ? `#${categoryToDomId(categoria)}` : ''
  return `${basePath}${hash}`
}

export function gestioneCataloghiHref(opts: {
  lingua?: string
  nome?: string
  categoriaSlug?: string | null
}): string {
  const params = new URLSearchParams()
  if (opts.lingua) params.set('lingua', opts.lingua)
  if (opts.nome) params.set('nome', opts.nome)
  if (opts.categoriaSlug) params.set('categoria', opts.categoriaSlug)
  const q = params.toString()
  return q ? `/dashboard/gestione-cataloghi?${q}` : '/dashboard/gestione-cataloghi'
}
