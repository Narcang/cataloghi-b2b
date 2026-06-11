export const CATALOG_CATEGORIES = [
  'Family 15',
  'Family 20',
  'Family Gres',
  'Capsule Collection',
  'Bricks',
  'Metal',
  'Studio',
  'File 2D',
  'File 3D',
  'Partner',
  'Agenti',
  'Scontistiche',
  'Listini Netti',
  'Power Point',
  'Family 15 Fotografico',
  'Family 20 Fotografico',
  'Capsule Collection Fotografico',
  'Family Gres Fotografico',
  'Bricks Fotografico',
] as const

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

/** Categoria riservata agli agenti (ruolo): i partner/distributori non la vedono in dashboard né in SELECT (RLS). */
export const AGENTI_CATALOG_CATEGORY = 'Agenti' satisfies CatalogCategory

/** Listini sconti / condizioni commerciali riservati agli agenti. */
export const SCONISTICHE_CATALOG_CATEGORY = 'Scontistiche' satisfies CatalogCategory

/** Categorie nell'area riservata agente (documentazione-agente). */
export const AGENT_RESERVED_CATEGORIES = [
  AGENTI_CATALOG_CATEGORY,
  SCONISTICHE_CATALOG_CATEGORY,
] as const satisfies readonly CatalogCategory[]

const AGENT_RESERVED_SET = new Set<CatalogCategory>(AGENT_RESERVED_CATEGORIES)

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
  SCONISTICHE_CATALOG_CATEGORY,
  STUDIO_CATALOG_CATEGORY,
  'File 2D',
  'File 3D',
  'Listini Netti',
  'Power Point',
])

export function isLoginOnlyCatalogCategory(categoria: string | null | undefined): boolean {
  if (!categoria) return false
  return LOGIN_ONLY_CATALOG_CATEGORIES.has(categoria as CatalogCategory)
}

/**
 * Categorie nascoste dall'interfaccia utente (upload form, liste dashboard).
 * I file già caricati sotto queste categorie rimangono accessibili via link diretto.
 */
export const UI_HIDDEN_CATEGORIES = new Set<CatalogCategory>(['Studio', 'Metal'])

/** Categorie disponibili nel form di caricamento (esclude quelle nascoste dall'UI). */
export const CATALOG_CATEGORIES_FOR_UPLOAD = CATALOG_CATEGORIES.filter(
  (c) => !UI_HIDDEN_CATEGORIES.has(c),
)

/** Categorie catalogo visibili senza aree riservate (Family, Bricks, …). */
export const PUBLIC_CATALOG_CATEGORIES = CATALOG_CATEGORIES.filter(
  (c) => !LOGIN_ONLY_CATALOG_CATEGORIES.has(c) && !UI_HIDDEN_CATEGORIES.has(c),
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
  if (!categoria) return false
  return AGENT_RESERVED_SET.has(categoria as CatalogCategory)
}

/** Cataloghi visibili solo agli agenti (non ai partner/distributori). */
export function isAgentOnlyCatalogCategory(categoria: string | null | undefined): boolean {
  return isAgenteReservedCategory(categoria)
}

export function agenteReservedDashboardCategories(): CatalogCategory[] {
  return [...AGENT_RESERVED_CATEGORIES]
}

/**
 * Sezioni cataloghi in dashboard:
 * - Ospite: niente Partner / Agenti / Studio (serve login).
 * - Ruolo `studio`: solo Family 15/20/Gres, Capsule Collection e linea Studio.
 * - Partner (distributore): categorie pubbliche; listini Partner/Studio in /dashboard/listini-partner.
 * - Agente: categorie pubbliche; Agenti e Scontistiche in /dashboard/documentazione-agente.
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
    return CATALOG_CATEGORIES.filter((c) => STUDIO_ROLE_ALLOWED.has(c) && !UI_HIDDEN_CATEGORIES.has(c))
  }
  if (ruoloProfilo === 'distributore' || ruoloProfilo === 'agente') {
    return [...PUBLIC_CATALOG_CATEGORIES]
  }
  return CATALOG_CATEGORIES.filter((c) => !UI_HIDDEN_CATEGORIES.has(c))
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
  'File 2D': '/catalog/capsule-collection.png',
  'File 3D': '/catalog/capsule-collection.png',
  Partner: '/catalog/capsule-collection.png',
  Agenti: '/catalog/family-gres.png',
  Scontistiche: '/catalog/family-gres.png',
  'Listini Netti': '/catalog/family-gres.png',
  'Power Point': '/catalog/family-gres.png',
  'Family 15 Fotografico': '/catalog/family-15.png',
  'Family 20 Fotografico': '/catalog/family-20.png',
  'Capsule Collection Fotografico': '/catalog/capsule-collection.png',
  'Family Gres Fotografico': '/catalog/family-gres.png',
  'Bricks Fotografico': '/catalog/bricks.png',
}

/** Configurazione tile del portale per ogni ruolo. */
export type PortaleTile = {
  categoria: CatalogCategory
  label: string
  descrizione: string
}

export const PORTALE_TILES_PER_RUOLO: Record<string, PortaleTile[]> = {
  studio: [
    { categoria: 'File 2D', label: 'File 2D', descrizione: 'File tecnici 2D scaricabili' },
    { categoria: 'File 3D', label: 'File 3D', descrizione: 'File tecnici 3D scaricabili' },
  ],
  distributore: [
    { categoria: 'File 2D', label: 'File 2D', descrizione: 'File tecnici 2D scaricabili' },
    { categoria: 'File 3D', label: 'File 3D', descrizione: 'File tecnici 3D scaricabili' },
    { categoria: 'Partner', label: 'Listini Pubblici', descrizione: 'Listini prezzi' },
  ],
  agente: [
    { categoria: 'File 2D',      label: 'File 2D',             descrizione: 'File tecnici 2D scaricabili' },
    { categoria: 'File 3D',      label: 'File 3D',             descrizione: 'File tecnici 3D scaricabili' },
    { categoria: 'Partner',      label: 'Listini Pubblici',    descrizione: 'Listini prezzi' },
    { categoria: 'Listini Netti',label: 'Listini Netti', descrizione: 'Listini prezzi netti' },
    { categoria: 'Scontistiche', label: 'Scontistiche',  descrizione: 'Condizioni commerciali' },
    { categoria: 'Agenti',       label: 'Documentazione',descrizione: 'Documentazione riservata' },
    { categoria: 'Power Point',  label: 'Power Point',   descrizione: 'Presentazioni PowerPoint' },
  ],
}

/** Mappa categoria base → categoria fotografico corrispondente. */
export const FOTO_CATEGORY_MAP: Partial<Record<CatalogCategory, CatalogCategory>> = {
  'Family 15': 'Family 15 Fotografico',
  'Family 20': 'Family 20 Fotografico',
  'Capsule Collection': 'Capsule Collection Fotografico',
  'Family Gres': 'Family Gres Fotografico',
  'Bricks': 'Bricks Fotografico',
}
