import { isAgenteLike } from '@/lib/catalogRoles'

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
  giro_visita?: string | null
  telefonata?: string | null
  note_visita?: string | null
  note_telefonata?: string | null
  espositore_1?: string | null
  espositore_2?: string | null
  box_show_room_1?: string | null
  box_show_room_2?: string | null
  box_show_room_3?: string | null
  box_show_room_4?: string | null
  agenzia_campione_1?: string | null
  agenzia_campione_2?: string | null
  agenzia_catalogo_1?: string | null
  agenzia_catalogo_2?: string | null
  agenzia_catalogo_3?: string | null
  agenzia_catalogo_4?: string | null
  espositore_1_qta?: number | null
  espositore_2_qta?: number | null
  box_show_room_1_qta?: number | null
  box_show_room_2_qta?: number | null
  box_show_room_3_qta?: number | null
  box_show_room_4_qta?: number | null
  agenzia_campione_1_qta?: number | null
  agenzia_campione_2_qta?: number | null
  agenzia_catalogo_1_qta?: number | null
  agenzia_catalogo_2_qta?: number | null
  agenzia_catalogo_3_qta?: number | null
  agenzia_catalogo_4_qta?: number | null
  espositore_1_data?: string | null
  espositore_2_data?: string | null
  box_show_room_1_data?: string | null
  box_show_room_2_data?: string | null
  box_show_room_3_data?: string | null
  box_show_room_4_data?: string | null
  agenzia_campione_1_data?: string | null
  agenzia_campione_2_data?: string | null
  agenzia_catalogo_1_data?: string | null
  agenzia_catalogo_2_data?: string | null
  agenzia_catalogo_3_data?: string | null
  agenzia_catalogo_4_data?: string | null
  agenzia_campioni_aggiornato_il?: string | null
  agenzia_cataloghi_aggiornato_il?: string | null
  espositori_aggiornato_il?: string | null
  box_aggiornato_il?: string | null
}

type OperatoreLink = { utente_id: string; operatore_id: string }

type HierarchyLookup = {
  byId: Map<string, ProfiloGerarchiaRow>
  byRole: Map<string, ProfiloGerarchiaRow[]>
  /** Primo profilo con quel nome, nell’ordine dell’elenco. */
  firstAgenteByNome: Map<string, ProfiloGerarchiaRow>
  firstAgenteLikeByNome: Map<string, ProfiloGerarchiaRow>
  neighbors: Map<string, string[]>
  directed: Set<string>
  agenziaPerAgente: Map<string, ProfiloGerarchiaRow | null>
  agenziaPerRivenditore: Map<string, ProfiloGerarchiaRow | null>
  agentePerRivenditore: Map<string, ProfiloGerarchiaRow | null>
  agentePerStudio: Map<string, ProfiloGerarchiaRow | null>
  appartieneSede: Map<string, boolean>
  childrenByParent: Map<string, ProfiloGerarchiaRow[]>
}

const hierarchyLookupCache = new WeakMap<
  ProfiloGerarchiaRow[],
  { links: OperatoreLink[]; lookup: HierarchyLookup }
>()

function linkPair(utenteId: string, operatoreId: string): string {
  return `${utenteId}\0${operatoreId}`
}

function createHierarchyLookup(
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): HierarchyLookup {
  const byId = new Map<string, ProfiloGerarchiaRow>()
  const byRole = new Map<string, ProfiloGerarchiaRow[]>()
  const firstAgenteByNome = new Map<string, ProfiloGerarchiaRow>()
  const firstAgenteLikeByNome = new Map<string, ProfiloGerarchiaRow>()
  for (const profilo of profili) {
    byId.set(profilo.id, profilo)
    const delloStessoRuolo = byRole.get(profilo.ruolo)
    if (delloStessoRuolo) delloStessoRuolo.push(profilo)
    else byRole.set(profilo.ruolo, [profilo])

    const nome = (profilo.nome_completo ?? '').trim().toLocaleLowerCase('it')
    if (!nome) continue
    if (profilo.ruolo === 'agente' && !firstAgenteByNome.has(nome)) {
      firstAgenteByNome.set(nome, profilo)
    }
    if (isAgenteLike(profilo.ruolo) && !firstAgenteLikeByNome.has(nome)) {
      firstAgenteLikeByNome.set(nome, profilo)
    }
  }

  const neighbors = new Map<string, string[]>()
  const directed = new Set<string>()
  const pushNeighbor = (id: string, otherId: string) => {
    const lista = neighbors.get(id)
    if (lista) lista.push(otherId)
    else neighbors.set(id, [otherId])
  }
  for (const link of links) {
    directed.add(linkPair(link.utente_id, link.operatore_id))
    if (link.utente_id === link.operatore_id) {
      pushNeighbor(link.utente_id, link.operatore_id)
      continue
    }
    pushNeighbor(link.utente_id, link.operatore_id)
    pushNeighbor(link.operatore_id, link.utente_id)
  }

  return {
    byId,
    byRole,
    firstAgenteByNome,
    firstAgenteLikeByNome,
    neighbors,
    directed,
    agenziaPerAgente: new Map(),
    agenziaPerRivenditore: new Map(),
    agentePerRivenditore: new Map(),
    agentePerStudio: new Map(),
    appartieneSede: new Map(),
    childrenByParent: new Map(),
  }
}

/** Indici e risultati già calcolati per lo stesso elenco profili/collegamenti. */
function lookupOf(profili: ProfiloGerarchiaRow[], links: OperatoreLink[]): HierarchyLookup {
  const cached = hierarchyLookupCache.get(profili)
  if (cached && cached.links === links) return cached.lookup
  const lookup = createHierarchyLookup(profili, links)
  hierarchyLookupCache.set(profili, { links, lookup })
  return lookup
}

const OPERATOR_ROLES = new Set(['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'studio', 'studio_associato', 'partner_dipendente'])

export const CHILD_ROLES_BY_PARENT: Record<string, string[]> = {
  admin: ['manager'],
  manager: ['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato'],
  agenzia: ['agente', 'back_office', 'rivenditore', 'studio'],
  agente: ['agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio_associato', 'studio'],
  back_office: ['agente', 'back_office', 'distributore', 'studio_associato', 'studio'],
  rivenditore: ['distributore', 'partner_dipendente', 'studio', 'studio_associato'],
  distributore: ['distributore', 'partner_dipendente', 'studio', 'studio_associato'],
  partner_dipendente: ['studio'],
  studio: ['studio_associato'],
}

const ASSOCIATI_UI_ROLES_BY_PARENT: Record<string, string[]> = {
  admin: ['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato', 'manager'],
  manager: ['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato'],
  agenzia: ['agente', 'back_office', 'rivenditore', 'studio'],
  agente: ['rivenditore', 'studio'],
  back_office: ['agente', 'back_office', 'distributore', 'studio_associato', 'studio'],
  rivenditore: ['distributore', 'partner_dipendente', 'studio', 'studio_associato'],
  distributore: ['partner_dipendente', 'studio', 'studio_associato'],
  partner_dipendente: ['studio'],
  studio: ['studio_associato'],
}

/** Ruoli mostrati nei tasti di associazione admin, allineati a chi si può invitare. */
export function associatiUiRolesFor(ruolo: string): string[] {
  return ASSOCIATI_UI_ROLES_BY_PARENT[ruolo] ?? CHILD_ROLES_BY_PARENT[ruolo] ?? []
}

/** Ruoli di partenza selezionabili nell'albero Struttura Organizzativa (solo categorie principali). */
export type HierarchyRootRole = 'manager' | 'agenzia' | 'rivenditore' | 'studio'

export const HIERARCHY_ROOT_ROLE_OPTIONS: { id: HierarchyRootRole; label: string }[] = [
  { id: 'manager', label: 'Manager' },
  { id: 'agenzia', label: 'Agenzia' },
  { id: 'rivenditore', label: 'Rivenditori' },
  { id: 'studio', label: 'Sede Studio' },
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
      return 'Sedi Studio'
    default:
      return ruoloGerarchiaLabel(rootRole)
  }
}

export function ruoloGerarchiaLabel(ruolo: string): string {
  if (ruolo === 'rivenditore') return 'Rivenditori'
  if (ruolo === 'distributore') return 'Venditori'
  if (ruolo === 'partner_dipendente') return 'Promoter'
  if (ruolo === 'studio') return 'Sede Studio'
  if (ruolo === 'studio_associato') return 'Studio'
  if (ruolo === 'agente') return 'Agente'
  if (ruolo === 'back_office') return 'Back-Office'
  return ruolo.charAt(0).toUpperCase() + ruolo.slice(1)
}

/** Pallino colorato per i ruoli principali nella struttura organizzativa. */
export function ruoloGerarchiaDotClass(ruolo: string): string | null {
  switch (ruolo) {
    case 'manager':
      return 'bg-zinc-500'
    case 'agenzia':
      return 'bg-blue-500'
    case 'agente':
      return 'bg-blue-400'
    case 'back_office':
      return 'bg-sky-400'
    case 'rivenditore':
      return 'bg-green-500'
    case 'studio':
      return 'bg-orange-500'
    case 'studio_associato':
      return 'bg-orange-400'
    default:
      return null
  }
}

/** Pallino per i badge di riepilogo (include ruoli secondari come agente). */
export function ruoloBreakdownDotClass(ruolo: string): string | null {
  if (ruolo === 'agente') return 'bg-blue-400'
  if (ruolo === 'back_office') return 'bg-sky-400'
  if (ruolo === 'distributore') return 'bg-violet-500'
  if (ruolo === 'studio_associato') return 'bg-orange-400'
  return ruoloGerarchiaDotClass(ruolo)
}

/** Bordo dello stesso colore del pallino di ruolo. Classi intere: Tailwind non genera quelle costruite a runtime. */
export function ruoloChipBorderClass(ruolo: string): string {
  switch (ruolo) {
    case 'manager':
      return 'border-zinc-400'
    case 'agenzia':
      return 'border-blue-500'
    case 'agente':
      return 'border-blue-400'
    case 'back_office':
      return 'border-sky-400'
    case 'rivenditore':
      return 'border-green-500'
    case 'distributore':
      return 'border-violet-500'
    case 'studio':
      return 'border-orange-500'
    case 'studio_associato':
      return 'border-orange-400'
    default:
      return 'border-zinc-400'
  }
}

export type RoleBreakdownBadge = { ruolo: string; label: string }

/** Badge conteggio discendenti da mostrare nel box di un profilo in struttura organizzativa. */
export function roleBreakdownBadgesForNode(ruolo: string): RoleBreakdownBadge[] {
  switch (ruolo) {
    case 'manager':
      return [
        { ruolo: 'agenzia', label: 'Agenzie' },
        { ruolo: 'agente', label: 'Agenti' },
        { ruolo: 'back_office', label: 'Back-Office' },
        { ruolo: 'rivenditore', label: 'Rivenditori' },
        { ruolo: 'distributore', label: 'Venditori' },
        { ruolo: 'studio', label: 'Sedi Studio' },
        { ruolo: 'studio_associato', label: 'Studio' },
      ]
    case 'agenzia':
      return [
        { ruolo: 'agente', label: 'Agenti' },
        { ruolo: 'back_office', label: 'Back-Office' },
        { ruolo: 'rivenditore', label: 'Rivenditori' },
        { ruolo: 'studio', label: 'Sedi Studio' },
      ]
    case 'agente':
      return [
        { ruolo: 'agente', label: 'Agenti' },
        { ruolo: 'rivenditore', label: 'Rivenditori' },
        { ruolo: 'studio', label: 'Sedi Studio' },
      ]
    case 'back_office':
      return [
        { ruolo: 'agente', label: 'Agenti' },
        { ruolo: 'back_office', label: 'Back-Office' },
        { ruolo: 'studio', label: 'Sedi Studio' },
      ]
    case 'rivenditore':
      return [
        { ruolo: 'studio', label: 'Sedi Studio' },
        { ruolo: 'studio_associato', label: 'Studio' },
      ]
    case 'distributore':
      return [
        { ruolo: 'distributore', label: 'Venditori' },
        { ruolo: 'studio', label: 'Sedi Studio' },
        { ruolo: 'studio_associato', label: 'Studio' },
      ]
    case 'studio':
      return [{ ruolo: 'studio_associato', label: 'Studio' }]
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

function agenziaFromId(
  lookup: HierarchyLookup,
  id: string | null | undefined,
): ProfiloGerarchiaRow | null {
  if (!id) return null
  const profilo = lookup.byId.get(id)
  return profilo?.ruolo === 'agenzia' ? profilo : null
}

function resolveAgenziaParentForAgentWalk(
  agentProfile: ProfiloGerarchiaRow,
  lookup: HierarchyLookup,
  visited: Set<string>,
): ProfiloGerarchiaRow | null {
  if (visited.has(agentProfile.id)) return null
  visited.add(agentProfile.id)

  const fromInvito = agenziaFromId(lookup, agentProfile.invitato_da)
  if (fromInvito) return fromInvito

  for (const otherId of lookup.neighbors.get(agentProfile.id) ?? []) {
    const hit = agenziaFromId(lookup, otherId)
    if (hit) return hit
  }

  const inviter = lookup.byId.get(agentProfile.invitato_da ?? '')
  if (inviter && isAgenteLike(inviter.ruolo)) {
    return resolveAgenziaParentForAgentWalk(inviter, lookup, visited)
  }

  return null
}

export function resolveAgenziaParentForAgent(
  agentProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
  seen?: Set<string>,
): ProfiloGerarchiaRow | null {
  const lookup = lookupOf(profili, links)
  if (!seen) {
    const cached = lookup.agenziaPerAgente.get(agentProfile.id)
    if (cached !== undefined) return cached
  }

  const result = resolveAgenziaParentForAgentWalk(agentProfile, lookup, seen ?? new Set())
  if (!seen) lookup.agenziaPerAgente.set(agentProfile.id, result)
  return result
}

export type FlatListViewerRole = 'agenzia' | 'agente' | 'back_office' | 'rivenditore' | 'distributore' | 'studio'

export type FlatListTab = { id: string; label: string; ruolo: string }

const FLAT_LIST_TABS_BY_VIEWER: Record<FlatListViewerRole, FlatListTab[]> = {
  agenzia: [
    { id: 'agente', label: 'Agenti', ruolo: 'agente' },
    { id: 'back_office', label: 'Back-Office', ruolo: 'back_office' },
    { id: 'rivenditore', label: 'Rivenditori', ruolo: 'rivenditore' },
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'studio', label: 'Sedi Studio', ruolo: 'studio' },
  ],
  agente: [
    { id: 'agente', label: 'Agenti', ruolo: 'agente' },
    { id: 'back_office', label: 'Back-Office', ruolo: 'back_office' },
    { id: 'rivenditore', label: 'Rivenditori', ruolo: 'rivenditore' },
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'studio', label: 'Sedi Studio', ruolo: 'studio' },
  ],
  back_office: [
    { id: 'agente', label: 'Agenti', ruolo: 'agente' },
    { id: 'back_office', label: 'Back-Office', ruolo: 'back_office' },
    { id: 'rivenditore', label: 'Rivenditori', ruolo: 'rivenditore' },
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'studio', label: 'Sedi Studio', ruolo: 'studio' },
  ],
  rivenditore: [
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'partner_dipendente', label: 'Promoter', ruolo: 'partner_dipendente' },
    { id: 'studio', label: 'Sedi Studio', ruolo: 'studio' },
  ],
  distributore: [
    { id: 'distributore', label: 'Venditori', ruolo: 'distributore' },
    { id: 'partner_dipendente', label: 'Promoter', ruolo: 'partner_dipendente' },
    { id: 'studio', label: 'Sedi Studio', ruolo: 'studio' },
  ],
  studio: [
    { id: 'studio_associato', label: 'Studio', ruolo: 'studio_associato' },
  ],
}

export function flatListTabsForViewer(viewerRole: FlatListViewerRole): FlatListTab[] {
  return FLAT_LIST_TABS_BY_VIEWER[viewerRole] ?? []
}

export function resolveRivenditoreParentForDistributore(
  distributoreProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
  seen?: Set<string>,
): ProfiloGerarchiaRow | null {
  const visited = seen ?? new Set<string>()
  if (visited.has(distributoreProfile.id)) return null
  visited.add(distributoreProfile.id)

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

  const inviter = byId.get(distributoreProfile.invitato_da ?? '')
  if (inviter?.ruolo === 'distributore') {
    const viaInviter = resolveRivenditoreParentForDistributore(inviter, profili, links, visited)
    if (viaInviter) return viaInviter
  }

  let current: ProfiloGerarchiaRow | null = distributoreProfile
  const walked = new Set<string>()
  while (current && !walked.has(current.id)) {
    walked.add(current.id)
    const parent = findDirectParentProfile(current, profili, links)
    if (!parent) break
    if (parent.ruolo === 'rivenditore') return parent
    current = parent
  }

  return null
}

export function resolveAgenziaParentForRivenditore(
  rivenditoreProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const lookup = lookupOf(profili, links)
  const cached = lookup.agenziaPerRivenditore.get(rivenditoreProfile.id)
  if (cached !== undefined) return cached

  const fromInvito = agenziaFromId(lookup, rivenditoreProfile.invitato_da)
  let result: ProfiloGerarchiaRow | null = fromInvito
  if (!result) {
    const inviter = lookup.byId.get(rivenditoreProfile.invitato_da ?? '')
    if (inviter && isAgenteLike(inviter.ruolo)) {
      const agenziaViaAgente = agenziaFromId(lookup, inviter.invitato_da)
      result = agenziaViaAgente ?? resolveAgenziaParentForAgent(inviter, profili, links)
    }
  }
  if (!result) {
    for (const otherId of lookup.neighbors.get(rivenditoreProfile.id) ?? []) {
      const hit = agenziaFromId(lookup, otherId)
      if (hit) {
        result = hit
        break
      }
    }
  }

  lookup.agenziaPerRivenditore.set(rivenditoreProfile.id, result)
  return result
}

function etichettaPersona(p: ProfiloGerarchiaRow): string {
  return (p.nome_completo || p.societa || p.email || '').trim()
}

function etichettaSocieta(p: ProfiloGerarchiaRow): string {
  return (p.societa || p.nome_completo || p.email || '').trim()
}

function agenteDaSeguitoDa(
  seguitoDa: string,
  profili: ProfiloGerarchiaRow[],
): ProfiloGerarchiaRow | null {
  const key = seguitoDa.trim().toLocaleLowerCase('it')
  if (!key) return null
  return (
    profili.find(
      (p) =>
        isAgenteLike(p.ruolo) && (p.nome_completo ?? '').trim().toLocaleLowerCase('it') === key,
    ) ?? null
  )
}

function etichetteManager(
  profile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): string[] {
  const visti = new Set<string>()
  const labels: string[] = []
  for (const manager of chiSegueQuestoProfilo(profile, profili, links)) {
    if (manager.ruolo !== 'manager' || visti.has(manager.id)) continue
    visti.add(manager.id)
    const label = etichettaPersona(manager)
    if (label) labels.push(label)
  }
  return labels
}

/** Catena "Seguito da" nella struttura: venditore, rivenditore, agente, agenzia. */
export function seguitoDaCatena(
  profile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): string | null {
  if (profile.ruolo === 'agenzia' || profile.ruolo === 'agente' || profile.ruolo === 'back_office') {
    let managers = etichetteManager(profile, profili, links)
    if (managers.length === 0 && profile.ruolo !== 'agenzia') {
      const agenzia = resolveAgenziaParentForAgent(profile, profili, links)
      if (agenzia) managers = etichetteManager(agenzia, profili, links)
    }
    return managers.length > 0 ? managers.join(', ') : null
  }

  if (
    profile.ruolo !== 'rivenditore' &&
    profile.ruolo !== 'distributore' &&
    profile.ruolo !== 'partner_dipendente' &&
    profile.ruolo !== 'studio' &&
    profile.ruolo !== 'studio_associato'
  ) {
    return null
  }

  const byId = new Map(profili.map((p) => [p.id, p]))
  const parts: string[] = []
  const push = (label: string | null | undefined) => {
    const value = label?.trim()
    if (!value) return
    const key = value.toLocaleLowerCase('it')
    if (parts.some((part) => part.toLocaleLowerCase('it') === key)) return
    parts.push(value)
  }

  if (profile.ruolo === 'studio' || profile.ruolo === 'studio_associato') {
    push(profile.seguito_da)
  }

  const inviter = byId.get(profile.invitato_da ?? '')
  let rivenditore: ProfiloGerarchiaRow | null = profile.ruolo === 'rivenditore' ? profile : null

  if (profile.ruolo === 'distributore') {
    if (inviter?.ruolo === 'distributore') push(etichettaPersona(inviter))
    rivenditore = resolveRivenditoreParentForDistributore(profile, profili, links)
  }

  if (
    profile.ruolo === 'partner_dipendente' ||
    profile.ruolo === 'studio' ||
    profile.ruolo === 'studio_associato'
  ) {
    if (inviter?.ruolo === 'distributore') {
      push(etichettaPersona(inviter))
      rivenditore = resolveRivenditoreParentForDistributore(inviter, profili, links)
    } else if (inviter?.ruolo === 'rivenditore') {
      rivenditore = inviter
    } else if (inviter && isAgenteLike(inviter.ruolo)) {
      push(etichettaPersona(inviter))
      const agenziaAgente = resolveAgenziaParentForAgent(inviter, profili, links)
      push(agenziaAgente ? etichettaSocieta(agenziaAgente) : null)
      return parts.length > 0 ? parts.join(', ') : null
    }
  }

  if (profile.ruolo !== 'rivenditore' && rivenditore) push(etichettaSocieta(rivenditore))

  const seguito = rivenditore?.seguito_da?.trim() || profile.seguito_da?.trim() || null
  if (profile.ruolo === 'rivenditore' && !seguito) return null
  push(seguito)

  const agente = seguito ? agenteDaSeguitoDa(seguito, profili) : null
  const agenzia = agente
    ? resolveAgenziaParentForAgent(agente, profili, links)
    : rivenditore
      ? resolveAgenziaParentForRivenditore(rivenditore, profili, links)
      : null
  push(agenzia ? etichettaSocieta(agenzia) : null)

  return parts.length > 0 ? parts.join(', ') : null
}

const RANGO_CATENA: Record<string, number> = {
  manager: 0,
  agenzia: 1,
  agente: 2,
  back_office: 2,
  rivenditore: 3,
  distributore: 4,
  partner_dipendente: 4,
  studio: 5,
  studio_associato: 6,
}

const RUOLI_CATENA_VISIBILI = ['manager', 'agenzia', 'agente', 'rivenditore', 'distributore'] as const

export type SeguitoDaPerRuolo = {
  ruolo: (typeof RUOLI_CATENA_VISIBILI)[number]
  etichette: string[]
}

/** Catena verso l'alto, divisa per ruolo: manager, agenzia, agente, rivenditore, venditore. */
export function seguitoDaPerRuolo(
  profile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): SeguitoDaPerRuolo[] {
  const rankOf = (ruolo: string) => RANGO_CATENA[ruolo] ?? 99
  const gruppi = new Map<string, ProfiloGerarchiaRow[]>()
  const seen = new Set<string>([profile.id])
  const queue: ProfiloGerarchiaRow[] = [profile]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    const currentRank = rankOf(current.ruolo)
    for (const parent of chiSegueQuestoProfilo(current, profili, links)) {
      if (seen.has(parent.id)) continue
      const parentRank = rankOf(parent.ruolo)
      const stessoRuoloInvito = parentRank === currentRank && current.invitato_da === parent.id
      if (parentRank > currentRank) continue
      if (parentRank === currentRank && !stessoRuoloInvito) continue
      seen.add(parent.id)
      if ((RUOLI_CATENA_VISIBILI as readonly string[]).includes(parent.ruolo)) {
        const lista = gruppi.get(parent.ruolo) ?? []
        lista.push(parent)
        gruppi.set(parent.ruolo, lista)
      }
      queue.push(parent)
    }
  }

  return RUOLI_CATENA_VISIBILI.flatMap((ruolo) => {
    const persone = gruppi.get(ruolo)
    if (!persone?.length) return []
    const etichette = [
      ...new Set(
        persone
          .map((persona) => profiloGerarchiaDisplayLabel(persona))
          .map((label) => label.trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
    if (etichette.length === 0) return []
    return [{ ruolo, etichette }]
  })
}

function ruoloPuoEssereGenitore(parentRuolo: string, childRuolo: string): boolean {
  return (CHILD_ROLES_BY_PARENT[parentRuolo] ?? []).includes(childRuolo)
}

function profiliCollegati(idA: string, idB: string, lookup: HierarchyLookup): boolean {
  return lookup.directed.has(linkPair(idA, idB)) || lookup.directed.has(linkPair(idB, idA))
}

/** Chi segue questo profilo: persona e società a cui è collegato, staccabili con una dissociazione. */
export function chiSegueQuestoProfilo(
  profile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  const lookup = lookupOf(profili, links)
  const candidates = new Map<string, ProfiloGerarchiaRow>()
  const inviter = lookup.byId.get(profile.invitato_da ?? '')
  if (inviter) candidates.set(inviter.id, inviter)

  for (const otherId of lookup.neighbors.get(profile.id) ?? []) {
    const other = lookup.byId.get(otherId)
    if (other) candidates.set(other.id, other)
  }

  const seguito = profile.seguito_da?.trim().toLocaleLowerCase('it') ?? ''
  if (seguito) {
    const agente = lookup.firstAgenteLikeByNome.get(seguito)
    if (agente) candidates.set(agente.id, agente)
  }

  const ordered: ProfiloGerarchiaRow[] = []
  const seen = new Set<string>()
  for (const other of candidates.values()) {
    if (other.id === profile.id || seen.has(other.id)) continue
    // L'admin è un account di sistema. Il manager invece è il genitore dell'agenzia
    // creata dalla piattaforma e deve comparire in «Seguito da».
    if (other.ruolo === 'admin' || other.ruolo === 'free') continue
    if (other.invitato_da === profile.id) continue

    const nome = (other.nome_completo ?? '').trim().toLocaleLowerCase('it')
    const seguitoMatch = Boolean(seguito && nome && seguito === nome && isAgenteLike(other.ruolo))
    const invito = profile.invitato_da === other.id
    const linked = profiliCollegati(profile.id, other.id, lookup)
    const otherParent = ruoloPuoEssereGenitore(other.ruolo, profile.ruolo)
    const thisParent = ruoloPuoEssereGenitore(profile.ruolo, other.ruolo)
    const superiore = linked && otherParent && !thisParent
    const pari =
      linked &&
      otherParent &&
      thisParent &&
      !profile.invitato_da &&
      other.invitato_da !== profile.id

    if (!invito && !seguitoMatch && !superiore && !pari) continue
    seen.add(other.id)
    ordered.push(other)
  }

  return ordered
}

/** Sede studio assegnata a un agente dell'agenzia (invito diretto). */
export function agenteAssegnatoASedeStudio(
  studio: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[] = [],
): ProfiloGerarchiaRow | null {
  if (studio.ruolo !== 'studio') return null
  const lookup = lookupOf(profili, links)
  const cached = lookup.agentePerStudio.get(studio.id)
  if (cached !== undefined) return cached

  const inviter = lookup.byId.get(studio.invitato_da ?? '')
  let result: ProfiloGerarchiaRow | null = inviter?.ruolo === 'agente' ? inviter : null

  if (!result) {
    const seguito = studio.seguito_da?.trim().toLocaleLowerCase('it')
    if (seguito) result = lookup.firstAgenteByNome.get(seguito) ?? null
  }

  if (!result) {
    for (const otherId of lookup.neighbors.get(studio.id) ?? []) {
      const agente = lookup.byId.get(otherId)
      if (agente?.ruolo === 'agente') {
        result = agente
        break
      }
    }
  }

  lookup.agentePerStudio.set(studio.id, result)
  return result
}

/** Agente a cui il rivenditore è collegato: invito diretto oppure nome in «Seguito da». */
export function agenteCheSegueRivenditore(
  rivenditore: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[] = [],
): ProfiloGerarchiaRow | null {
  if (rivenditore.ruolo !== 'rivenditore') return null
  const lookup = lookupOf(profili, links)
  const cached = lookup.agentePerRivenditore.get(rivenditore.id)
  if (cached !== undefined) return cached

  const inviter = lookup.byId.get(rivenditore.invitato_da ?? '')
  let result: ProfiloGerarchiaRow | null = inviter?.ruolo === 'agente' ? inviter : null
  if (!result) {
    const seguito = rivenditore.seguito_da?.trim().toLocaleLowerCase('it')
    if (seguito) result = lookup.firstAgenteByNome.get(seguito) ?? null
  }
  if (!result) {
    for (const otherId of lookup.neighbors.get(rivenditore.id) ?? []) {
      const agente = lookup.byId.get(otherId)
      if (agente?.ruolo === 'agente') {
        result = agente
        break
      }
    }
  }

  lookup.agentePerRivenditore.set(rivenditore.id, result)
  return result
}

/** True se il rivenditore appartiene alla gerarchia dell'agenzia (invito diretto, agente o rubrica). */
export function isRivenditoreManagedByAgenzia(
  agenziaId: string,
  rivenditore: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): boolean {
  if (rivenditore.ruolo !== 'rivenditore') return false
  const agenzia = resolveAgenziaParentForRivenditore(rivenditore, profili, links)
  return agenzia?.id === agenziaId
}

/** True se il rivenditore è collegato all'agente (invito diretto, referente o rubrica). */
export function isRivenditoreManagedByAgente(
  agenteId: string,
  rivenditore: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): boolean {
  if (rivenditore.ruolo !== 'rivenditore') return false
  return agenteCheSegueRivenditore(rivenditore, profili, links)?.id === agenteId
}

function findAgenteParentForRivenditore(
  rivenditoreProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const byId = new Map(profili.map((p) => [p.id, p]))
  const fromInvito = byId.get(rivenditoreProfile.invitato_da ?? '')
  if (fromInvito && isAgenteLike(fromInvito.ruolo)) return fromInvito

  const parent = findDirectParentProfile(rivenditoreProfile, profili, links)
  return parent && isAgenteLike(parent.ruolo) ? parent : null
}

function getAgentiInCompanyScope(
  ownerProfile: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow[] {
  if (ownerProfile.ruolo === 'agenzia') {
    return getDescendantsByRole(ownerProfile.id, ownerProfile, 'agente', profili, links)
  }

  if (isAgenteLike(ownerProfile.ruolo)) {
    const agenzia = resolveAgenziaParentForAgent(ownerProfile, profili, links)
    if (agenzia) {
      return getDescendantsByRole(agenzia.id, agenzia, 'agente', profili, links)
    }
    const inviter = profili.find((p) => p.id === ownerProfile.invitato_da)
    return inviter && isAgenteLike(inviter.ruolo) ? [inviter] : []
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
  if (isAgenteLike(viewerRole)) {
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
  if (targetRole === 'distributore' && ownerProfile.ruolo === 'distributore') {
    const rivenditore = resolveRivenditoreParentForDistributore(ownerProfile, profili, links)
    if (rivenditore) {
      return getDescendantsByRole(rivenditore.id, rivenditore, 'distributore', profili, links)
    }
    const inviter = profili.find((p) => p.id === ownerProfile.invitato_da)
    return inviter?.ruolo === 'distributore' ? [inviter] : []
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

export function profiloToGerarchiaRow(
  p: {
    id: string
    nome_completo: string | null
    societa?: string | null
    email: string | null
    area_geografica: string | null
    ruolo: string
    registrazione_approvata?: boolean | null
    seguito_da?: string | null
    giro_visita?: string | null
    telefonata?: string | null
    note_visita?: string | null
    note_telefonata?: string | null
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
    seguito_da: p.seguito_da ?? null,
    giro_visita: p.giro_visita ?? null,
    telefonata: p.telefonata ?? null,
    note_visita: p.note_visita ?? null,
    note_telefonata: p.note_telefonata ?? null,
  }
}

export function associatiAggiungiSectionLabel(ruolo: string): string | null {
  const childRoles = CHILD_ROLES_BY_PARENT[ruolo]
  if (!childRoles?.length) return null
  switch (ruolo) {
    case 'admin':
      return 'Associa manager'
    case 'manager':
      return 'Associa agenzia / agente / back-office / rivenditore / venditore / promoter / sede studio / studio'
    case 'agenzia':
      return 'Associa agente / back-office / rivenditore / sede studio'
    case 'agente':
      return 'Associa rivenditore / sede studio'
    case 'back_office':
      return 'Associa sede studio'
    case 'rivenditore':
      return 'Associa venditore / promoter / studio / sede studio'
    case 'distributore':
      return 'Associa promoter / sede studio / studio'
    case 'partner_dipendente':
      return 'Associa sede studio'
    case 'studio':
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
  lookup?: HierarchyLookup,
): boolean {
  const directed = lookup?.directed
  const has = (utenteId: string, operatoreId: string) =>
    directed
      ? directed.has(linkPair(utenteId, operatoreId))
      : links.some((l) => l.utente_id === utenteId && l.operatore_id === operatoreId)
  if (has(parentId, childId)) return true
  if (OPERATOR_ROLES.has(parentRole) && OPERATOR_ROLES.has(childRole)) {
    if (has(childId, parentId)) return true
  }
  return false
}

/** Invito o rubrica, senza passare dalla risoluzione agenzia. */
function isLinkedByInviteOrRubrica(
  parentId: string,
  parentRole: string,
  child: ProfiloGerarchiaRow,
  links: OperatoreLink[],
  lookup: HierarchyLookup,
): boolean {
  if (child.invitato_da === parentId) return true
  if (hasDirectedParentChildLink(parentId, child.id, parentRole, child.ruolo, links, lookup)) return true
  if (lookup.directed.has(linkPair(child.id, parentId))) return true
  return false
}

function managerShouldShowAgenzia(
  managerId: string,
  agenzia: ProfiloGerarchiaRow,
  lookup: HierarchyLookup,
): boolean {
  // Nel pannello admin la spunta rappresenta la connessione esplicita.
  // Un vecchio `invitato_da` non deve far ricomparire l'agenzia dopo la dissociazione.
  return (
    lookup.directed.has(linkPair(managerId, agenzia.id)) ||
    lookup.directed.has(linkPair(agenzia.id, managerId))
  )
}

/** Lo studio è già figlio di una sede: in albero non va ripetuto sotto l'agente che la segue. */
function appartieneASedeStudio(
  child: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
  lookup: HierarchyLookup,
): boolean {
  if (child.ruolo !== 'studio_associato') return false
  const cached = lookup.appartieneSede.get(child.id)
  if (cached !== undefined) return cached
  const result = (lookup.byRole.get('studio') ?? []).some(
    (sede) => sede.id !== child.id && isDirectChild(sede.id, sede, child, links, profili),
  )
  lookup.appartieneSede.set(child.id, result)
  return result
}

function isDirectChild(
  parentId: string,
  parentProfile: ProfiloGerarchiaRow,
  child: ProfiloGerarchiaRow,
  links: OperatoreLink[],
  profili: ProfiloGerarchiaRow[],
): boolean {
  const lookup = lookupOf(profili, links)
  const expectedRoles = CHILD_ROLES_BY_PARENT[parentProfile.ruolo] ?? []
  if (!expectedRoles.includes(child.ruolo)) return false
  if (
    child.ruolo === 'studio_associato' &&
    parentProfile.ruolo !== 'studio' &&
    appartieneASedeStudio(child, profili, links, lookup)
  ) {
    return false
  }
  if (parentProfile.ruolo === 'back_office' && (child.ruolo === 'rivenditore' || child.ruolo === 'studio')) {
    return false
  }
  if (parentProfile.ruolo === 'agente' && child.ruolo === 'rivenditore') {
    if (hasDirectedParentChildLink(parentId, child.id, parentProfile.ruolo, child.ruolo, links, lookup)) {
      return true
    }
    return agenteCheSegueRivenditore(child, profili, links)?.id === parentId
  }
  if (parentProfile.ruolo === 'agente' && child.ruolo === 'studio') {
    if (hasDirectedParentChildLink(parentId, child.id, parentProfile.ruolo, child.ruolo, links, lookup)) {
      return true
    }
    return agenteAssegnatoASedeStudio(child, profili, links)?.id === parentId
  }
  if (parentProfile.ruolo === 'agente' && child.ruolo === 'partner_dipendente') {
    return isLinkedByInviteOrRubrica(parentId, parentProfile.ruolo, child, links, lookup)
  }
  if (
    isAgenteLike(parentProfile.ruolo) &&
    (child.ruolo === 'agente' ||
      child.ruolo === 'back_office' ||
      child.ruolo === 'distributore' ||
      child.ruolo === 'studio_associato')
  ) {
    return isLinkedByInviteOrRubrica(parentId, parentProfile.ruolo, child, links, lookup)
  }
  if (parentProfile.ruolo === 'distributore' && child.ruolo === 'distributore') {
    return isLinkedByInviteOrRubrica(parentId, parentProfile.ruolo, child, links, lookup)
  }
  if (
    parentProfile.ruolo === 'distributore' &&
    (child.ruolo === 'studio' || child.ruolo === 'studio_associato')
  ) {
    return isLinkedByInviteOrRubrica(parentId, parentProfile.ruolo, child, links, lookup)
  }
  // Manager: se l'agente ha un'agenzia, mostra l'agenzia (non l'agente sciolto).
  if (parentProfile.ruolo === 'manager' && isAgenteLike(child.ruolo)) {
    if (resolveAgenziaParentForAgent(child, profili, links)) return false
  }
  if (parentProfile.ruolo === 'manager' && child.ruolo === 'agenzia') {
    return managerShouldShowAgenzia(parentId, child, lookup)
  }
  if (parentProfile.ruolo === 'agenzia' && isAgenteLike(child.ruolo)) {
    const inviter = lookup.byId.get(child.invitato_da ?? '')
    if (!(inviter && isAgenteLike(inviter.ruolo))) {
      const agenzia = resolveAgenziaParentForAgent(child, profili, links)
      if (agenzia?.id === parentId) return true
    }
  }
  if (parentProfile.ruolo === 'agenzia' && child.ruolo === 'rivenditore') {
    const agenteCollegato = (lookup.byRole.get('agente') ?? []).find(
      (p) =>
        hasDirectedParentChildLink(p.id, child.id, p.ruolo, child.ruolo, links, lookup) &&
        resolveAgenziaParentForAgent(p, profili, links)?.id === parentId,
    )
    if (agenteCollegato) return false
    const agente = agenteCheSegueRivenditore(child, profili, links)
    if (agente && resolveAgenziaParentForAgent(agente, profili, links)?.id === parentId) return false
    if (child.invitato_da === parentId) return true
    const agenzia = resolveAgenziaParentForRivenditore(child, profili, links)
    if (agenzia?.id === parentId) return true
  }
  if (parentProfile.ruolo === 'agenzia' && child.ruolo === 'studio') {
    const agenteCollegato = (lookup.byRole.get('agente') ?? []).find(
      (p) =>
        hasDirectedParentChildLink(p.id, child.id, p.ruolo, child.ruolo, links, lookup) &&
        resolveAgenziaParentForAgent(p, profili, links)?.id === parentId,
    )
    if (agenteCollegato) return false
    const agente = agenteAssegnatoASedeStudio(child, profili, links)
    if (agente && resolveAgenziaParentForAgent(agente, profili, links)?.id === parentId) return false
    if (child.invitato_da === parentId) return true
  }
  if (
    parentProfile.ruolo === 'agenzia' &&
    (child.ruolo === 'distributore' || child.ruolo === 'partner_dipendente' || child.ruolo === 'studio_associato')
  ) {
    const inviter = lookup.byId.get(child.invitato_da ?? '')
    if (inviter?.ruolo === 'agente' && resolveAgenziaParentForAgent(inviter, profili, links)?.id === parentId) {
      return false
    }
  }
  if (parentProfile.ruolo === 'rivenditore' && child.ruolo === 'distributore') {
    const inviter = lookup.byId.get(child.invitato_da ?? '')
    if (inviter?.ruolo === 'distributore') return false
  }
  if (
    parentProfile.ruolo === 'rivenditore' &&
    (child.ruolo === 'studio' || child.ruolo === 'studio_associato')
  ) {
    const inviter = lookup.byId.get(child.invitato_da ?? '')
    if (inviter?.ruolo === 'distributore') return false
  }
  if (child.invitato_da === parentId) return true
  if (hasDirectedParentChildLink(
    parentId,
    child.id,
    parentProfile.ruolo,
    child.ruolo,
    links,
    lookup,
  )) {
    return true
  }
  // Link inverso: il figlio ha il parent in rubrica (es. agente vede il manager che l'ha invitato)
  if (lookup.directed.has(linkPair(child.id, parentId))) return true
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
    agenzia: ['agente', 'back_office', 'agenzia'],
    agente: ['agente', 'back_office', 'agenzia'],
    back_office: ['agente', 'back_office', 'agenzia'],
    rivenditore: ['distributore', 'rivenditore', 'partner_dipendente'],
    distributore: ['partner_dipendente', 'distributore', 'rivenditore'],
  }

  let stopRoles: string[]
  switch (child.ruolo) {
    case 'agente':
    case 'back_office':
      stopRoles = ['agente', 'back_office', 'agenzia']
      break
    case 'distributore':
    case 'partner_dipendente':
      stopRoles = ['partner_dipendente', 'distributore', 'rivenditore']
      break
    case 'rivenditore':
      stopRoles = ['agente', 'back_office', 'agenzia']
      break
    default:
      stopRoles = stopRolesByOwner[ownerProfile.ruolo] ?? []
  }

  if (stopRoles.length === 0) return null

  const stopSet = new Set(stopRoles)
  const invitedBy = profili.find((p) => p.id === child.invitato_da)
  if (
    invitedBy &&
    stopSet.has(invitedBy.ruolo) &&
    isDirectChild(invitedBy.id, invitedBy, child, links, profili)
  ) {
    return invitedBy
  }

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
  const preferSocieta = p.ruolo === 'agenzia' || p.ruolo === 'rivenditore' || p.ruolo === 'studio'

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
  const lookup = lookupOf(profili, links)
  if (parentId && parentProfile && lookup.childrenByParent.has(parentId)) {
    return lookup.childrenByParent.get(parentId) ?? []
  }

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
  const result = sortProfilesByRoleThenName([...unique.values()], parentProfile)
  if (parentId && parentProfile) lookup.childrenByParent.set(parentId, result)
  return result
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
      return 'Agenzie / agenti / back-office / rivenditori / venditori / promoter / sedi studio / studi associati'
    case 'agenzia':
      return 'Agenti / back-office / rivenditori / sedi studio associati'
    case 'agente':
      return 'Agenti / venditori / studi / sedi studio associati'
    case 'back_office':
      return 'Agenti / back-office / venditori / studi / sedi studio associati'
    case 'rivenditore':
      return 'Venditori / promoter / studi / sedi studio associati'
    case 'distributore':
      return 'Venditori / promoter / studi / sedi studio associati'
    case 'partner_dipendente':
      return 'Sedi studio associate'
    case 'studio':
      return 'Studio associati'
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
      case 'back_office':
        return 'Back-Office associati'
      case 'rivenditore':
        return 'Rivenditori associati'
      case 'distributore':
        return 'Venditori associati'
      case 'partner_dipendente':
        return 'Promoter associati'
      case 'studio':
        return 'Sedi studio associate'
      case 'studio_associato':
        return 'Studio associati'
      default:
        return `${ruoloGerarchiaLabel(roles[0])} associati`
    }
  }
  return 'Associati'
}
