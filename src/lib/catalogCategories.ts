export const CATALOG_CATEGORIES = [
  'Family 15',
  'Family 20',
  'Family Gres',
  'Capsule Collection',
  'Bricks',
  'Metal',
] as const

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

/** ID elemento DOM per ancore tipo /dashboard#catalog-cat-family-20 */
export function categoryToDomId(categoria: string): string {
  return `catalog-cat-${categoria.toLowerCase().replace(/\s+/g, '-')}`
}

/** Slug URL per la vetrina pubblica per categoria, es. "Family 20" → "family-20" */
export function categoryToSlug(categoria: string): string {
  return categoria.toLowerCase().replace(/\s+/g, '-')
}

export function categoryFromSlug(slug: string): CatalogCategory | null {
  const key = slug.toLowerCase()
  for (const c of CATALOG_CATEGORIES) {
    if (categoryToSlug(c) === key) return c
  }
  return null
}

export const CATEGORY_TILE_IMAGE: Record<CatalogCategory, string> = {
  'Family 15': '/catalog/family-15.png',
  'Family 20': '/catalog/family-20.png',
  'Family Gres': '/catalog/family-gres.png',
  'Capsule Collection': '/catalog/capsule-collection.png',
  Bricks: '/catalog/bricks.png',
  Metal: '/catalog/metal.png',
}
