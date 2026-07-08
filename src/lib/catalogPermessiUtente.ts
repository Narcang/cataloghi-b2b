import { isStudioLike } from '@/lib/catalogAccess'
import {
  agenteReservedDashboardCategories,
  categoriesVisibleOnDashboard,
  isAgentOnlyCatalogCategory,
  isCatalogCategoryAllowedForStudioRole,
  partnerListiniDashboardCategories,
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
  if (isAgentOnlyCatalogCategory(categoria) && ruolo !== 'agente' && ruolo !== 'agenzia' && ruolo !== 'manager') {
    return false
  }
  if (isStudioLike(ruolo)) {
    return isCatalogCategoryAllowedForStudioRole(categoria)
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

/** Categorie mostrabili nella griglia permessi (allineate alla dashboard del ruolo). */
export function categorieConfigurabiliPerRuolo(ruoloUtente: string): CatalogCategory[] {
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

  if (ruoloUtente === 'agente' || ruoloUtente === 'agenzia') {
    add(agenteReservedDashboardCategories())
  }
  if (ruoloUtente === 'distributore' || ruoloUtente === 'partner_dipendente') {
    add(partnerListiniDashboardCategories())
  }

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

/** Categoria considerata abilitata se tutti i suoi cataloghi sono nella whitelist. */
export function categorieSelezionateDaIds(
  gruppi: CategoriaCatalogoGruppo[],
  catalogoIds: Set<string>,
): Set<string> {
  const selected = new Set<string>()
  for (const g of gruppi) {
    if (g.cataloghi.length === 0) continue
    if (g.cataloghi.every(c => catalogoIds.has(c.id))) selected.add(g.categoria)
  }
  return selected
}
