export const CATALOG_CATEGORIES = [
  'Family 15',
  'Family 20',
  'Family Gres',
  'Capsule Collection',
  'Bricks',
  'Metal',
  'Partner',
  'Agenti',
] as const

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

/** Categoria riservata agli agenti (ruolo): i partner/distributori non la vedono in dashboard né in SELECT (RLS). */
export const AGENTI_CATALOG_CATEGORY = 'Agenti' satisfies CatalogCategory

/**
 * Sezioni cataloghi in dashboard: admin, agenti e free vedono tutte le categorie;
 * i partner (distributore) vedono tutto tranne la categoria "Agenti".
 */
export function categoriesVisibleOnDashboard(ruoloProfilo: string | null | undefined): CatalogCategory[] {
  if (ruoloProfilo === 'distributore') {
    return CATALOG_CATEGORIES.filter((c) => c !== AGENTI_CATALOG_CATEGORY)
  }
  return [...CATALOG_CATEGORIES]
}

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
  Partner: '/catalog/capsule-collection.png',
  Agenti: '/catalog/family-gres.png',
}
