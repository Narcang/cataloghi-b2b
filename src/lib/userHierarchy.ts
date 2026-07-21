export type ProfiloGerarchiaRow = {
  id: string
  nome_completo: string | null
  societa: string | null
  email: string | null
  area_geografica: string | null
  ruolo: string
  invitato_da: string | null
  registrazione_approvata?: boolean | null
  seguito_da?: string | null
  espositore_1?: string | null
  espositore_2?: string | null
  box_show_room_1?: string | null
  box_show_room_2?: string | null
  box_show_room_3?: string | null
  box_show_room_4?: string | null
}

type OperatoreLink = { utente_id: string; operatore_id: string }

const OPERATOR_ROLES = new Set(['agenzia', 'agente', 'rivenditore', 'distributore', 'studio', 'partner_dipendente'])

export const CHILD_ROLES_BY_PARENT: Record<string, string[]> = {
  admin: ['manager'],
  manager: ['agenzia', 'agente'],
  agenzia: ['agente', 'rivenditore'],
  agente: ['studio'],
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
      return 'bg-zinc-500'
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

/** Pallino per i badge di riepilogo (include ruoli secondari come agente). */
export function ruoloBreakdownDotClass(ruolo: string): string | null {
  if (ruolo === 'agente') return 'bg-blue-400'
  if (ruolo === 'distributore') return 'bg-violet-500'
  if (ruolo === 'partner_dipendente') return 'bg-fuchsia-500'
  return ruoloGerarchiaDotClass(ruolo)
}

export type RoleBreakdownBadge = { ruolo: string; label: string }

/** Badge conteggio discendenti da mostrare nel box di un profilo in struttura organizzativa. */
export function roleBreakdownBadgesForNode(ruolo: string): RoleBreakdownBadge[] {
  switch (ruolo) {
    case 'manager':
      return [
        { ruolo: 'agenzia', label: 'Agenzie' },
        { ruolo: 'rivenditore', label: 'Rivenditori' },
        { ruolo: 'studio', label: 'Studi' },
      ]
    case 'agenzia':
      return [
        { ruolo: 'rivenditore', label: 'Rivenditori' },
        { ruolo: 'studio', label: 'Studi' },
      ]
    case 'agente':
      return [{ ruolo: 'studio', label: 'Studi' }]
    case 'rivenditore':
      return [{ ruolo: 'studio', label: 'Studi' }]
    case 'distributore':
      return [{ ruolo: 'studio', label: 'Studi' }]
    default:
      return []
  }
}

/** Conta i discendenti per ruolo nell'albero sotto un profilo. */
export function countDescendantsByRoles(
  profileId: string,
  profile: ProfiloGerarchiaRow,
  targetRoles: string[],
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): Record<string, number> {
  const counts = Object.fromEntries(targetRoles.map((r) => [r, 0])) as Record<string, number>
  const seen = new Set<string>()

  function walk(parentId: string, parentProfile: ProfiloGerarchiaRow) {
    const children = getChildrenProfiles(
      parentId,
      parentProfile,
      profileId,
      profile.ruolo,
      profili,
      links,
    )
    for (const child of children) {
      if (seen.has(child.id)) continue
      seen.add(child.id)
      if (targetRoles.includes(child.ruolo)) {
        counts[child.ruolo]++
      }
      if (canHaveHierarchyChildren(child.ruolo)) {
        walk(child.id, child)
      }
    }
  }

  if (canHaveHierarchyChildren(profile.ruolo)) {
    walk(profileId, profile)
  }
  return counts
}

/** Elenco piatto di tutti i discendenti con un dato ruolo sotto un profilo. */
export function getDescendantsByRole(
  profileId: string,
  profile: ProfiloGerarchiaRow,
  targetRole: string,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  const result: ProfiloGerarchiaRow[] = []
  const seen = new Set<string>()

  function walk(parentId: string, parentProfile: ProfiloGerarchiaRow) {
    const children = getChildrenProfiles(
      parentId,
      parentProfile,
      profileId,
      profile.ruolo,
      profili,
      links,
    )
    for (const child of children) {
      if (seen.has(child.id)) continue
      seen.add(child.id)
      if (child.ruolo === targetRole) {
        result.push(child)
      }
      if (canHaveHierarchyChildren(child.ruolo)) {
        walk(child.id, child)
      }
    }
  }

  if (canHaveHierarchyChildren(profile.ruolo)) {
    walk(profileId, profile)
  }

  return result.sort((a, b) =>
    profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' }),
  )
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

export type FlatListViewerRole = 'agenzia' | 'agente' | 'rivenditore' | 'distributore'

export type FlatListTab = { id: string; label: string; ruolo: string }

const FLAT_LIST_TABS_BY_VIEWER: Record<FlatListViewerRole, FlatListTab[]> = {
  agenzia: [
    { id: 'agente', label: 'Agenti', ruolo: 'agente' },
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'rivenditore', label: 'Rivenditori', ruolo: 'rivenditore' },
    { id: 'studio', label: 'Studi', ruolo: 'studio' },
  ],
  agente: [
    { id: 'agente', label: 'Agenti', ruolo: 'agente' },
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'rivenditore', label: 'Rivenditori', ruolo: 'rivenditore' },
    { id: 'studio', label: 'Studi', ruolo: 'studio' },
  ],
  rivenditore: [
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'partner_dipendente', label: 'Promoter', ruolo: 'partner_dipendente' },
    { id: 'studio', label: 'Studi', ruolo: 'studio' },
  ],
  distributore: [
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'partner_dipendente', label: 'Promoter', ruolo: 'partner_dipendente' },
    { id: 'studio', label: 'Studi', ruolo: 'studio' },
  ],
}

export function flatListTabsForViewer(viewerRole: FlatListViewerRole): FlatListTab[] {
  return FLAT_LIST_TABS_BY_VIEWER[viewerRole] ?? []
}

export function resolveRivenditoreParentForDistributore(
  distributoreProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const byId = new Map(profili.map((p) => [p.id, p]))

  const rivenditoreFromId = (id: string | null | undefined): ProfiloGerarchiaRow | null => {
    if (!id) return null
    const p = byId.get(id)
    return p?.ruolo === 'rivenditore' ? p : null
  }

  const fromInvito = rivenditoreFromId(distributoreProfile.invitato_da)
  if (fromInvito) return fromInvito

  for (const link of links) {
    const otherId =
      link.utente_id === distributoreProfile.id
        ? link.operatore_id
        : link.operatore_id === distributoreProfile.id
          ? link.utente_id
          : null
    if (!otherId) continue
    const hit = rivenditoreFromId(otherId)
    if (hit) return hit
  }

  let current: ProfiloGerarchiaRow | null = distributoreProfile
  const visited = new Set<string>()
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    const parent = findDirectParentProfile(current, profili, links)
    if (!parent) break
    if (parent.ruolo === 'rivenditore') return parent
    current = parent
  }

  return null
}

function resolveAgenziaParentForRivenditore(
  rivenditoreProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const byId = new Map(profili.map((p) => [p.id, p]))

  const agenziaFromId = (id: string | null | undefined): ProfiloGerarchiaRow | null => {
    if (!id) return null
    const p = byId.get(id)
    return p?.ruolo === 'agenzia' ? p : null
  }

  const fromInvito = agenziaFromId(rivenditoreProfile.invitato_da)
  if (fromInvito) return fromInvito

  const inviter = byId.get(rivenditoreProfile.invitato_da ?? '')
  if (inviter?.ruolo === 'agente') {
    const agenziaViaAgente = agenziaFromId(inviter.invitato_da)
    if (agenziaViaAgente) return agenziaViaAgente
    return resolveAgenziaParentForAgent(inviter, profili, links)
  }

  for (const link of links) {
    const otherId =
      link.utente_id === rivenditoreProfile.id
        ? link.operatore_id
        : link.operatore_id === rivenditoreProfile.id
          ? link.utente_id
          : null
    if (!otherId) continue
    const hit = agenziaFromId(otherId)
    if (hit) return hit
  }

  return null
}

function findAgenteParentForRivenditore(
  rivenditoreProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const byId = new Map(profili.map((p) => [p.id, p]))
  const fromInvito = byId.get(rivenditoreProfile.invitato_da ?? '')
  if (fromInvito?.ruolo === 'agente') return fromInvito

  const parent = findDirectParentProfile(rivenditoreProfile, profili, links)
  return parent?.ruolo === 'agente' ? parent : null
}

function getAgentiInCompanyScope(
  ownerProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  if (ownerProfile.ruolo === 'agenzia') {
    return getDescendantsByRole(ownerProfile.id, ownerProfile, 'agente', profili, links)
  }

  if (ownerProfile.ruolo === 'rivenditore') {
    const agente = findAgenteParentForRivenditore(ownerProfile, profili, links)
    if (agente) {
      const agenzia = resolveAgenziaParentForAgent(agente, profili, links)
      if (agenzia) {
        return getDescendantsByRole(agenzia.id, agenzia, 'agente', profili, links)
      }
      return [agente]
    }

    const agenzia = resolveAgenziaParentForRivenditore(ownerProfile, profili, links)
    if (agenzia) {
      return getDescendantsByRole(agenzia.id, agenzia, 'agente', profili, links)
    }
  }

  return []
}

/** Radice gerarchica per l'elenco piatto: compagnia agenzia (agente) o rivenditore (venditore). */
export function resolveFlatListOwnerProfile(
  viewerRole: FlatListViewerRole,
  selfProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow {
  if (viewerRole === 'agente') {
    return resolveAgenziaParentForAgent(selfProfile, profili, links) ?? selfProfile
  }
  if (viewerRole === 'distributore') {
    return resolveRivenditoreParentForDistributore(selfProfile, profili, links) ?? selfProfile
  }
  return selfProfile
}

export function getFlatListProfilesByRole(
  ownerProfile: ProfiloGerarchiaRow,
  targetRole: string,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  if (targetRole === 'agente') {
    return getAgentiInCompanyScope(ownerProfile, profili, links)
  }
  return getDescendantsByRole(ownerProfile.id, ownerProfile, targetRole, profili, links)
}

/** Limita i profili al sotto-albero gerarchico di una radice (es. compagnia agenzia). */
export function filterProfiliInHierarchySubtree(
  root: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  const ids = new Set<string>([root.id])
  const queue: ProfiloGerarchiaRow[] = [root]

  while (queue.length > 0) {
    const parent = queue.shift()!
    const children = getChildrenProfiles(
      parent.id,
      parent,
      root.id,
      root.ruolo,
      profili,
      links,
    )
    for (const child of children) {
      if (ids.has(child.id)) continue
      ids.add(child.id)
      if (canHaveHierarchyChildren(child.ruolo)) {
        queue.push(child)
      }
    }
  }

  return profili.filter((p) => ids.has(p.id))
}

export function flatListSectionDescription(viewerRole: FlatListViewerRole): string {
  switch (viewerRole) {
    case 'agenzia':
      return 'Vista rapida di agenti, venditori, rivenditori e studi collegati alla tua agenzia, con il referente di riferimento.'
    case 'agente':
      return 'Vista rapida di agenti, venditori, rivenditori e studi della tua compagnia, con il referente di riferimento.'
    case 'rivenditore':
      return 'Vista rapida di venditori, promoter e studi collegati al tuo rivenditore, con il referente di riferimento.'
    case 'distributore':
      return 'Vista rapida di venditori, promoter e studi della tua compagnia rivenditore, con il referente di riferimento.'
  }
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
      return 'Associati diretti (studi)'
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
      return 'Associa studio'
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
      profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' }),
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
  if (parentProfile.ruolo === 'agente' && child.ruolo === 'rivenditore') return false
  if (parentProfile.ruolo === 'agenzia' && child.ruolo === 'agente') {
    const agenzia = resolveAgenziaParentForAgent(child, profili, links)
    if (agenzia?.id === parentId) return true
  }
  if (parentProfile.ruolo === 'agenzia' && child.ruolo === 'rivenditore') {
    if (child.invitato_da === parentId) return true
    const agenzia = resolveAgenziaParentForRivenditore(child, profili, links)
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

function findDirectParentProfile(
  child: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  for (const candidate of profili) {
    if (candidate.id === child.id) continue
    if (isDirectChild(candidate.id, candidate, child, links, profili)) {
      return candidate
    }
  }
  return null
}

/** Referente gerarchico da mostrare nell'elenco piatto (agente/agenzia o venditore/rivenditore). */
export function resolveFlatListReferent(
  child: ProfiloGerarchiaRow,
  ownerProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const stopRolesByOwner: Record<string, string[]> = {
    agenzia: ['agente', 'agenzia'],
    agente: ['agente', 'agenzia'],
    rivenditore: ['distributore', 'rivenditore', 'partner_dipendente'],
    distributore: ['partner_dipendente', 'distributore', 'rivenditore'],
  }

  let stopRoles: string[]
  switch (child.ruolo) {
    case 'agente':
      stopRoles = ['agente', 'agenzia']
      break
    case 'distributore':
    case 'partner_dipendente':
      stopRoles = ['partner_dipendente', 'distributore', 'rivenditore']
      break
    case 'rivenditore':
      stopRoles = ['agente', 'agenzia']
      break
    default:
      stopRoles = stopRolesByOwner[ownerProfile.ruolo] ?? []
  }

  if (stopRoles.length === 0) return null

  const stopSet = new Set(stopRoles)
  let current: ProfiloGerarchiaRow | null = child
  const visited = new Set<string>()

  while (current) {
    const parent = findDirectParentProfile(current, profili, links)
    if (!parent || visited.has(parent.id)) break
    visited.add(parent.id)

    if (parent.id === ownerProfile.id) return ownerProfile
    if (stopSet.has(parent.ruolo)) return parent

    current = parent
  }

  if (isDirectChild(ownerProfile.id, ownerProfile, child, links, profili)) {
    return ownerProfile
  }

  return null
}

export function referentAssociatoLabel(referent: ProfiloGerarchiaRow): string {
  return `${profiloGerarchiaDisplayLabel(referent)} (${ruoloGerarchiaLabel(referent.ruolo)})`
}

function profiloSortKey(p: ProfiloGerarchiaRow): string {
  return (p.societa || p.nome_completo || p.email || p.id).trim().toLocaleLowerCase('it')
}

function childRoleSortIndex(parentRuolo: string | undefined, childRuolo: string): number {
  if (!parentRuolo) return 0
  const order = CHILD_ROLES_BY_PARENT[parentRuolo]
  if (!order?.length) return 0
  const idx = order.indexOf(childRuolo)
  return idx === -1 ? order.length : idx
}

function sortProfilesByRoleThenName(
  profiles: ProfiloGerarchiaRow[],
  parentProfile: ProfiloGerarchiaRow | null,
): ProfiloGerarchiaRow[] {
  const parentRuolo = parentProfile?.ruolo
  return [...profiles].sort((a, b) => {
    const byRole =
      childRoleSortIndex(parentRuolo, a.ruolo) - childRoleSortIndex(parentRuolo, b.ruolo)
    if (byRole !== 0) return byRole
    return profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' })
  })
}

/** Etichetta leggibile per liste/checkbox. Agenzie e rivenditori: solo società. */
export function profiloGerarchiaDisplayLabel(
  p: Pick<ProfiloGerarchiaRow, 'societa' | 'nome_completo' | 'email' | 'ruolo'>,
): string {
  const societa = p.societa?.trim()
  const nome = p.nome_completo?.trim()
  const email = p.email?.trim()
  const preferSocieta = p.ruolo === 'agenzia' || p.ruolo === 'rivenditore'

  if (preferSocieta) {
    if (societa) return societa
    return nome || email || 'Utente senza nome'
  }

  if (societa && nome && nome.toLocaleLowerCase('it') !== societa.toLocaleLowerCase('it')) {
    return `${societa} · ${nome}`
  }
  if (societa) return societa
  return nome || email || 'Utente senza nome'
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
  return sortProfilesByRoleThenName([...unique.values()], parentProfile)
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
      return 'Studi associati'
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
