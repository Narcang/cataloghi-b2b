export const CATALOG_CATEGORIES = [
  'Family 15',
  'Family 20',
  'Family Gres',
  'Capsule Collection',
  'Bricks',
  'Metal',
  'Studio',
  'Partner',
  'Agenti',
] as const

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

/** Categoria riservata agli agenti (ruolo): i partner/distributori non la vedono in dashboard né in SELECT (RLS). */
export const AGENTI_CATALOG_CATEGORY = 'Agenti' satisfies CatalogCategory

/** Categoria riservata: visibile in dashboard solo dopo login (non agli ospiti). */
export const PARTNER_CATALOG_CATEGORY = 'Partner' satisfies CatalogCategory

/** Linea dedicata agli studi / progettazione (login obbligatorio per ospiti). */
export const STUDIO_CATALOG_CATEGORY = 'Studio' satisfies CatalogCategory

/**
 * Categorie "di base" per il profilo con ruolo `studio` (oltre alla linea {@link STUDIO_CATALOG_CATEGORY}).
 * Non include Bricks, Metal, Partner, Agenti.
 */
export const STUDIO_ROLE_BASE_CATEGORIES = [
  'Family 15',
  'Family 20',
  'Family Gres',
  'Capsule Collection',
] as const satisfies readonly CatalogCategory[]

const STUDIO_ROLE_ALLOWED = new Set<CatalogCategory>([
  ...STUDIO_ROLE_BASE_CATEGORIES,
  STUDIO_CATALOG_CATEGORY,
])

export function isCatalogCategoryAllowedForStudioRole(categoria: string | null | undefined): boolean {
  if (!categoria) return false
  return STUDIO_ROLE_ALLOWED.has(categoria as CatalogCategory)
}

const LOGIN_ONLY_CATALOG_CATEGORIES = new Set<CatalogCategory>([
  PARTNER_CATALOG_CATEGORY,
  AGENTI_CATALOG_CATEGORY,
  STUDIO_CATALOG_CATEGORY,
])

export function isLoginOnlyCatalogCategory(categoria: string | null | undefined): boolean {
  if (!categoria) return false
  return LOGIN_ONLY_CATALOG_CATEGORIES.has(categoria as CatalogCategory)
}

/** Categorie catalogo visibili senza aree riservate (Family, Bricks, Metal, …). */
export const PUBLIC_CATALOG_CATEGORIES = CATALOG_CATEGORIES.filter(
  (c) => !LOGIN_ONLY_CATALOG_CATEGORIES.has(c),
)

/** Listini riservati ai partner (distributore): area dedicata in dashboard. */
export const PARTNER_LISTINI_CATEGORIES = [
  PARTNER_CATALOG_CATEGORY,
  STUDIO_CATALOG_CATEGORY,
] as const satisfies readonly CatalogCategory[]

const PARTNER_LISTINI_SET = new Set<CatalogCategory>(PARTNER_LISTINI_CATEGORIES)

export function isPartnerListiniCategory(categoria: string | null | undefined): boolean {
  if (!categoria) return false
  return PARTNER_LISTINI_SET.has(categoria as CatalogCategory)
}

export function partnerListiniDashboardCategories(): CatalogCategory[] {
  return [...PARTNER_LISTINI_CATEGORIES]
}

export function isAgenteReservedCategory(categoria: string | null | undefined): boolean {
  return categoria === AGENTI_CATALOG_CATEGORY
}

export function agenteReservedDashboardCategories(): CatalogCategory[] {
  return [AGENTI_CATALOG_CATEGORY]
}

/**
 * Sezioni cataloghi in dashboard:
 * - Ospite: niente Partner / Agenti / Studio (serve login).
 * - Ruolo `studio`: solo Family 15/20/Gres, Capsule Collection e linea Studio.
 * - Partner (distributore): categorie pubbliche; listini Partner/Studio in /dashboard/listini-partner.
 * - Agente: categorie pubbliche; linea Agenti in /dashboard/documentazione-agente.
 * - Altri utenti autenticati: tutte le categorie (inclusa Studio).
 */
export function categoriesVisibleOnDashboard(
  ruoloProfilo: string | null | undefined,
  isAuthenticated: boolean,
): CatalogCategory[] {
  if (!isAuthenticated) {
    return [...PUBLIC_CATALOG_CATEGORIES]
  }
  if (ruoloProfilo === 'studio') {
    return CATALOG_CATEGORIES.filter((c) => STUDIO_ROLE_ALLOWED.has(c))
  }
  if (ruoloProfilo === 'distributore' || ruoloProfilo === 'agente') {
    return [...PUBLIC_CATALOG_CATEGORIES]
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
  Studio: '/catalog/capsule-collection.png',
  Partner: '/catalog/capsule-collection.png',
  Agenti: '/catalog/family-gres.png',
}
