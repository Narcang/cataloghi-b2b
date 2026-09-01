'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Users, UserCheck } from 'lucide-react'
import AssociatiDirettiCascade from '@/components/admin/AssociatiDirettiCascade'
import CreaAssociatoManuale from '@/components/admin/CreaAssociatoManuale'
import CatalogoPermessiPanel, { type CatalogoDisponibile } from '@/components/admin/CatalogoPermessiPanel'
import RivenditoreProfiloCampi from '@/components/admin/RivenditoreProfiloCampi'
import AgenziaProfiloCampi from '@/components/admin/AgenziaProfiloCampi'
import { readRivenditoreCampiFromFormData } from '@/lib/rivenditoreProfiloOptions'
import { readAgenziaCampiFromFormData } from '@/lib/agenziaProfiloOptions'
import {
  buildOpzioniSpecializzazioneMap,
  type OpzioniSpecializzazioneMap,
} from '@/lib/profiloSpecializzazioneOpzioni'
import {
  associatiAggiungiSectionLabel,
  associatiDirettiSectionLabel,
  getCandidateAssociatiProfiles,
  getChildrenProfiles,
  isRivenditoreManagedByAgenzia,
  isRivenditoreManagedByAgente,
  profiloToGerarchiaRow,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

import { useAppLocale } from '@/lib/useAppLocale'
import { tAdmin, tRuolo, tRivenditoriCount } from '@/lib/i18nAdmin'

export type ProfiloGestioneRow = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  societa: string | null
  area_geografica: string | null
  ruolo: string
  registrazione_approvata: boolean | null
  creato_il: string | null
  espositore_1?: string | null
  espositore_2?: string | null
  seguito_da?: string | null
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
  agenzia_catalogo_3_qta?: number | null
  agenzia_catalogo_4_qta?: number | null
  agenzia_catalogo_3_data?: string | null
  agenzia_catalogo_4_data?: string | null
}

export type OperatoreAssociazione = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  ruolo: string
  area_geografica: string | null
}

const RUOLI_OPTIONS = ['admin', 'manager', 'agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'free'] as const

/** Ruoli per cui ha senso personalizzare la dashboard portale per singolo utente. */
function puoPersonalizzareCataloghi(ruolo: string): boolean {
  return !['admin', 'free', 'manager'].includes(ruolo)
}

type RuoloOption = (typeof RUOLI_OPTIONS)[number]

type RuoloTabId = 'admin' | 'manager' | 'agenzia' | 'agente' | 'back_office' | 'rivenditore' | 'distributore' | 'studio' | 'partner_dipendente'

const RUOLI_TAB: { id: RuoloTabId }[] = [
  { id: 'admin' },
  { id: 'manager' },
  { id: 'agenzia' },
  { id: 'agente' },
  { id: 'back_office' },
  { id: 'rivenditore' },
  { id: 'distributore' },
  { id: 'partner_dipendente' },
  { id: 'studio' },
]

function profiloSortKey(p: ProfiloGestioneRow): string {
  return (p.societa || p.nome_completo || p.email || p.id).trim().toLocaleLowerCase('it')
}

function sortProfiliAlfabetico(list: ProfiloGestioneRow[]): ProfiloGestioneRow[] {
  return [...list].sort((a, b) =>
    profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' }),
  )
}

type Props = {
  currentUserId: string
  profiliPendenti: ProfiloGestioneRow[]
  profiliLista: ProfiloGestioneRow[]
  profiliGerarchia: ProfiloGerarchiaRow[]
  /** Tutti gli utenti approvati (senza filtro area): elenco per associare il ruolo inferiore. */
  profiliAssociazione: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  /** Tutti i cataloghi attivi (con ruoli_visibili) per la gestione permessi per-utente. */
  allCataloghi: CatalogoDisponibile[]
  /** Quando true (ruolo manager) il pannello è in sola lettura: nessun edit/delete/approvazione. */
  readOnly?: boolean
  /** Admin e manager possono aggiornare strumenti/cataloghi (agenzia) ed espositori/box (rivenditore). */
  canEditSpecializzazione?: boolean
  /** Admin e manager possono gestire i cataloghi visibili anche se readOnly è true. */
  canManageCataloghi?: boolean
  /** Admin e manager possono inserire manualmente agenti (agenzie) e venditori (rivenditori). */
  canCreateAssociati?: boolean
  /** Vista agenzia/agente: elenco rivenditori associati, senza approvazioni né tab multi-ruolo. */
  agenziaRivenditoriMode?: boolean
  /** L'agenzia può aggiornare espositori e box dei rivenditori collegati. */
  canEditRivenditoreAsAgenzia?: boolean
  /** L'agente può aggiornare espositori e box dei rivenditori collegati. */
  canEditRivenditoreAsAgente?: boolean
  /** Apre di default i profili nell'elenco (details espansi). */
  apriProfiliDiDefault?: boolean
  /** Admin: aggiunge/rimuove voci nei menu a tendina specializzazione. */
  canManageSpecializzazioneOpzioni?: boolean
}

const DEFAULT_SPECIALIZZAZIONE_OPZIONI = buildOpzioniSpecializzazioneMap([])

export default function AdminProfiliPanel({
  currentUserId,
  profiliPendenti,
  profiliLista,
  profiliGerarchia,
  profiliAssociazione,
  links,
  allCataloghi,
  readOnly = false,
  canEditSpecializzazione = false,
  canManageCataloghi = false,
  canCreateAssociati = false,
  agenziaRivenditoriMode = false,
  canEditRivenditoreAsAgenzia = false,
  canEditRivenditoreAsAgente = false,
  apriProfiliDiDefault = false,
  canManageSpecializzazioneOpzioni = false,
}: Props) {
  const router = useRouter()
  const locale = useAppLocale()
  const copy = tAdmin(locale)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [specializzazioneOpzioni, setSpecializzazioneOpzioni] =
    useState<OpzioniSpecializzazioneMap>(DEFAULT_SPECIALIZZAZIONE_OPZIONI)
  const [ruoloAttivo, setRuoloAttivo] = useState<RuoloTabId>(
    agenziaRivenditoriMode ? 'rivenditore' : 'admin',
  )

  const specializzazioneOpzioniFormProps = {
    opzioni: specializzazioneOpzioni,
    canManageOpzioni: canManageSpecializzazioneOpzioni,
    onOpzioniChange: canManageSpecializzazioneOpzioni
      ? setSpecializzazioneOpzioni
      : undefined,
  }

  const ruoliTab = agenziaRivenditoriMode
    ? RUOLI_TAB.filter((tab) => tab.id === 'rivenditore')
    : RUOLI_TAB

  const profiliPendentiOrdinati = useMemo(() => sortProfiliAlfabetico(profiliPendenti), [profiliPendenti])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/profili/specializzazione-opzioni', {
          credentials: 'same-origin',
        })
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; opzioni?: OpzioniSpecializzazioneMap }
          | null
        if (!cancelled && res.ok && data?.ok && data.opzioni) {
          setSpecializzazioneOpzioni(data.opzioni)
        }
      } catch {
        /* fallback: opzioni predefinite */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const profiliListaGestione = useMemo(
    () => profiliLista.filter((p) => p.ruolo !== 'free'),
    [profiliLista],
  )

  const profiliPerRuolo = useMemo(() => {
    const map = new Map<RuoloTabId, ProfiloGestioneRow[]>()
    for (const tab of RUOLI_TAB) map.set(tab.id, [])
    for (const profilo of sortProfiliAlfabetico(profiliListaGestione)) {
      const ruolo = profilo.ruolo as RuoloTabId
      if (!map.has(ruolo)) continue
      map.get(ruolo)!.push(profilo)
    }
    return map
  }, [profiliListaGestione])

  const profiliRuoloAttivo = profiliPerRuolo.get(ruoloAttivo) ?? []

  useEffect(() => {
    const firstConUtenti = ruoliTab.find((tab) => (profiliPerRuolo.get(tab.id)?.length ?? 0) > 0)
    if ((profiliPerRuolo.get(ruoloAttivo)?.length ?? 0) > 0) return
    if (firstConUtenti) setRuoloAttivo(firstConUtenti.id)
  }, [profiliPerRuolo, ruoloAttivo, ruoliTab])

  const linksByUtente = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const row of links) {
      if (!m.has(row.utente_id)) m.set(row.utente_id, new Set())
      m.get(row.utente_id)!.add(row.operatore_id)
    }
    return m
  }, [links])

  const invitatoDaById = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const row of profiliGerarchia) m.set(row.id, row.invitato_da)
    return m
  }, [profiliGerarchia])

  function getDirectAssociati(profilo: ProfiloGestioneRow): ProfiloGerarchiaRow[] {
    const row = profiloToGerarchiaRow(profilo, invitatoDaById.get(profilo.id) ?? null)
    return getChildrenProfiles(profilo.id, row, profilo.id, profilo.ruolo, profiliGerarchia, links)
  }

  async function postUpdate(body: Record<string, unknown>) {
    setError(null)
    setMessage(null)
    const res = await fetch('/api/admin/profili/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
    if (!res.ok || !data?.ok) {
      setError(data?.message ?? 'Aggiornamento non riuscito')
      return false
    }
    setMessage(data.message ?? 'Salvato')
    router.refresh()
    return true
  }

  async function postDelete(profiloId: string) {
    setError(null)
    setMessage(null)
    if (
      !window.confirm(copy.eliminaConfirm)
    ) {
      return false
    }
    setDeletingId(profiloId)
    try {
      const res = await fetch('/api/admin/profili/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ profilo_id: profiloId }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Eliminazione non riuscita')
        return false
      }
      setMessage(data.message ?? 'Utente eliminato')
      router.refresh()
      return true
    } finally {
      setDeletingId(null)
    }
  }

  async function postLink(action: 'add' | 'remove', utente_id: string, operatore_id: string) {
    setError(null)
    setMessage(null)
    const res = await fetch('/api/admin/profili/operatore-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action, utente_id, operatore_id }),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
    if (!res.ok || !data?.ok) {
      setError(data?.message ?? 'Operazione non riuscita')
      return false
    }
    router.refresh()
    return true
  }

  function readForm(fd: FormData, profiloId: string) {
    const nome_completo = String(fd.get('nome_completo') ?? '').trim() || null
    const email = String(fd.get('email') ?? '').trim() || null
    const telefono = String(fd.get('telefono') ?? '').trim() || null
    const societa = String(fd.get('societa') ?? '').trim() || null
    const area_geografica = String(fd.get('area_geografica') ?? '').trim() || null
    const ruolo = String(fd.get('ruolo') ?? '').trim()
    const rawApprovazione = fd.get('registrazione_approvata')
    const registrazione_approvata =
      rawApprovazione === 'on' || rawApprovazione === 'true' || rawApprovazione === '1'
    const body: Record<string, unknown> = {
      profilo_id: profiloId,
      nome_completo,
      email,
      telefono,
      societa,
      area_geografica,
      ruolo,
      registrazione_approvata,
    }
    if (ruolo === 'rivenditore') {
      Object.assign(body, readRivenditoreCampiFromFormData(fd))
    }
    if (ruolo === 'agenzia') {
      Object.assign(body, readAgenziaCampiFromFormData(fd))
    }
    return body
  }

  function readFormSpecializzazione(fd: FormData, profiloId: string, ruolo: string) {
    const body: Record<string, unknown> = { profilo_id: profiloId }
    if (ruolo === 'rivenditore') {
      Object.assign(body, readRivenditoreCampiFromFormData(fd))
      delete body.seguito_da
    }
    if (ruolo === 'agenzia') {
      Object.assign(body, readAgenziaCampiFromFormData(fd))
    }
    return body
  }

  return (
    <section id="gestione-utenti" className="space-y-10 border border-black rounded-2xl bg-white p-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-black pb-4">
        <Users className="text-[#060d41]" size={28} aria-hidden />
        <div>
          <h2 className="text-2xl font-medium text-zinc-900">{copy.gestioneUtentiPanel}</h2>
          <p className="text-sm text-zinc-600 mt-1">
            {agenziaRivenditoriMode
              ? copy.gestioneUtentiPanelHelpAgenzia
              : copy.gestioneUtentiPanelHelp}
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      {!agenziaRivenditoriMode && profiliPendentiOrdinati.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <UserCheck size={20} aria-hidden />
            {copy.registrazioniAttesa} ({profiliPendentiOrdinati.length})
          </h3>
          <ul className="space-y-4 list-none p-0 m-0">
            {profiliPendentiOrdinati.map((p) => (
              <li key={p.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm text-zinc-700 mb-3">
                  <strong>{p.nome_completo || copy.senzaNome}</strong> · {p.email} · {p.societa || '—'} · Tel.{' '}
                  {p.telefono || '—'} · {copy.campoRuolo}: {tRuolo(locale, p.ruolo)} · {copy.campoArea}: {p.area_geografica || '—'}
                </p>
                {!readOnly && (
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget)
                      await postUpdate(readForm(fd, p.id))
                    }}
                  >
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoNome}
                      <input
                        name="nome_completo"
                        type="text"
                        defaultValue={p.nome_completo ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoEmail}
                      <input
                        name="email"
                        type="email"
                        defaultValue={p.email ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoTelefono}
                      <input
                        name="telefono"
                        type="tel"
                        defaultValue={p.telefono ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoSocieta}
                      <input
                        name="societa"
                        type="text"
                        defaultValue={p.societa ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoArea}
                      <input
                        name="area_geografica"
                        type="text"
                        placeholder={copy.placeholderArea}
                        defaultValue={p.area_geografica ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoRuolo}
                      <select
                        name="ruolo"
                        defaultValue={p.ruolo}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      >
                        {RUOLI_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {tRuolo(locale, r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {p.ruolo === 'rivenditore' ? (
                      <label className="block text-xs font-medium uppercase text-zinc-600">
                        {copy.seguitoDa}
                        <input
                          name="seguito_da"
                          type="text"
                          placeholder={copy.placeholderSeguito}
                          defaultValue={p.seguito_da ?? ''}
                          className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                        />
                      </label>
                    ) : null}
                    <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-800">
                      <input type="checkbox" name="registrazione_approvata" value="on" defaultChecked={false} className="rounded border-black" />
                      {copy.approvaReg}
                    </label>
                    {p.ruolo === 'rivenditore' ? (
                      <RivenditoreProfiloCampi
                        profilo={{
                          espositore_1: p.espositore_1 ?? null,
                          espositore_2: p.espositore_2 ?? null,
                          box_show_room_1: p.box_show_room_1 ?? null,
                          box_show_room_2: p.box_show_room_2 ?? null,
                          box_show_room_3: p.box_show_room_3 ?? null,
                          box_show_room_4: p.box_show_room_4 ?? null,
                          espositore_1_qta: p.espositore_1_qta ?? null,
                          espositore_2_qta: p.espositore_2_qta ?? null,
                          box_show_room_1_qta: p.box_show_room_1_qta ?? null,
                          box_show_room_2_qta: p.box_show_room_2_qta ?? null,
                          box_show_room_3_qta: p.box_show_room_3_qta ?? null,
                          box_show_room_4_qta: p.box_show_room_4_qta ?? null,
                          espositore_1_data: p.espositore_1_data ?? null,
                          espositore_2_data: p.espositore_2_data ?? null,
                          box_show_room_1_data: p.box_show_room_1_data ?? null,
                          box_show_room_2_data: p.box_show_room_2_data ?? null,
                          box_show_room_3_data: p.box_show_room_3_data ?? null,
                          box_show_room_4_data: p.box_show_room_4_data ?? null,
                        }}
                        {...specializzazioneOpzioniFormProps}
                        inputClassName="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    ) : null}
                    {p.ruolo === 'agenzia' ? (
                      <AgenziaProfiloCampi
                        profilo={{
                          agenzia_campione_1: p.agenzia_campione_1 ?? null,
                          agenzia_campione_2: p.agenzia_campione_2 ?? null,
                          agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
                          agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
                          agenzia_catalogo_3: p.agenzia_catalogo_3 ?? null,
                          agenzia_catalogo_4: p.agenzia_catalogo_4 ?? null,
                          agenzia_campione_1_qta: p.agenzia_campione_1_qta ?? null,
                          agenzia_campione_2_qta: p.agenzia_campione_2_qta ?? null,
                          agenzia_catalogo_1_qta: p.agenzia_catalogo_1_qta ?? null,
                          agenzia_catalogo_2_qta: p.agenzia_catalogo_2_qta ?? null,
                          agenzia_catalogo_3_qta: p.agenzia_catalogo_3_qta ?? null,
                          agenzia_catalogo_4_qta: p.agenzia_catalogo_4_qta ?? null,
                          agenzia_campione_1_data: p.agenzia_campione_1_data ?? null,
                          agenzia_campione_2_data: p.agenzia_campione_2_data ?? null,
                          agenzia_catalogo_1_data: p.agenzia_catalogo_1_data ?? null,
                          agenzia_catalogo_2_data: p.agenzia_catalogo_2_data ?? null,
                          agenzia_catalogo_3_data: p.agenzia_catalogo_3_data ?? null,
                          agenzia_catalogo_4_data: p.agenzia_catalogo_4_data ?? null,
                        }}
                        {...specializzazioneOpzioniFormProps}
                        inputClassName="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    ) : null}
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={deletingId === p.id}
                        className="h-10 rounded-lg bg-[#060d41] text-white px-4 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                      >
                        {copy.salvaConferma}
                      </button>
                      {p.ruolo !== 'admin' && p.id !== currentUserId ? (
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => void postDelete(p.id)}
                          className="h-10 rounded-lg border border-red-600 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === p.id ? copy.eliminazione : copy.eliminaUtente}
                        </button>
                      ) : null}
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : !agenziaRivenditoriMode ? (
        <p className="text-sm text-zinc-500">{copy.nessunaAttesa}</p>
      ) : null}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900">
          {agenziaRivenditoriMode ? copy.rivenditoriAssociati : copy.utentiAssociati}
        </h3>
        <p className="text-sm text-zinc-600">
          {agenziaRivenditoriMode
            ? copy.listaRivenditoriHelp
            : copy.listaUtentiHelp}
        </p>

        {!agenziaRivenditoriMode ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.filtraPerRuolo}>
          {ruoliTab.map((tab) => {
            const count = profiliPerRuolo.get(tab.id)?.length ?? 0
            const active = ruoloAttivo === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRuoloAttivo(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-[#060d41] bg-[#060d41] text-white'
                    : 'border-black bg-white text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {tRuolo(locale, tab.id)}
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
        ) : (
          <p className="text-sm font-medium text-zinc-700">
            {tRivenditoriCount(locale, profiliRuoloAttivo.length)}
          </p>
        )}

        <ul className="space-y-3 list-none p-0 m-0" role="tabpanel" aria-label={`Utenti ${ruoloAttivo}`}>
          {profiliRuoloAttivo.length === 0 ? (
            <li className="rounded-xl border border-dashed border-black/30 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
              {agenziaRivenditoriMode
                ? copy.nessunRivenditoreAgenzia
                : copy.nessunUtenteRuoloFiltro}
            </li>
          ) : null}
          {profiliRuoloAttivo.map((p) => {
            const profiloGerarchia = profiloToGerarchiaRow(p, invitatoDaById.get(p.id) ?? null)
            const profiloReadOnly = readOnly || p.id === currentUserId || p.ruolo === 'admin'
            const directAssociati = getDirectAssociati(p)
            const associatiLabel = associatiDirettiSectionLabel(p.ruolo)
            const aggiungiLabel = associatiAggiungiSectionLabel(p.ruolo)
            const candidateAssociati = getCandidateAssociatiProfiles(p.id, p.ruolo, profiliAssociazione)
            const managerEditSpecializzazione =
              profiloReadOnly &&
              canEditSpecializzazione &&
              (p.ruolo === 'agenzia' || p.ruolo === 'rivenditore')
            const agenziaEditRivenditore =
              canEditRivenditoreAsAgenzia &&
              p.ruolo === 'rivenditore' &&
              isRivenditoreManagedByAgenzia(
                currentUserId,
                profiloGerarchia,
                profiliGerarchia,
                links,
              )
            const agenteEditRivenditore =
              canEditRivenditoreAsAgente &&
              p.ruolo === 'rivenditore' &&
              isRivenditoreManagedByAgente(
                currentUserId,
                profiloGerarchia,
                profiliGerarchia,
                links,
              )
            const rivenditoreEditEsterno = agenziaEditRivenditore || agenteEditRivenditore
            const editSpecializzazione = managerEditSpecializzazione || rivenditoreEditEsterno
            return (
              <li key={p.id} className="rounded-xl border border-black bg-zinc-50/80">
                <details className="group" open={apriProfiliDiDefault || undefined}>
                  <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900">
                      {p.societa ? (
                        <>
                          {p.societa}
                          <span className="ml-2 text-xs font-normal text-zinc-400">{p.nome_completo || ''}</span>
                        </>
                      ) : (
                        p.nome_completo || p.email || p.id
                      )}
                      <span className="ml-2 text-xs font-normal text-zinc-500">
                        {tRuolo(locale, p.ruolo)}
                        {p.registrazione_approvata === false ? ` · ${copy.inAttesa}` : ''}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">{p.area_geografica || copy.areaNonDefinita}</span>
                  </summary>
                  <div className="border-t border-black/10 px-4 py-4 space-y-4 bg-white">
                    {editSpecializzazione ? (
                      <>
                        <p className="text-sm text-zinc-600">
                          {rivenditoreEditEsterno
                            ? copy.editRivenditoreHelp
                            : copy.editAgenziaHelp}
                        </p>
                        <form
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            await postUpdate(readFormSpecializzazione(fd, p.id, p.ruolo))
                          }}
                        >
                          {p.ruolo === 'rivenditore' ? (
                            <RivenditoreProfiloCampi
                              profilo={{
                                espositore_1: p.espositore_1 ?? null,
                                espositore_2: p.espositore_2 ?? null,
                                box_show_room_1: p.box_show_room_1 ?? null,
                                box_show_room_2: p.box_show_room_2 ?? null,
                                box_show_room_3: p.box_show_room_3 ?? null,
                                box_show_room_4: p.box_show_room_4 ?? null,
                                espositore_1_qta: p.espositore_1_qta ?? null,
                                espositore_2_qta: p.espositore_2_qta ?? null,
                                box_show_room_1_qta: p.box_show_room_1_qta ?? null,
                                box_show_room_2_qta: p.box_show_room_2_qta ?? null,
                                box_show_room_3_qta: p.box_show_room_3_qta ?? null,
                                box_show_room_4_qta: p.box_show_room_4_qta ?? null,
                                espositore_1_data: p.espositore_1_data ?? null,
                                espositore_2_data: p.espositore_2_data ?? null,
                                box_show_room_1_data: p.box_show_room_1_data ?? null,
                                box_show_room_2_data: p.box_show_room_2_data ?? null,
                                box_show_room_3_data: p.box_show_room_3_data ?? null,
                                box_show_room_4_data: p.box_show_room_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                          ) : null}
                          {!rivenditoreEditEsterno && p.ruolo === 'agenzia' ? (
                            <AgenziaProfiloCampi
                              profilo={{
                                agenzia_campione_1: p.agenzia_campione_1 ?? null,
                                agenzia_campione_2: p.agenzia_campione_2 ?? null,
                                agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
                                agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
                                agenzia_catalogo_3: p.agenzia_catalogo_3 ?? null,
                                agenzia_catalogo_4: p.agenzia_catalogo_4 ?? null,
                                agenzia_campione_1_qta: p.agenzia_campione_1_qta ?? null,
                                agenzia_campione_2_qta: p.agenzia_campione_2_qta ?? null,
                                agenzia_catalogo_1_qta: p.agenzia_catalogo_1_qta ?? null,
                                agenzia_catalogo_2_qta: p.agenzia_catalogo_2_qta ?? null,
                                agenzia_catalogo_3_qta: p.agenzia_catalogo_3_qta ?? null,
                                agenzia_catalogo_4_qta: p.agenzia_catalogo_4_qta ?? null,
                                agenzia_campione_1_data: p.agenzia_campione_1_data ?? null,
                                agenzia_campione_2_data: p.agenzia_campione_2_data ?? null,
                                agenzia_catalogo_1_data: p.agenzia_catalogo_1_data ?? null,
                                agenzia_catalogo_2_data: p.agenzia_catalogo_2_data ?? null,
                                agenzia_catalogo_3_data: p.agenzia_catalogo_3_data ?? null,
                                agenzia_catalogo_4_data: p.agenzia_catalogo_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                          ) : null}
                          <div className="md:col-span-2">
                            <button
                              type="submit"
                              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                            >
                              {rivenditoreEditEsterno ? copy.salvaEspositori : copy.salvaSpecializzazione}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : profiloReadOnly ? (
                      <p className="text-sm text-zinc-600">
                        {agenziaRivenditoriMode
                          ? copy.profiloSolaLettura
                          : readOnly
                            ? copy.visualizzazioneManager
                            : copy.profiloAdminAccount}
                      </p>
                    ) : (
                      <>
                        <form
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            await postUpdate(readForm(fd, p.id))
                          }}
                        >
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoNome}
                            <input
                              name="nome_completo"
                              type="text"
                              defaultValue={p.nome_completo ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoEmail}
                            <input
                              name="email"
                              type="email"
                              defaultValue={p.email ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoTelefono}
                            <input
                              name="telefono"
                              type="tel"
                              defaultValue={p.telefono ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoSocieta}
                            <input
                              name="societa"
                              type="text"
                              defaultValue={p.societa ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoArea}
                            <input
                              name="area_geografica"
                              type="text"
                              defaultValue={p.area_geografica ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoRuolo}
                            <select
                              name="ruolo"
                              defaultValue={p.ruolo}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            >
                              {RUOLI_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {tRuolo(locale, r)}
                                </option>
                              ))}
                            </select>
                          </label>
                          {p.ruolo === 'rivenditore' ? (
                            <label className="block text-xs font-medium uppercase text-zinc-600">
                              {copy.seguitoDa}
                              <input
                                name="seguito_da"
                                type="text"
                                placeholder={copy.placeholderSeguito}
                                defaultValue={p.seguito_da ?? ''}
                                className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                              />
                            </label>
                          ) : null}
                          {p.ruolo === 'rivenditore' ? (
                            <RivenditoreProfiloCampi
                              profilo={{
                                espositore_1: p.espositore_1 ?? null,
                                espositore_2: p.espositore_2 ?? null,
                                box_show_room_1: p.box_show_room_1 ?? null,
                                box_show_room_2: p.box_show_room_2 ?? null,
                                box_show_room_3: p.box_show_room_3 ?? null,
                                box_show_room_4: p.box_show_room_4 ?? null,
                                espositore_1_qta: p.espositore_1_qta ?? null,
                                espositore_2_qta: p.espositore_2_qta ?? null,
                                box_show_room_1_qta: p.box_show_room_1_qta ?? null,
                                box_show_room_2_qta: p.box_show_room_2_qta ?? null,
                                box_show_room_3_qta: p.box_show_room_3_qta ?? null,
                                box_show_room_4_qta: p.box_show_room_4_qta ?? null,
                                espositore_1_data: p.espositore_1_data ?? null,
                                espositore_2_data: p.espositore_2_data ?? null,
                                box_show_room_1_data: p.box_show_room_1_data ?? null,
                                box_show_room_2_data: p.box_show_room_2_data ?? null,
                                box_show_room_3_data: p.box_show_room_3_data ?? null,
                                box_show_room_4_data: p.box_show_room_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                          ) : null}
                          {p.ruolo === 'agenzia' ? (
                            <AgenziaProfiloCampi
                              profilo={{
                                agenzia_campione_1: p.agenzia_campione_1 ?? null,
                                agenzia_campione_2: p.agenzia_campione_2 ?? null,
                                agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
                                agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
                                agenzia_catalogo_3: p.agenzia_catalogo_3 ?? null,
                                agenzia_catalogo_4: p.agenzia_catalogo_4 ?? null,
                                agenzia_campione_1_qta: p.agenzia_campione_1_qta ?? null,
                                agenzia_campione_2_qta: p.agenzia_campione_2_qta ?? null,
                                agenzia_catalogo_1_qta: p.agenzia_catalogo_1_qta ?? null,
                                agenzia_catalogo_2_qta: p.agenzia_catalogo_2_qta ?? null,
                                agenzia_catalogo_3_qta: p.agenzia_catalogo_3_qta ?? null,
                                agenzia_catalogo_4_qta: p.agenzia_catalogo_4_qta ?? null,
                                agenzia_campione_1_data: p.agenzia_campione_1_data ?? null,
                                agenzia_campione_2_data: p.agenzia_campione_2_data ?? null,
                                agenzia_catalogo_1_data: p.agenzia_catalogo_1_data ?? null,
                                agenzia_catalogo_2_data: p.agenzia_catalogo_2_data ?? null,
                                agenzia_catalogo_3_data: p.agenzia_catalogo_3_data ?? null,
                                agenzia_catalogo_4_data: p.agenzia_catalogo_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                          ) : null}
                          <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-800">
                            <input
                              type="checkbox"
                              name="registrazione_approvata"
                              value="on"
                              defaultChecked={p.registrazione_approvata !== false}
                              className="rounded border-black"
                            />
                            {copy.registrazioneApprovata}
                          </label>
                          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                            <button
                              type="submit"
                              disabled={deletingId === p.id}
                              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                            >
                              {copy.salvaProfilo}
                            </button>
                            {p.ruolo !== 'admin' && p.id !== currentUserId ? (
                              <button
                                type="button"
                                disabled={deletingId === p.id}
                                onClick={() => void postDelete(p.id)}
                                className="h-9 rounded-md border border-red-600 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === p.id ? copy.eliminazione : copy.eliminaUtente}
                              </button>
                            ) : null}
                          </div>
                        </form>

                        {associatiLabel ? (
                          <div>
                            <p className="text-xs font-medium uppercase text-zinc-600 mb-2">
                              {associatiLabel}
                            </p>
                            <div className="border border-black/15 rounded-lg p-3 bg-zinc-50">
                              <AssociatiDirettiCascade
                                ownerProfileId={p.id}
                                roots={directAssociati}
                                candidates={candidateAssociati}
                                aggiungiLabel={aggiungiLabel ?? copy.associaProfilo}
                                profiliGerarchia={profiliGerarchia}
                                links={links}
                                linksByUtente={linksByUtente}
                                readOnly={readOnly || p.id === currentUserId || p.ruolo === 'admin'}
                                onToggleLink={async (add, utenteId, operatoreId) =>
                                  postLink(add ? 'add' : 'remove', utenteId, operatoreId)
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}

                    {canCreateAssociati && p.ruolo === 'agenzia' ? (
                      <>
                        <CreaAssociatoManuale
                          parentId={p.id}
                          parentLabel={p.societa || p.nome_completo || p.email || 'questa agenzia'}
                          ruoloNuovo="agente"
                        />
                        <CreaAssociatoManuale
                          parentId={p.id}
                          parentLabel={p.societa || p.nome_completo || p.email || 'questa agenzia'}
                          ruoloNuovo="back_office"
                        />
                      </>
                    ) : null}
                    {canCreateAssociati && p.ruolo === 'rivenditore' ? (
                      <CreaAssociatoManuale
                        parentId={p.id}
                        parentLabel={p.societa || p.nome_completo || p.email || 'questo rivenditore'}
                        ruoloNuovo="distributore"
                      />
                    ) : null}

                    {canManageCataloghi && puoPersonalizzareCataloghi(p.ruolo) ? (
                      <div>
                        <p className="text-xs font-medium uppercase text-zinc-600 mb-1">
                          Dashboard utente
                        </p>
                        <p className="text-xs text-zinc-500 mb-2">
                          Le sezioni spuntate sono visibili nella dashboard di questo utente. Togli la spunta per nasconderne una; quando tutte sono spuntate, vede tutto il previsto per il suo ruolo.
                        </p>
                        <div className="border border-black/15 rounded-lg p-3 bg-zinc-50">
                          <CatalogoPermessiPanel
                            utenteId={p.id}
                            utenteRuolo={p.ruolo}
                            allCataloghi={allCataloghi}
                            readOnly={false}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
