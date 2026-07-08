import { isStudioLike } from '@/lib/catalogAccess'
import {
  categoriesVisibleOnDashboard,
  isAgentOnlyCatalogCategory,
  isCatalogCategoryAllowedForStudioRole,
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

  // Manager o DB non migrato: mostra cataloghi con almeno un ruolo operativo noto
  if (ruoloUtente === 'manager') {
    return allCataloghi.filter(c => {
      const rv = c.ruoli_visibili ?? []
      if (rv.length === 0) return true
      return rv.some(r =>
        ['manager', 'agente', 'agenzia', 'distributore', 'studio', 'partner_dipendente', 'free'].includes(r),
      )
    })
  }

  return filtered
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
