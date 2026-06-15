'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  canHaveHierarchyChildren,
  countChildrenProfiles,
  getChildrenProfiles,
  nestedAssociatiLabel,
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
                className={`text-left font-medium text-zinc-900 ${
                  expandable ? 'hover:text-[#060d41] hover:underline' : 'cursor-default'
                }`}
              >
                {node.nome_completo || node.email || 'Utente'}
              </button>
              <span className="text-zinc-500 text-xs block mt-0.5">
                {node.ruolo === 'distributore' ? 'partner' : node.ruolo}
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

  const rootIds = useMemo(() => new Set(roots.map((r) => r.id)), [roots])

  const disponibili = useMemo(
    () => candidates.filter((c) => !rootIds.has(c.id) && !selected.has(c.id)),
    [candidates, rootIds, selected],
  )

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
          {candidates.length === 0 ? (
            <span className="text-sm text-zinc-500">
              Nessun utente abilitato con questo ruolo.
            </span>
          ) : (
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
              {candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex items-center gap-2 text-sm text-zinc-800 min-w-[200px]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(candidate.id)}
                    disabled={readOnly}
                    onChange={async (e) => {
                      const on = e.target.checked
                      const ok = await onToggleLink(on, ownerProfileId, candidate.id)
                      if (!ok) e.target.checked = !on
                    }}
                  />
                  <span>
                    {candidate.nome_completo || candidate.email}{' '}
                    <span className="text-zinc-500 text-xs">
                      ({candidate.ruolo === 'distributore' ? 'partner' : candidate.ruolo}
                      {candidate.area_geografica ? ` · ${candidate.area_geografica}` : ''})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {disponibili.length > 0 ? (
            <p className="text-xs text-zinc-500 mt-2">
              Spunta un profilo per collegarlo a questo utente.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
