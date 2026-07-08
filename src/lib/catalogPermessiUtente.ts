import {
  categoriesVisibleOnDashboard,
  isAgentOnlyCatalogCategory,
  portaleDashboardCategories,
  type CatalogCategory,
} from '@/lib/catalogCategories'

export type CatalogoPermessoRow = {
  id: string
  titolo: string | null
  categoria: string | null
  ruoli_visibili?: string[] | null
}

/** Ruoli equivalenti per la visibilità cataloghi (es. agenzia → agente). */
export function ruoliEquivalentiPerCatalogo(ruolo: string): string[] {
  if (ruolo === 'agenzia') return ['agenzia', 'agente']
  if (ruolo === 'partner_dipendente') return ['partner_dipendente', 'studio']
  return [ruolo]
}

function categoriaConsentitaLegacy(categoria: string | null, ruolo: string): boolean {
  if (!categoria) return false
  const portale = portaleDashboardCategories(ruolo)
  if (portale.length > 0) {
    return portale.includes(categoria as CatalogCategory)
  }
  if (isAgentOnlyCatalogCategory(categoria) && ruolo !== 'agente' && ruolo !== 'agenzia' && ruolo !== 'manager') {
    return false
  }
  const allowed = new Set(categoriesVisibleOnDashboard(ruolo, true))
  return allowed.has(categoria as CatalogCategory)
}

/** Catalogo assegnabile nella whitelist per un utente con questo ruolo. */
export function catalogoAssegnabileAUtente(catalogo: CatalogoPermessoRow, ruoloUtente: string): boolean {
  const ruoli = ruoliEquivalentiPerCatalogo(ruoloUtente)
  const rv = catalogo.ruoli_visibili ?? []

  if (rv.length > 0) {
    return ruoli.some(r => rv.includes(r))
  }

  return categoriaConsentitaLegacy(catalogo.categoria, ruoloUtente)
}

/** Cataloghi che l'admin può abilitare/disabilitare per un utente. */
export function cataloghiAssegnabiliAUtente(
  allCataloghi: CatalogoPermessoRow[],
  ruoloUtente: string,
): CatalogoPermessoRow[] {
  const filtered = allCataloghi.filter(c => catalogoAssegnabileAUtente(c, ruoloUtente))
  if (filtered.length > 0) return filtered

  const allowed = new Set(categorieConfigurabiliPerRuolo(ruoloUtente))
  return allCataloghi.filter(c => c.categoria && allowed.has(c.categoria as CatalogCategory))
}

/** Sezioni dashboard configurabili in Gestione Utenti (tile portale del ruolo). */
export function categorieConfigurabiliPerRuolo(ruoloUtente: string): CatalogCategory[] {
  const portale = portaleDashboardCategories(ruoloUtente)
  if (portale.length > 0) return portale

  const seen = new Set<CatalogCategory>()
  const out: CatalogCategory[] = []

  const add = (list: readonly CatalogCategory[]) => {
    for (const c of list) {
      if (seen.has(c)) continue
      seen.add(c)
      out.push(c)
    }
  }

  add(categoriesVisibleOnDashboard(ruoloUtente, true))
  return out
}

function cataloghiPerCategoriaConfigurabile(
  allCataloghi: CatalogoPermessoRow[],
  ruoloUtente: string,
  categoria: string,
): CatalogoPermessoRow[] {
  const inCategory = allCataloghi.filter(c => (c.categoria?.trim() || 'Altro') === categoria)
  if (inCategory.length === 0) return []

  const strict = inCategory.filter(c => catalogoAssegnabileAUtente(c, ruoloUtente))
  if (strict.length > 0) return strict

  // Pannello admin: se ruoli_visibili non è allineato, usa comunque i PDF della categoria
  return inCategory
}

/** Griglia categorie + PDF sottostanti per la whitelist per-utente. */
export function buildGruppiCategorieConfigurabili(
  allCataloghi: CatalogoPermessoRow[],
  ruoloUtente: string,
): CategoriaCatalogoGruppo[] {
  return categorieConfigurabiliPerRuolo(ruoloUtente).map(categoria => ({
    categoria,
    cataloghi: cataloghiPerCategoriaConfigurabile(allCataloghi, ruoloUtente, categoria),
  }))
}

export type CategoriaCatalogoGruppo = {
  categoria: string
  cataloghi: CatalogoPermessoRow[]
}

export function raggruppaCataloghiPerCategoria(cataloghi: CatalogoPermessoRow[]): CategoriaCatalogoGruppo[] {
  const map = new Map<string, CatalogoPermessoRow[]>()
  for (const c of cataloghi) {
    const cat = c.categoria?.trim() || 'Altro'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(c)
  }
  return [...map.entries()]
    .map(([categoria, items]) => ({
      categoria,
      cataloghi: items.sort((a, b) => (a.titolo ?? '').localeCompare(b.titolo ?? '', 'it')),
    }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria, 'it'))
}

export function idsCataloghiInCategorie(gruppi: CategoriaCatalogoGruppo[], categorie: Set<string>): string[] {
  const ids: string[] = []
  for (const g of gruppi) {
    if (!categorie.has(g.categoria)) continue
    for (const c of g.cataloghi) ids.push(c.id)
  }
  return ids
}

/** Categoria visibile in UI se tutti i PDF della linea sono consentiti. */
export function categoriaVisibilePerUtente(
  gruppo: CategoriaCatalogoGruppo,
  visibleIds: Set<string>,
): boolean {
  if (gruppo.cataloghi.length === 0) return false
  return gruppo.cataloghi.every(c => visibleIds.has(c.id))
}

/** Tutti gli ID catalogo assegnabili al ruolo (flat). */
export function tuttiIdsAssegnabili(gruppi: CategoriaCatalogoGruppo[]): string[] {
  return gruppi.flatMap(g => g.cataloghi.map(c => c.id))
}

/** Da stato UI → whitelist DB ([] = nessuna restrizione, vede tutto il ruolo). */
export function whitelistDaIdsVisibili(visibleIds: Set<string>, allIds: string[]): string[] {
  if (allIds.length === 0) return []
  if (allIds.every(id => visibleIds.has(id))) return []
  return [...visibleIds]
}

/** Da whitelist DB → IDs visibili in UI (vuota = tutti visibili). */
export function idsVisibiliDaWhitelist(whitelistIds: string[], allIds: string[]): Set<string> {
  if (whitelistIds.length === 0) return new Set(allIds)
  return new Set(whitelistIds)
}

/** Categorie nascoste rispetto all'accesso completo del ruolo. */
export function categorieNascoste(
  gruppi: CategoriaCatalogoGruppo[],
  visibleIds: Set<string>,
): Set<string> {
  const hidden = new Set<string>()
  for (const g of gruppi) {
    if (g.cataloghi.length === 0) continue
    if (!categoriaVisibilePerUtente(g, visibleIds)) hidden.add(g.categoria)
  }
  return hidden
}
