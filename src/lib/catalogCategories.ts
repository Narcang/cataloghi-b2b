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

/** Categoria riservata: visibile in dashboard solo dopo login (non agli ospiti). */
export const PARTNER_CATALOG_CATEGORY = 'Partner' satisfies CatalogCategory

const LOGIN_ONLY_CATALOG_CATEGORIES = new Set<CatalogCategory>([
  PARTNER_CATALOG_CATEGORY,
  AGENTI_CATALOG_CATEGORY,
])

export function isLoginOnlyCatalogCategory(categoria: string | null | undefined): boolean {
  if (!categoria) return false
  return LOGIN_ONLY_CATALOG_CATEGORIES.has(categoria as CatalogCategory)
}

/**
 * Sezioni cataloghi in dashboard:
 * - Ospite (non autenticato): niente categorie Partner / Agenti.
 * - Partner (distributore): tutte tranne la categoria "Agenti".
 * - Altri ruoli autenticati: tutte le categorie.
 */
export function categoriesVisibleOnDashboard(
  ruoloProfilo: string | null | undefined,
  isAuthenticated: boolean,
): CatalogCategory[] {
  if (!isAuthenticated) {
    return CATALOG_CATEGORIES.filter((c) => !LOGIN_ONLY_CATALOG_CATEGORIES.has(c))
  }
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
