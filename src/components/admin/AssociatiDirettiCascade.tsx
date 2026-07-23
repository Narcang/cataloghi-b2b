'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  canHaveHierarchyChildren,
  countChildrenProfiles,
  getChildrenProfiles,
  nestedAssociatiLabel,
  ruoloGerarchiaLabel,
  ruoloGerarchiaDotClass,
  ruoloBreakdownDotClass,
  profiloGerarchiaDisplayLabel,
  resolveAgenziaParentForAgent,
  resolveRivenditoreParentForDistributore,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type Props = {
  ownerProfileId: string
  roots: ProfiloGerarchiaRow[]
  candidates: ProfiloGerarchiaRow[]
  aggiungiLabel: string
  profiliGerarchia: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  linksByUtente: Map<string, Set<string>>
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
}

type NodeProps = {
  node: ProfiloGerarchiaRow
  linkOwnerId: string
  profiliGerarchia: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  linksByUtente: Map<string, Set<string>>
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
  depth: number
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
}

function CascadeNode({
  node,
  linkOwnerId,
  profiliGerarchia,
  links,
  linksByUtente,
  readOnly,
  onToggleLink,
  depth,
  expandedIds,
  onToggleExpand,
}: NodeProps) {
  const children = getChildrenProfiles(
    node.id,
    node,
    node.id,
    node.ruolo,
    profiliGerarchia,
    links,
  )
  const childCount = countChildrenProfiles(node.id, node, profiliGerarchia, links)
  const expandable = canHaveHierarchyChildren(node.ruolo)
  const expanded = expandedIds.has(node.id)
  const selected = linksByUtente.get(linkOwnerId) ?? new Set<string>()
  const nestedLabel = nestedAssociatiLabel(node.ruolo)
  const roleDotClass = ruoloGerarchiaDotClass(node.ruolo)

  return (
    <li className="list-none">
      <div
        className={`flex items-start gap-2 rounded-lg border border-black/10 bg-white p-3 ${
          depth > 0 ? 'ml-2' : ''
        }`}
      >
        {expandable ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="mt-0.5 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-black/15 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
            aria-expanded={expanded}
            aria-label={expanded ? 'Comprimi associati' : 'Espandi associati'}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0" aria-hidden />
        )}

        <div className="flex-1 min-w-0">
          <label className="flex items-start gap-2 text-sm text-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={selected.has(node.id)}
              disabled={readOnly}
              onChange={async (e) => {
                const on = e.target.checked
                const ok = await onToggleLink(on, linkOwnerId, node.id)
                if (!ok) e.target.checked = !on
              }}
            />
            <span className="min-w-0">
              <button
                type="button"
                onClick={() => expandable && onToggleExpand(node.id)}
                className={`text-left font-medium text-zinc-900 inline-flex items-center gap-2 ${
                  expandable ? 'hover:text-[#060d41] hover:underline' : 'cursor-default'
                }`}
              >
                {roleDotClass ? (
                  <span
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ${roleDotClass}`}
                    aria-hidden
                  />
                ) : null}
                {profiloGerarchiaDisplayLabel(node)}
              </button>
              <span className="text-zinc-500 text-xs block mt-0.5">
                {ruoloGerarchiaLabel(node.ruolo)}
                {node.area_geografica ? ` · ${node.area_geografica}` : ''}
                {expandable ? ` · ${childCount} associat${childCount === 1 ? 'o' : 'i'}` : ''}
              </span>
            </span>
          </label>

          {expandable && expanded ? (
            <div className="mt-3 border-l-2 border-[#060d41]/20 pl-3">
              {nestedLabel ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                  {nestedLabel}
                </p>
              ) : null}
              {children.length === 0 ? (
                <p className="text-sm text-zinc-500 mb-1">Nessun associato a questo livello.</p>
              ) : (
                <ul className="space-y-2 m-0 p-0">
                  {children.map((child) => (
                    <CascadeNode
                      key={child.id}
                      node={child}
                      linkOwnerId={node.id}
                      profiliGerarchia={profiliGerarchia}
                      links={links}
                      linksByUtente={linksByUtente}
                      readOnly={readOnly}
                      onToggleLink={onToggleLink}
                      depth={depth + 1}
                      expandedIds={expandedIds}
                      onToggleExpand={onToggleExpand}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}

/** Ordine canonico dei ruoli nei tab del selettore di associazione. */
const RUOLO_TAB_ORDER = ['agente', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'agenzia', 'manager']

/** Ruoli "persona" che raggruppiamo per entità di appartenenza (agenzia / rivenditore). */
const RUOLI_CON_GRUPPO = new Set(['agente', 'distributore', 'partner_dipendente'])

const SENZA_GRUPPO_ID = '__senza_gruppo__'

function candidateSortLabel(p: ProfiloGerarchiaRow): string {
  return profiloGerarchiaDisplayLabel(p).toLocaleLowerCase('it')
}

function sortCandidati(list: ProfiloGerarchiaRow[]): ProfiloGerarchiaRow[] {
  return [...list].sort((a, b) =>
    candidateSortLabel(a).localeCompare(candidateSortLabel(b), 'it', { sensitivity: 'base' }),
  )
}

type CandidateCheckboxProps = {
  candidate: ProfiloGerarchiaRow
  checked: boolean
  readOnly: boolean
  onToggle: (on: boolean) => Promise<boolean>
}

function CandidateCheckbox({ candidate, checked, readOnly, onToggle }: CandidateCheckboxProps) {
  const dotClass = ruoloBreakdownDotClass(candidate.ruolo)
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-800 min-w-[200px]">
      <input
        type="checkbox"
        checked={checked}
        disabled={readOnly}
        onChange={async (e) => {
          const on = e.target.checked
          const ok = await onToggle(on)
          if (!ok) e.target.checked = !on
        }}
      />
      {dotClass ? (
        <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      ) : null}
      <span>
        {profiloGerarchiaDisplayLabel(candidate)}{' '}
        <span className="text-zinc-500 text-xs">
          ({ruoloGerarchiaLabel(candidate.ruolo)}
          {candidate.area_geografica ? ` · ${candidate.area_geografica}` : ''})
        </span>
      </span>
    </label>
  )
}

type AssociaCandidatiPickerProps = {
  ownerProfileId: string
  candidates: ProfiloGerarchiaRow[]
  selected: Set<string>
  profiliGerarchia: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
}

function AssociaCandidatiPicker({
  ownerProfileId,
  candidates,
  selected,
  profiliGerarchia,
  links,
  readOnly,
  onToggleLink,
}: AssociaCandidatiPickerProps) {
  const ruoliPresenti = useMemo(() => {
    const set = new Set(candidates.map((c) => c.ruolo))
    return RUOLO_TAB_ORDER.filter((r) => set.has(r))
  }, [candidates])

  const [ruoloAttivo, setRuoloAttivo] = useState<string | null>(ruoliPresenti[0] ?? null)
  const [gruppoAttivo, setGruppoAttivo] = useState<string | null>(null)

  const ruoloCorrente = ruoloAttivo && ruoliPresenti.includes(ruoloAttivo) ? ruoloAttivo : ruoliPresenti[0] ?? null

  const candidatiRuolo = useMemo(
    () => sortCandidati(candidates.filter((c) => c.ruolo === ruoloCorrente)),
    [candidates, ruoloCorrente],
  )

  const usaGruppi = ruoloCorrente ? RUOLI_CON_GRUPPO.has(ruoloCorrente) : false

  const gruppoRuolo = ruoloCorrente === 'agente' ? 'agenzia' : 'rivenditore'

  const gruppi = useMemo(() => {
    if (!usaGruppi || !ruoloCorrente) return []
    const map = new Map<string, { id: string; label: string; items: ProfiloGerarchiaRow[] }>()
    for (const candidate of candidatiRuolo) {
      const parent =
        ruoloCorrente === 'agente'
          ? resolveAgenziaParentForAgent(candidate, profiliGerarchia, links)
          : resolveRivenditoreParentForDistributore(candidate, profiliGerarchia, links)
      const id = parent?.id ?? SENZA_GRUPPO_ID
      const label = parent ? profiloGerarchiaDisplayLabel(parent) : 'Senza associazione'
      if (!map.has(id)) map.set(id, { id, label, items: [] })
      map.get(id)!.items.push(candidate)
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === SENZA_GRUPPO_ID) return 1
      if (b.id === SENZA_GRUPPO_ID) return -1
      return a.label.localeCompare(b.label, 'it', { sensitivity: 'base' })
    })
  }, [usaGruppi, ruoloCorrente, candidatiRuolo, profiliGerarchia, links])

  const gruppoCorrente = useMemo(
    () => gruppi.find((g) => g.id === gruppoAttivo) ?? null,
    [gruppi, gruppoAttivo],
  )

  function selezionaRuolo(ruolo: string) {
    setRuoloAttivo(ruolo)
    setGruppoAttivo(null)
  }

  if (ruoliPresenti.length === 0) {
    return <span className="text-sm text-zinc-500">Nessun utente abilitato con questo ruolo.</span>
  }

  return (
    <div className="space-y-3">
      {/* Selettore ruolo */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra candidati per ruolo">
        {ruoliPresenti.map((ruolo) => {
          const count = candidates.filter((c) => c.ruolo === ruolo).length
          const active = ruolo === ruoloCorrente
          const dotClass = ruoloBreakdownDotClass(ruolo)
          return (
            <button
              key={ruolo}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selezionaRuolo(ruolo)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-[#060d41] bg-[#060d41] text-white'
                  : 'border-black/20 bg-white text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {dotClass ? (
                <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
              ) : null}
              {ruoloGerarchiaLabel(ruolo)}
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {candidatiRuolo.length === 0 ? (
        <span className="text-sm text-zinc-500">Nessun utente abilitato con questo ruolo.</span>
      ) : usaGruppi ? (
        <div className="space-y-3">
          {/* Secondo livello: entità di appartenenza */}
          <div className="flex flex-wrap gap-2">
            {gruppi.map((gruppo) => {
              const active = gruppo.id === gruppoCorrente?.id
              const dotClass = gruppo.id === SENZA_GRUPPO_ID ? 'bg-zinc-400' : ruoloGerarchiaDotClass(gruppoRuolo)
              return (
                <button
                  key={gruppo.id}
                  type="button"
                  onClick={() => setGruppoAttivo(active ? null : gruppo.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-[#060d41] bg-[#060d41]/10 text-[#060d41] font-semibold'
                      : 'border-black/15 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {dotClass ? (
                    <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
                  ) : null}
                  {gruppo.label}
                  <span className="rounded-full bg-zinc-200 px-1.5 text-xs font-semibold text-zinc-700">
                    {gruppo.items.length}
                  </span>
                </button>
              )
            })}
          </div>

          {gruppoCorrente ? (
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto border border-black/10 rounded-lg p-3 bg-white">
              {sortCandidati(gruppoCorrente.items).map((candidate) => (
                <CandidateCheckbox
                  key={candidate.id}
                  candidate={candidate}
                  checked={selected.has(candidate.id)}
                  readOnly={readOnly}
                  onToggle={(on) => onToggleLink(on, ownerProfileId, candidate.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              Seleziona {ruoloCorrente === 'agente' ? 'un’agenzia' : 'un rivenditore'} per vedere i profili da associare.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto border border-black/10 rounded-lg p-3 bg-white">
          {candidatiRuolo.map((candidate) => (
            <CandidateCheckbox
              key={candidate.id}
              candidate={candidate}
              checked={selected.has(candidate.id)}
              readOnly={readOnly}
              onToggle={(on) => onToggleLink(on, ownerProfileId, candidate.id)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-500">Spunta un profilo per collegarlo a questo utente.</p>
    </div>
  )
}

export default function AssociatiDirettiCascade({
  ownerProfileId,
  roots,
  candidates,
  aggiungiLabel,
  profiliGerarchia,
  links,
  linksByUtente,
  readOnly,
  onToggleLink,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const selected = linksByUtente.get(ownerProfileId) ?? new Set<string>()

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {roots.length === 0 ? (
        <p className="text-sm text-zinc-500">Nessun associato diretto ancora collegato.</p>
      ) : (
        <ul className="space-y-2 m-0 p-0">
          {roots.map((root) => (
            <CascadeNode
              key={root.id}
              node={root}
              linkOwnerId={ownerProfileId}
              profiliGerarchia={profiliGerarchia}
              links={links}
              linksByUtente={linksByUtente}
              readOnly={readOnly}
              onToggleLink={onToggleLink}
              depth={0}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
            />
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="border-t border-black/10 pt-4">
          <p className="text-xs font-medium uppercase text-zinc-600 mb-2">{aggiungiLabel}</p>
          <AssociaCandidatiPicker
            ownerProfileId={ownerProfileId}
            candidates={candidates}
            selected={selected}
            profiliGerarchia={profiliGerarchia}
            links={links}
            readOnly={readOnly}
            onToggleLink={onToggleLink}
          />
        </div>
      )}
    </div>
  )
}
