'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import {
  canHaveHierarchyChildren,
  countChildrenProfiles,
  defaultHierarchyRootRole,
  getChildrenProfiles,
  getHierarchyRootProfiles,
  HIERARCHY_ROOT_ROLE_OPTIONS,
  hierarchyRootRoleLabel,
  nestedAssociatiLabel,
  ruoloGerarchiaLabel,
  type HierarchyRootRole,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type Props = {
  currentUserId: string
  viewerRole: string
  profili: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  /**
   * Quando impostato, l'albero mostra solo i discendenti di questo profilo
   * (nessun filtro per ruolo; usato da agente/partner nella propria dashboard).
   */
  ownerProfile?: ProfiloGerarchiaRow
}

type HierarchyNodeProps = {
  profile: ProfiloGerarchiaRow
  depth: number
  currentUserId: string
  viewerRole: string
  profili: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

function HierarchyNode({
  profile,
  depth,
  currentUserId,
  viewerRole,
  profili,
  links,
  expandedIds,
  onToggle,
}: HierarchyNodeProps) {
  const children = getChildrenProfiles(
    profile.id,
    profile,
    currentUserId,
    viewerRole,
    profili,
    links,
  )
  const childCount = countChildrenProfiles(profile.id, profile, profili, links)
  const expandable = canHaveHierarchyChildren(profile.ruolo)
  const expanded = expandedIds.has(profile.id)
  const nestedLabel = nestedAssociatiLabel(profile.ruolo)

  return (
    <li className="list-none">
      <div
        className="flex items-stretch gap-2"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        {expandable ? (
          <button
            type="button"
            onClick={() => onToggle(profile.id)}
            className="mt-3 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
            aria-expanded={expanded}
            aria-label={expanded ? 'Comprimi' : 'Espandi'}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="mt-3 inline-flex h-8 w-8 shrink-0" aria-hidden />
        )}

        <div
          className={`mb-2 flex-1 rounded-xl border p-4 transition-colors ${
            expandable
              ? 'border-black bg-white shadow-sm cursor-pointer hover:border-[#060d41]'
              : 'border-black/10 bg-zinc-50'
          }`}
          role={expandable ? 'button' : undefined}
          tabIndex={expandable ? 0 : undefined}
          onClick={expandable ? () => onToggle(profile.id) : undefined}
          onKeyDown={
            expandable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggle(profile.id)
                  }
                }
              : undefined
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-zinc-900">
                {profile.nome_completo || 'Utente senza nome'}
              </h4>
              <p className="text-sm text-zinc-600 mt-0.5">{profile.email}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {profile.area_geografica || 'Area non indicata'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full border border-black/10 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                {ruoloGerarchiaLabel(profile.ruolo)}
              </span>
              {expandable ? (
                <span className="text-xs font-medium text-[#060d41]">
                  {childCount} associat{childCount === 1 ? 'o' : 'i'}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {expandable && expanded ? (
        <div
          className="border-l-2 border-[#060d41]/20 ml-6 pl-3"
          style={{ marginLeft: `${depth * 1.25 + 1.5}rem` }}
        >
          {nestedLabel ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2 mt-1">
              {nestedLabel}
            </p>
          ) : null}
          {children.length === 0 ? (
            <p className="text-sm text-zinc-500 mb-3 py-2">
              Nessun associato a questo livello.
            </p>
          ) : (
            <ul className="m-0 p-0 space-y-1">
              {children.map((child) => (
                <HierarchyNode
                  key={child.id}
                  profile={child}
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  viewerRole={viewerRole}
                  profili={profili}
                  links={links}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  )
}

export default function GerarchiaUtentiTree({
  currentUserId,
  viewerRole,
  profili,
  links,
  ownerProfile,
}: Props) {
  const [rootRole, setRootRole] = useState<HierarchyRootRole>(() =>
    defaultHierarchyRootRole(viewerRole),
  )
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setExpandedIds(new Set())
  }, [rootRole])

  // Modalità "propria gerarchia": radice = figli diretti dell'utente corrente
  const ownedRootNodes = useMemo(() => {
    if (!ownerProfile) return null
    return getChildrenProfiles(
      ownerProfile.id,
      ownerProfile,
      currentUserId,
      viewerRole,
      profili,
      links,
    )
  }, [ownerProfile, currentUserId, viewerRole, profili, links])

  // Modalità admin/manager: radice = tutti i profili del ruolo scelto
  const rootNodes = useMemo(
    () => (ownerProfile ? null : getHierarchyRootProfiles(rootRole, profili)),
    [ownerProfile, rootRole, profili],
  )

  const rootCounts = useMemo(() => {
    if (ownerProfile) return null
    const counts = new Map<HierarchyRootRole, number>()
    for (const option of HIERARCHY_ROOT_ROLE_OPTIONS) {
      counts.set(option.id, getHierarchyRootProfiles(option.id, profili).length)
    }
    return counts
  }, [ownerProfile, profili])

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- Modalità propria gerarchia (agente / partner) ---
  if (ownerProfile) {
    const childLabel = ownerProfile.ruolo === 'agente' ? 'Partner associati' : 'Studi associati'
    return (
      <section id="struttura-organizzativa" className="border border-black rounded-2xl bg-white p-6 space-y-6">
        <div>
          <h2 className="text-xl text-zinc-900 font-medium flex items-center gap-2">
            <Users size={20} className="text-[#060d41]" />
            I Tuoi Associati
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            {ownerProfile.ruolo === 'agente'
              ? 'I partner collegati al tuo profilo e i loro studi associati.'
              : 'Gli studi collegati al tuo profilo.'}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-4">
            {childLabel}
          </h3>
          {(ownedRootNodes ?? []).length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
              Nessun associato collegato al tuo profilo.
            </div>
          ) : (
            <ul className="m-0 p-0 space-y-1">
              {(ownedRootNodes ?? []).map((node) => (
                <HierarchyNode
                  key={node.id}
                  profile={node}
                  depth={0}
                  currentUserId={currentUserId}
                  viewerRole={viewerRole}
                  profili={profili}
                  links={links}
                  expandedIds={expandedIds}
                  onToggle={toggleExpanded}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    )
  }

  // --- Modalità admin/manager: filtro per ruolo ---
  return (
    <section id="struttura-organizzativa" className="border border-black rounded-2xl bg-white p-6 space-y-6">
      <div>
        <h2 className="text-xl text-zinc-900 font-medium flex items-center gap-2">
          <Users size={20} className="text-[#060d41]" />
          Struttura Organizzativa
        </h2>
        <p className="text-sm text-zinc-600 mt-1">
          Scegli il ruolo di partenza e clicca su un profilo per espandere gli associati a cascata.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra struttura per ruolo">
        {HIERARCHY_ROOT_ROLE_OPTIONS.map((option) => {
          const active = rootRole === option.id
          const count = rootCounts?.get(option.id) ?? 0
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRootRole(option.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-[#060d41] bg-[#060d41] text-white'
                  : 'border-black/20 bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {option.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          {hierarchyRootRoleLabel(rootRole)}
        </h3>

        {(rootNodes ?? []).length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
            Nessun utente con ruolo {hierarchyRootRoleLabel(rootRole).toLowerCase()} nel filtro corrente.
          </div>
        ) : (
          <ul className="m-0 p-0 space-y-1">
            {(rootNodes ?? []).map((node) => (
              <HierarchyNode
                key={node.id}
                profile={node}
                depth={0}
                currentUserId={currentUserId}
                viewerRole={viewerRole}
                profili={profili}
                links={links}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
