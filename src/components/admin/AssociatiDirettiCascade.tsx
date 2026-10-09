'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  agenteAssegnatoASedeStudio,
  agenteCheSegueRivenditore,
  associatiUiRolesFor,
  ruoloGerarchiaLabel,
  ruoloBreakdownDotClass,
  profiloGerarchiaDisplayLabel,
  resolveAgenziaParentForAgent,
  resolveAgenziaParentForRivenditore,
  resolveRivenditoreParentForDistributore,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type Props = {
  ownerProfileId: string
  ownerRuolo: string
  roots: ProfiloGerarchiaRow[]
  candidates: ProfiloGerarchiaRow[]
  aggiungiLabel: string
  profiliGerarchia: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  linksByUtente: Map<string, Set<string>>
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
}

/** Ordine canonico dei ruoli nei tab del selettore di associazione. */
const RUOLO_TAB_ORDER = ['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato', 'manager']

type OperatoreLink = { utente_id: string; operatore_id: string }

function resolveSedeStudioParent(
  studioAssociato: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  const byId = new Map(profili.map((p) => [p.id, p]))
  const inviter = byId.get(studioAssociato.invitato_da ?? '')
  if (inviter?.ruolo === 'studio') return inviter
  for (const link of links) {
    const otherId =
      link.utente_id === studioAssociato.id
        ? link.operatore_id
        : link.operatore_id === studioAssociato.id
          ? link.utente_id
          : null
    const parent = otherId ? byId.get(otherId) : null
    if (parent?.ruolo === 'studio') return parent
  }
  return null
}

function parentEntitaCandidato(
  candidate: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): ProfiloGerarchiaRow | null {
  switch (candidate.ruolo) {
    case 'agente':
    case 'back_office':
      return resolveAgenziaParentForAgent(candidate, profili, links)
    case 'distributore':
    case 'partner_dipendente':
      return resolveRivenditoreParentForDistributore(candidate, profili, links)
    case 'studio_associato':
      return resolveSedeStudioParent(candidate, profili, links)
    case 'rivenditore':
      return (
        agenteCheSegueRivenditore(candidate, profili, links) ??
        resolveAgenziaParentForRivenditore(candidate, profili, links)
      )
    case 'studio': {
      const agente = agenteAssegnatoASedeStudio(candidate, profili, links)
      if (agente) return agente
      const byId = new Map(profili.map((p) => [p.id, p]))
      const inviter = byId.get(candidate.invitato_da ?? '')
      return inviter?.ruolo === 'agenzia' ? inviter : null
    }
    default:
      return null
  }
}

function casaIdsPerOwner(
  ownerProfileId: string,
  ownerRuolo: string,
  selected: Set<string>,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): Set<string> {
  const ids = new Set<string>([ownerProfileId])
  const owner = profili.find((p) => p.id === ownerProfileId)
  if (!owner) return ids

  if (ownerRuolo === 'agente' || ownerRuolo === 'back_office') {
    const agenzia = resolveAgenziaParentForAgent(owner, profili, links)
    if (agenzia) ids.add(agenzia.id)
  }
  if (ownerRuolo === 'distributore' || ownerRuolo === 'partner_dipendente') {
    const rivenditore = resolveRivenditoreParentForDistributore(owner, profili, links)
    if (rivenditore) {
      ids.add(rivenditore.id)
      const agenzia = resolveAgenziaParentForRivenditore(rivenditore, profili, links)
      if (agenzia) ids.add(agenzia.id)
    }
  }
  if (ownerRuolo === 'rivenditore') {
    const agenzia = resolveAgenziaParentForRivenditore(owner, profili, links)
    if (agenzia) ids.add(agenzia.id)
  }
  if (ownerRuolo === 'manager') {
    for (const profilo of profili) {
      if (profilo.ruolo === 'agenzia' && selected.has(profilo.id)) ids.add(profilo.id)
    }
  }

  for (const id of selected) {
    const profilo = profili.find((p) => p.id === id)
    if (profilo && (profilo.ruolo === 'agenzia' || profilo.ruolo === 'rivenditore' || profilo.ruolo === 'studio')) {
      ids.add(profilo.id)
    }
  }
  return ids
}

function candidatoNellaCasa(
  candidate: ProfiloGerarchiaRow,
  casaIds: Set<string>,
  profili: ProfiloGerarchiaRow[],
  links: OperatoreLink[],
): boolean {
  if (casaIds.has(candidate.id)) return true
  const parent = parentEntitaCandidato(candidate, profili, links)
  if (parent && casaIds.has(parent.id)) return true
  if (candidate.ruolo === 'rivenditore') {
    const agenzia = resolveAgenziaParentForRivenditore(candidate, profili, links)
    if (agenzia && casaIds.has(agenzia.id)) return true
  }
  if (candidate.ruolo === 'studio') {
    const agente = agenteAssegnatoASedeStudio(candidate, profili, links)
    if (!agente) return false
    if (casaIds.has(agente.id)) return true
    const agenzia = resolveAgenziaParentForAgent(agente, profili, links)
    return Boolean(agenzia && casaIds.has(agenzia.id))
  }
  return false
}

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
  const [localChecked, setLocalChecked] = useState(checked)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  useEffect(() => {
    setLocalChecked(checked)
  }, [checked])

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-800 min-w-[200px]">
      <input
        type="checkbox"
        checked={localChecked}
        disabled={readOnly || saving}
        onChange={async (e) => {
          if (savingRef.current) return
          const on = e.target.checked
          savingRef.current = true
          setSaving(true)
          setLocalChecked(on)
          try {
            const ok = await onToggle(on)
            if (!ok) setLocalChecked(!on)
          } finally {
            savingRef.current = false
            setSaving(false)
          }
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

type AssociatiAttualiPickerProps = {
  ownerProfileId: string
  ownerRuolo: string
  roots: ProfiloGerarchiaRow[]
  selected: Set<string>
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
}

function AssociatiAttualiPicker({
  ownerProfileId,
  ownerRuolo,
  roots,
  selected,
  readOnly,
  onToggleLink,
}: AssociatiAttualiPickerProps) {
  const ruoliTab = useMemo(
    () => RUOLO_TAB_ORDER.filter((ruolo) => associatiUiRolesFor(ownerRuolo).includes(ruolo)),
    [ownerRuolo],
  )

  const [ruoloAttivo, setRuoloAttivo] = useState<string | null>(null)
  const ruoloCorrente =
    ruoloAttivo && ruoliTab.includes(ruoloAttivo)
      ? ruoloAttivo
      : ruoliTab.find((ruolo) => roots.some((root) => root.ruolo === ruolo)) ?? ruoliTab[0] ?? null

  const associatiRuolo = useMemo(
    () => sortCandidati(roots.filter((root) => root.ruolo === ruoloCorrente)),
    [roots, ruoloCorrente],
  )

  if (ruoliTab.length === 0) {
    return <span className="text-sm text-zinc-500">Nessun associato diretto ancora collegato.</span>
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
        <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto border border-black/10 rounded-lg p-3 bg-white">
          {associatiRuolo.map((candidate) => (
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
    </div>
  )
}

type AssociaCandidatiPickerProps = {
  ownerProfileId: string
  ownerRuolo: string
  roots: ProfiloGerarchiaRow[]
  candidates: ProfiloGerarchiaRow[]
  selected: Set<string>
  profiliGerarchia: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  readOnly: boolean
  onToggleLink: (add: boolean, utenteId: string, operatoreId: string) => Promise<boolean>
}

function AssociaCandidatiPicker({
  ownerProfileId,
  ownerRuolo,
  roots,
  candidates,
  selected,
  profiliGerarchia,
  links,
  readOnly,
  onToggleLink,
}: AssociaCandidatiPickerProps) {
  const ruoliPresenti = useMemo(
    () => RUOLO_TAB_ORDER.filter((r) => associatiUiRolesFor(ownerRuolo).includes(r)),
    [ownerRuolo],
  )

  const [ruoloAttivo, setRuoloAttivo] = useState<string | null>(ruoliPresenti[0] ?? null)
  const [filtroCasa, setFiltroCasa] = useState<'associati' | 'non_associati'>('associati')
  const [sceltaId, setSceltaId] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const ruoloCorrente = ruoloAttivo && ruoliPresenti.includes(ruoloAttivo) ? ruoloAttivo : ruoliPresenti[0] ?? null

  const agenzieCollegateAManager = useMemo(() => {
    const managerIds = new Set(
      profiliGerarchia.filter((p) => p.ruolo === 'manager').map((p) => p.id),
    )
    const agenziaIds = new Set(
      profiliGerarchia.filter((p) => p.ruolo === 'agenzia').map((p) => p.id),
    )
    const result = new Set<string>()
    for (const link of links) {
      if (managerIds.has(link.utente_id) && agenziaIds.has(link.operatore_id)) {
        result.add(link.operatore_id)
      }
      if (managerIds.has(link.operatore_id) && agenziaIds.has(link.utente_id)) {
        result.add(link.utente_id)
      }
    }
    return result
  }, [profiliGerarchia, links])

  const casaIds = useMemo(
    () => casaIdsPerOwner(ownerProfileId, ownerRuolo, selected, profiliGerarchia, links),
    [ownerProfileId, ownerRuolo, selected, profiliGerarchia, links],
  )

  const candidatiRuolo = useMemo(
    () =>
      sortCandidati(
        candidates.filter(
          (c) =>
            c.ruolo === ruoloCorrente &&
            !selected.has(c.id) &&
            (c.ruolo !== 'agenzia' || !agenzieCollegateAManager.has(c.id)),
        ),
      ),
    [candidates, ruoloCorrente, selected, agenzieCollegateAManager],
  )

  const associatiCasa = useMemo(
    () =>
      candidatiRuolo.filter((c) => candidatoNellaCasa(c, casaIds, profiliGerarchia, links)),
    [candidatiRuolo, casaIds, profiliGerarchia, links],
  )

  const nonAssociati = useMemo(
    () => candidatiRuolo.filter((c) => !parentEntitaCandidato(c, profiliGerarchia, links)),
    [candidatiRuolo, profiliGerarchia, links],
  )

  const elencoTendina = filtroCasa === 'associati' ? associatiCasa : nonAssociati

  function selezionaRuolo(ruolo: string) {
    setRuoloAttivo(ruolo)
    setSceltaId('')
  }

  async function associaDaTendina(id: string) {
    if (!id || savingRef.current || readOnly) return
    savingRef.current = true
    setSaving(true)
    try {
      const ok = await onToggleLink(true, ownerProfileId, id)
      if (ok) setSceltaId('')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  if (ruoliPresenti.length === 0) {
    return <span className="text-sm text-zinc-500">Nessun utente abilitato con questo ruolo.</span>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra candidati per ruolo">
        {ruoliPresenti.map((ruolo) => {
          const count = roots.filter((root) => root.ruolo === ruolo).length
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setFiltroCasa('associati')
            setSceltaId('')
          }}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            filtroCasa === 'associati'
              ? 'border-[#060d41] bg-[#060d41]/10 text-[#060d41] font-semibold'
              : 'border-black/15 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          Associati
          <span className="rounded-full bg-zinc-200 px-1.5 text-xs font-semibold text-black">
            {associatiCasa.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setFiltroCasa('non_associati')
            setSceltaId('')
          }}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            filtroCasa === 'non_associati'
              ? 'border-[#060d41] bg-[#060d41]/10 text-[#060d41] font-semibold'
              : 'border-black/15 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          Non associati
          <span className="rounded-full bg-zinc-200 px-1.5 text-xs font-semibold text-black">
            {nonAssociati.length}
          </span>
        </button>
      </div>

      <select
        value={sceltaId}
        disabled={readOnly || saving || elencoTendina.length === 0}
        onChange={(e) => {
          const id = e.target.value
          setSceltaId(id)
          void associaDaTendina(id)
        }}
        className="h-9 rounded-md border border-black/20 bg-white px-3 text-sm text-zinc-900 min-w-[260px] max-w-full"
        aria-label={filtroCasa === 'associati' ? 'Associati' : 'Non associati'}
      >
        <option value="">
          {elencoTendina.length === 0
            ? filtroCasa === 'associati'
              ? 'Nessun associato della casa'
              : 'Nessun profilo senza associazione'
            : 'Seleziona un profilo'}
        </option>
        {elencoTendina.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {profiloGerarchiaDisplayLabel(candidate)}
            {candidate.area_geografica ? ` · ${candidate.area_geografica}` : ''}
          </option>
        ))}
      </select>

      <p className="text-xs text-zinc-500">
        Scegli il ruolo, poi Associati o Non associati, e seleziona un profilo da collegare.
      </p>
    </div>
  )
}

export default function AssociatiDirettiCascade({
  ownerProfileId,
  ownerRuolo,
  roots,
  candidates,
  aggiungiLabel,
  profiliGerarchia,
  links,
  linksByUtente,
  readOnly,
  onToggleLink,
}: Props) {
  const selected = linksByUtente.get(ownerProfileId) ?? new Set<string>()

  return (
    <div className="space-y-4">
      <AssociatiAttualiPicker
        ownerProfileId={ownerProfileId}
        ownerRuolo={ownerRuolo}
        roots={roots}
        selected={selected}
        readOnly={readOnly}
        onToggleLink={onToggleLink}
      />

      {!readOnly && (
        <div className="border-t border-black/10 pt-4">
          <p className="text-xs font-medium uppercase text-zinc-600 mb-2">{aggiungiLabel}</p>
          <AssociaCandidatiPicker
            ownerProfileId={ownerProfileId}
            ownerRuolo={ownerRuolo}
            roots={roots}
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
