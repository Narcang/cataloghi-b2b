export type ProfiloGerarchiaRow = {
  id: string
  nome_completo: string | null
  societa: string | null
  email: string | null
  area_geografica: string | null
  ruolo: string
  invitato_da: string | null
  registrazione_approvata?: boolean | null
}

type OperatoreLink = { utente_id: string; operatore_id: string }

const OPERATOR_ROLES = new Set(['agenzia', 'agente', 'rivenditore', 'distributore', 'studio', 'partner_dipendente'])

export const CHILD_ROLES_BY_PARENT: Record<string, string[]> = {
  admin: ['manager'],
  manager: ['agenzia', 'agente'],
  agenzia: ['agente', 'rivenditore'],
  agente: ['rivenditore'],
  rivenditore: ['distributore', 'partner_dipendente', 'studio'],
  distributore: ['partner_dipendente', 'studio'],
  partner_dipendente: ['studio'],
}

/** Ruoli di partenza selezionabili nell'albero Struttura Organizzativa (solo categorie principali). */
export type HierarchyRootRole = 'manager' | 'agenzia' | 'rivenditore' | 'studio'

export const HIERARCHY_ROOT_ROLE_OPTIONS: { id: HierarchyRootRole; label: string }[] = [
  { id: 'manager', label: 'Manager' },
  { id: 'agenzia', label: 'Agenzia' },
  { id: 'rivenditore', label: 'Rivenditori' },
  { id: 'studio', label: 'Studio' },
]

export function defaultHierarchyRootRole(viewerRole: string): HierarchyRootRole {
  if (viewerRole === 'manager') return 'agenzia'
  if (viewerRole === 'agenzia') return 'agenzia'
  if (viewerRole === 'rivenditore') return 'rivenditore'
  return 'manager'
}

export function hierarchyRootRoleLabel(rootRole: HierarchyRootRole): string {
  switch (rootRole) {
    case 'manager':
      return 'Manager'
    case 'agenzia':
      return 'Agenzie'
    case 'rivenditore':
      return 'Rivenditori'
    case 'studio':
      return 'Studi'
    default:
      return ruoloGerarchiaLabel(rootRole)
  }
}

export function ruoloGerarchiaLabel(ruolo: string): string {
  if (ruolo === 'rivenditore') return 'Rivenditori'
  if (ruolo === 'distributore') return 'Venditori'
  if (ruolo === 'partner_dipendente') return 'Promoter'
  if (ruolo === 'agenzia') return 'Agenzia'
  return ruolo.charAt(0).toUpperCase() + ruolo.slice(1)
}

/** Pallino colorato per i ruoli principali nella struttura organizzativa. */
export function ruoloGerarchiaDotClass(ruolo: string): string | null {
  switch (ruolo) {
    case 'manager':
      return 'bg-red-500'
    case 'agenzia':
      return 'bg-blue-500'
    case 'rivenditore':
      return 'bg-green-500'
    case 'studio':
      return 'bg-orange-500'
    default:
      return null
  }
}

/** Ruoli che possono avere un livello inferiore nell'albero (manager → agente → partner → studio). */
export function canHaveHierarchyChildren(ruolo: string): boolean {
  return (CHILD_ROLES_BY_PARENT[ruolo]?.length ?? 0) > 0
}

export function resolveAgenziaParentForAgent(
  agentProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const byId = new Map(profili.map((p) => [p.id, p]))

  const agenziaFromId = (id: string | null | undefined): ProfiloGerarchiaRow | null => {
    if (!id) return null
    const p = byId.get(id)
    return p?.ruolo === 'agenzia' ? p : null
  }

  const fromInvito = agenziaFromId(agentProfile.invitato_da)
  if (fromInvito) return fromInvito

  for (const link of links) {
    const otherId =
      link.utente_id === agentProfile.id
        ? link.operatore_id
        : link.operatore_id === agentProfile.id
          ? link.utente_id
          : null
    if (!otherId) continue
    const hit = agenziaFromId(otherId)
    if (hit) return hit
  }

  const inviter = byId.get(agentProfile.invitato_da ?? '')
  if (inviter?.ruolo === 'agente') {
    return agenziaFromId(inviter.invitato_da)
  }

  return null
}

export function profiloToGerarchiaRow(
  p: {
    id: string
    nome_completo: string | null
    societa?: string | null
    email: string | null
    area_geografica: string | null
    ruolo: string
    registrazione_approvata?: boolean | null
  },
  invitato_da: string | null = null,
): ProfiloGerarchiaRow {
  return {
    id: p.id,
    nome_completo: p.nome_completo,
    societa: p.societa ?? null,
    email: p.email,
    area_geografica: p.area_geografica,
    ruolo: p.ruolo,
    invitato_da,
    registrazione_approvata: p.registrazione_approvata,
  }
}

export function associatiDirettiSectionLabel(ruolo: string): string | null {
  const childRoles = CHILD_ROLES_BY_PARENT[ruolo]
  if (!childRoles?.length) return null
  switch (ruolo) {
    case 'admin':
      return 'Associati diretti (manager)'
    case 'manager':
      return 'Associati diretti (agenzie / agenti)'
    case 'agenzia':
      return 'Associati diretti (agenti / rivenditori)'
    case 'agente':
      return 'Associati diretti (rivenditori)'
    case 'rivenditore':
      return 'Associati diretti (venditori / promoter / studi)'
    case 'distributore':
      return 'Associati diretti (promoter / studi)'
    case 'partner_dipendente':
      return 'Associati diretti (studi)'
    default:
      return 'Associati diretti'
  }
}

export function associatiAggiungiSectionLabel(ruolo: string): string | null {
  const childRoles = CHILD_ROLES_BY_PARENT[ruolo]
  if (!childRoles?.length) return null
  switch (ruolo) {
    case 'admin':
      return 'Associa manager'
    case 'manager':
      return 'Associa agenzia / agente'
    case 'agenzia':
      return 'Associa agente / rivenditore'
    case 'agente':
      return 'Associa rivenditore'
    case 'rivenditore':
      return 'Associa venditore / promoter / studio'
    case 'distributore':
      return 'Associa promoter / studio'
    case 'partner_dipendente':
      return 'Associa studio'
    default:
      return 'Associa profilo'
  }
}

export function getCandidateAssociatiProfiles(
  ownerId: string,
  ownerRuolo: string,
  profili: ProfiloGerarchiaRow[],
): ProfiloGerarchiaRow[] {
  const childRoles = CHILD_ROLES_BY_PARENT[ownerRuolo]
  if (!childRoles?.length) return []

  return profili
    .filter(
      (p) =>
        p.id !== ownerId &&
        childRoles.includes(p.ruolo) &&
        p.ruolo !== 'free' &&
        p.registrazione_approvata !== false,
    )
    .sort((a, b) =>
      (a.nome_completo || a.email || a.id)
        .trim()
        .toLocaleLowerCase('it')
        .localeCompare((b.nome_completo || b.email || b.id).trim().toLocaleLowerCase('it'), 'it', {
          sensitivity: 'base',
        }),
    )
}

function getExpectedChildRoles(
  parent: ProfiloGerarchiaRow | null,
  viewerRole: string,
): string[] {
  if (!parent) {
    return viewerRole === 'admin' ? ['manager'] : ['agente']
  }
  return CHILD_ROLES_BY_PARENT[parent.ruolo] ?? []
}

function hasDirectedParentChildLink(
  parentId: string,
  childId: string,
  parentRole: string,
  childRole: string,
  links: OperatoreLink[],
): boolean {
  if (links.some((l) => l.utente_id === parentId && l.operatore_id === childId)) return true
  if (OPERATOR_ROLES.has(parentRole) && OPERATOR_ROLES.has(childRole)) {
    if (links.some((l) => l.utente_id === childId && l.operatore_id === parentId)) return true
  }
  return false
}

function isDirectChild(
  parentId: string,
  parentProfile: ProfiloGerarchiaRow,
  child: ProfiloGerarchiaRow,
  links: OperatoreLink[],
  profili: ProfiloGerarchiaRow[],
): boolean {
  const expectedRoles = CHILD_ROLES_BY_PARENT[parentProfile.ruolo] ?? []
  if (!expectedRoles.includes(child.ruolo)) return false
  if (parentProfile.ruolo === 'agenzia' && child.ruolo === 'agente') {
    const agenzia = resolveAgenziaParentForAgent(child, profili, links)
    if (agenzia?.id === parentId) return true
  }
  if (child.invitato_da === parentId) return true
  if (hasDirectedParentChildLink(
    parentId,
    child.id,
    parentProfile.ruolo,
    child.ruolo,
    links,
  )) {
    return true
  }
  // Link inverso: il figlio ha il parent in rubrica (es. agente vede il manager che l'ha invitato)
  if (links.some((l) => l.utente_id === child.id && l.operatore_id === parentId)) return true
  return false
}

function profiloSortKey(p: ProfiloGerarchiaRow): string {
  return (p.societa || p.nome_completo || p.email || p.id).trim().toLocaleLowerCase('it')
}

function isProfiloVisibileInGerarchia(p: ProfiloGerarchiaRow): boolean {
  return p.ruolo !== 'free' && p.registrazione_approvata !== false
}

export function getHierarchyRootProfiles(
  rootRole: HierarchyRootRole,
  profili: ProfiloGerarchiaRow[],
): ProfiloGerarchiaRow[] {
  return profili
    .filter((p) => isProfiloVisibileInGerarchia(p) && p.ruolo === rootRole)
    .sort((a, b) => profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' }))
}

export function getChildrenProfiles(
  parentId: string | null,
  parentProfile: ProfiloGerarchiaRow | null,
  currentUserId: string,
  viewerRole: string,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  const expectedRoles = getExpectedChildRoles(parentProfile, viewerRole)

  const candidates = profili.filter((p) => {
    if (!isProfiloVisibileInGerarchia(p)) return false
    if (!expectedRoles.includes(p.ruolo)) return false

    if (!parentId || !parentProfile) {
      if (viewerRole === 'manager') {
        const managerProfile = profili.find((prof) => prof.id === currentUserId)
        if (!managerProfile) return false
        return isDirectChild(currentUserId, managerProfile, p, links, profili)
      }
      if (viewerRole === 'agenzia') {
        const agenziaProfile = profili.find((prof) => prof.id === currentUserId)
        if (!agenziaProfile) return false
        return isDirectChild(currentUserId, agenziaProfile, p, links, profili)
      }
      return p.ruolo === 'manager'
    }

    return isDirectChild(parentId, parentProfile, p, links, profili)
  })

  const unique = new Map(candidates.map((p) => [p.id, p]))
  return [...unique.values()].sort((a, b) =>
    profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' }),
  )
}

export function countChildrenProfiles(
  profileId: string,
  profile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): number {
  return getChildrenProfiles(profileId, profile, profileId, profile.ruolo, profili, links).length
}

export function nestedAssociatiLabel(ruolo: string): string | null {
  const childRoles = CHILD_ROLES_BY_PARENT[ruolo]
  if (!childRoles?.length) return null
  switch (ruolo) {
    case 'manager':
      return 'Agenzie / agenti associati'
    case 'agenzia':
      return 'Agenti / rivenditori associati'
    case 'agente':
      return 'Rivenditori associati'
    case 'rivenditore':
      return 'Venditori / promoter / studi associati'
    case 'distributore':
      return 'Promoter / studi associati'
    case 'partner_dipendente':
      return 'Studi associati'
    default:
      return 'Associati'
  }
}

export function livelloGerarchiaLabel(
  parent: ProfiloGerarchiaRow | null,
  viewerRole: string,
): string {
  const roles = getExpectedChildRoles(parent, viewerRole)
  if (roles.length === 0) return 'Associati'
  if (roles.length === 1) {
    switch (roles[0]) {
      case 'manager':
        return 'Manager'
      case 'agenzia':
        return 'Agenzie associate'
      case 'agente':
        return 'Agenti associati'
      case 'rivenditore':
        return 'Rivenditori associati'
      case 'distributore':
        return 'Venditori associati'
      case 'partner_dipendente':
        return 'Promoter associati'
      case 'studio':
        return 'Studi associati'
      default:
        return `${ruoloGerarchiaLabel(roles[0])} associati`
    }
  }
  return 'Associati'
}
