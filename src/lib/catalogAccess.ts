import {
  isAgentOnlyCatalogCategory,
  isCatalogCategoryAllowedForStudioRole,
  isLoginOnlyCatalogCategory,
} from '@/lib/catalogCategories'

type CatalogoRow = {
  categoria: string | null
  stato_pubblicazione: string | null
}

export type CatalogAccessDenial = {
  status: 401 | 403 | 404
  message: string
}

export function getCatalogAccessDenial(
  catalogo: CatalogoRow | null,
  options: {
    isAuthenticated: boolean
    ruolo: string | null
  },
): CatalogAccessDenial | null {
  if (!catalogo) {
    return { status: 404, message: 'Catalogo non trovato' }
  }

  const catalogoNonPubblico = catalogo.stato_pubblicazione !== 'attivo'

  if (!options.isAuthenticated && isLoginOnlyCatalogCategory(catalogo.categoria)) {
    return { status: 401, message: 'Accesso riservato: effettua il login' }
  }

  if (!options.isAuthenticated && catalogoNonPubblico) {
    return { status: 403, message: 'Catalogo non disponibile' }
  }

  const ruolo = options.ruolo ?? 'free'

  if (options.isAuthenticated && ruolo === 'distributore' && isAgentOnlyCatalogCategory(catalogo.categoria)) {
    return { status: 403, message: 'Accesso non consentito' }
  }

  if (options.isAuthenticated && ruolo === 'studio') {
    if (!isCatalogCategoryAllowedForStudioRole(catalogo.categoria)) {
      return { status: 403, message: 'Accesso non consentito per profilo Studio' }
    }
    if (catalogoNonPubblico) {
      return { status: 403, message: 'Catalogo non pubblicato' }
    }
  }

  if (options.isAuthenticated && ruolo === 'free' && catalogoNonPubblico) {
    return { status: 403, message: 'Catalogo non disponibile' }
  }

  return null
}
