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

export const CATEGORY_TILE_IMAGE: Record<CatalogCategory, string> = {
  'Family 15': '/catalog/family-15.png',
  'Family 20': '/catalog/family-20.png',
  'Family Gres': '/catalog/family-gres.png',
  'Capsule Collection': '/catalog/capsule-collection.png',
  Bricks: '/catalog/bricks.png',
  Metal: '/catalog/metal.png',
}
