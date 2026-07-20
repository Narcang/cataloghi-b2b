'use client'

import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import {
  getDescendantsByRole,
  profiloGerarchiaDisplayLabel,
  referentAssociatoLabel,
  resolveFlatListReferent,
  ruoloGerarchiaDotClass,
  ruoloGerarchiaLabel,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type FlatTab = { id: string; label: string; ruolo: string }

const MULTI_TAB_ROLES = new Set(['agenzia', 'agente'])

const MULTI_TABS: FlatTab[] = [
  { id: 'rivenditore', label: 'Rivenditori', ruolo: 'rivenditore' },
  { id: 'studio', label: 'Studi', ruolo: 'studio' },
]

type FlatListViewerRole = 'agenzia' | 'agente' | 'rivenditore' | 'distributore'

type Props = {
  ownerProfile: ProfiloGerarchiaRow
  viewerRole: FlatListViewerRole
  profili: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
}

function flatListSectionTitle(viewerRole: FlatListViewerRole): string {
  return viewerRole === 'rivenditore' || viewerRole === 'distributore'
    ? 'Elenco Tutti Gli Studi Associati'
    : 'Elenco Tutti Gli Associati'
}

function flatListSectionDesc(viewerRole: FlatListViewerRole): string {
  switch (viewerRole) {
    case 'agenzia':
      return 'Vista rapida di tutti i rivenditori e gli studi collegati alla tua agenzia, con il referente agente o agenzia.'
    case 'agente':
      return 'Vista rapida di tutti i rivenditori e gli studi collegati al tuo profilo agente, con il referente di riferimento.'
    case 'rivenditore':
      return 'Vista rapida di tutti gli studi collegati al tuo profilo rivenditore, con il venditore di riferimento.'
    case 'distributore':
      return 'Vista rapida di tutti gli studi collegati al tuo profilo venditore, con il rivenditore o promoter di riferimento.'
  }
}

function AssociatoCard({
  profile,
  referent,
}: {
  profile: ProfiloGerarchiaRow
  referent: ProfiloGerarchiaRow | null
}) {
  const roleDotClass = ruoloGerarchiaDotClass(profile.ruolo)

  return (
    <li className="list-none">
      <div className="rounded-xl border border-black/10 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              {roleDotClass ? (
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${roleDotClass}`}
                  aria-hidden
                />
              ) : null}
              <span>{profiloGerarchiaDisplayLabel(profile)}</span>
            </h4>
            {profile.email ? (
              <p className="text-sm text-zinc-600 mt-0.5">{profile.email}</p>
            ) : null}
            <p className="text-xs text-zinc-500 mt-1">
              {profile.area_geografica || 'Area non indicata'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <span className="rounded-full border border-black/10 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              {ruoloGerarchiaLabel(profile.ruolo)}
            </span>
            {referent ? (
              <p className="text-base font-semibold text-zinc-800 max-w-[16rem] leading-snug">
                Associato a: {referentAssociatoLabel(referent)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function AssociatiPiattiPanel({
  ownerProfile,
  viewerRole,
  profili,
  links,
}: Props) {
  const tabs = MULTI_TAB_ROLES.has(viewerRole) ? MULTI_TABS : null
  const [activeTab, setActiveTab] = useState<string>('rivenditore')

  const activeRole = tabs ? tabs.find((t) => t.id === activeTab)?.ruolo ?? 'rivenditore' : 'studio'

  const associati = useMemo(
    () =>
      getDescendantsByRole(
        ownerProfile.id,
        ownerProfile,
        activeRole,
        profili,
        links,
      ),
    [ownerProfile, activeRole, profili, links],
  )

  const tabCounts = useMemo(() => {
    if (!tabs) return null
    return Object.fromEntries(
      tabs.map((tab) => [
        tab.id,
        getDescendantsByRole(ownerProfile.id, ownerProfile, tab.ruolo, profili, links).length,
      ]),
    ) as Record<string, number>
  }, [ownerProfile, profili, links, tabs])

  const referentById = useMemo(() => {
    const map = new Map<string, ProfiloGerarchiaRow | null>()
    for (const profile of associati) {
      map.set(profile.id, resolveFlatListReferent(profile, ownerProfile, profili, links))
    }
    return map
  }, [associati, ownerProfile, profili, links])

  const sectionTitle = flatListSectionTitle(viewerRole)
  const sectionDesc = flatListSectionDesc(viewerRole)

  const listHeading = tabs
    ? tabs.find((t) => t.id === activeTab)?.label ?? 'Associati'
    : 'Studi'

  return (
    <section id="elenco-associati" className="border border-black rounded-2xl bg-white p-6 space-y-6">
      <div>
        <h2 className="text-xl text-zinc-900 font-medium flex items-center gap-2">
          <Users size={20} className="text-[#060d41]" />
          {sectionTitle}
        </h2>
        <p className="text-sm text-zinc-600 mt-1">{sectionDesc}</p>
      </div>

      {tabs ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra associati per categoria">
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            const roleDotClass = ruoloGerarchiaDotClass(tab.ruolo)
            const count = tabCounts?.[tab.id] ?? 0
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[#060d41] bg-[#060d41] text-white'
                    : 'border-black/20 bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full min-w-[1.5rem] px-2 py-0.5 text-xs font-semibold text-center ${
                    roleDotClass
                      ? `${roleDotClass} text-white`
                      : active
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          {listHeading}
        </h3>

        {associati.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
            Nessun associato in questa categoria al momento.
          </div>
        ) : (
          <ul className="m-0 p-0 space-y-2">
            {associati.map((profile) => (
              <AssociatoCard
                key={profile.id}
                profile={profile}
                referent={referentById.get(profile.id) ?? null}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
