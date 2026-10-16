'use client'

import { useMemo, useState } from 'react'
import {
  associatiUiRolesFor,
  ruoloGerarchiaLabel,
  ruoloBreakdownDotClass,
  profiloGerarchiaDisplayLabel,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type Props = {
  ownerProfileId: string
  ownerRuolo: string
  roots: ProfiloGerarchiaRow[]
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
}

/** Ordine canonico dei ruoli nei tab dell'elenco. */
const RUOLO_TAB_ORDER = ['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato', 'manager']

function sortAssociati(list: ProfiloGerarchiaRow[]): ProfiloGerarchiaRow[] {
  return [...list].sort((a, b) =>
    profiloGerarchiaDisplayLabel(a).localeCompare(profiloGerarchiaDisplayLabel(b), 'it', { sensitivity: 'base' }),
  )
}

export default function AssociatiDirettiCascade({
  ownerProfileId,
  ownerRuolo,
  roots,
  readOnly,
  onToggleLink,
}: Props) {
  const ruoliTab = useMemo(
    () => RUOLO_TAB_ORDER.filter((ruolo) => associatiUiRolesFor(ownerRuolo).includes(ruolo)),
    [ownerRuolo],
  )

  const [ruoloAttivo, setRuoloAttivo] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const ruoloCorrente =
    ruoloAttivo && ruoliTab.includes(ruoloAttivo)
      ? ruoloAttivo
      : ruoliTab.find((ruolo) => roots.some((root) => root.ruolo === ruolo)) ?? ruoliTab[0] ?? null

  const associatiRuolo = useMemo(
    () => sortAssociati(roots.filter((root) => root.ruolo === ruoloCorrente)),
    [roots, ruoloCorrente],
  )

  if (ruoliTab.length === 0) {
    return <span className="text-sm text-zinc-500">Nessun associato diretto ancora collegato.</span>
  }

  async function dissocia(id: string) {
    if (readOnly || busyId) return
    setBusyId(id)
    try {
      await onToggleLink(false, ownerProfileId, id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra associati diretti per ruolo">
        {ruoliTab.map((ruolo) => {
          const count = roots.filter((root) => root.ruolo === ruolo).length
          const active = ruolo === ruoloCorrente
          const dotClass = ruoloBreakdownDotClass(ruolo)
          return (
            <button
              key={ruolo}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRuoloAttivo(ruolo)}
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

      {associatiRuolo.length === 0 ? (
        <span className="text-sm text-zinc-500">Nessun associato diretto con questo ruolo.</span>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {associatiRuolo.map((candidate) => {
            const dotClass = ruoloBreakdownDotClass(candidate.ruolo)
            const busy = busyId === candidate.id
            return (
              <li
                key={candidate.id}
                className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-white pl-3 pr-1 py-1 text-sm text-zinc-800"
              >
                {dotClass ? (
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
                ) : null}
                <span>
                  {profiloGerarchiaDisplayLabel(candidate)}
                  <span className="ml-1 text-xs text-zinc-500">
                    ({ruoloGerarchiaLabel(candidate.ruolo)}
                    {candidate.area_geografica ? ` · ${candidate.area_geografica}` : ''})
                  </span>
                </span>
                {!readOnly ? (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label="Dissocia"
                    title="Dissocia"
                    onClick={() => void dissocia(candidate.id)}
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-zinc-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    ×
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
