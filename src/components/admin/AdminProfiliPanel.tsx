'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Users, UserCheck } from 'lucide-react'
import AssociatiDirettiCascade from '@/components/admin/AssociatiDirettiCascade'
import CatalogoPermessiPanel, { type CatalogoDisponibile } from '@/components/admin/CatalogoPermessiPanel'
import {
  associatiAggiungiSectionLabel,
  associatiDirettiSectionLabel,
  getCandidateAssociatiProfiles,
  getChildrenProfiles,
  profiloToGerarchiaRow,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

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
}

export type OperatoreAssociazione = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  ruolo: string
  area_geografica: string | null
}

const RUOLI_OPTIONS = ['admin', 'manager', 'agenzia', 'agente', 'distributore', 'partner_dipendente', 'studio', 'free'] as const

const RUOLO_LABEL: Record<string, string> = {
  agenzia:            'Agenzia',
  distributore:       'Venditori',
  partner_dipendente: 'Venditori Dipendenti',
}

function ruoloLabel(r: string): string {
  return RUOLO_LABEL[r] ?? r
}

/** Ruoli per cui ha senso impostare cataloghi visibili per singolo utente. */
function puoPersonalizzareCataloghi(ruolo: string): boolean {
  return !['admin', 'free', 'manager'].includes(ruolo)
}

type RuoloOption = (typeof RUOLI_OPTIONS)[number]

type RuoloTabId = 'admin' | 'manager' | 'agenzia' | 'agente' | 'distributore' | 'studio' | 'partner_dipendente'

const RUOLI_TAB: { id: RuoloTabId; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'manager', label: 'Manager' },
  { id: 'agenzia', label: 'Agenzia' },
  { id: 'agente', label: 'Agente' },
  { id: 'distributore', label: 'Venditori' },
  { id: 'partner_dipendente', label: 'Venditori Dip.' },
  { id: 'studio', label: 'Studio' },
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
  /** Admin e manager possono gestire i cataloghi visibili anche se readOnly è true. */
  canManageCataloghi?: boolean
}

export default function AdminProfiliPanel({
  currentUserId,
  profiliPendenti,
  profiliLista,
  profiliGerarchia,
  profiliAssociazione,
  links,
  allCataloghi,
  readOnly = false,
  canManageCataloghi = false,
}: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [ruoloAttivo, setRuoloAttivo] = useState<RuoloTabId>('admin')

  const profiliPendentiOrdinati = useMemo(() => sortProfiliAlfabetico(profiliPendenti), [profiliPendenti])

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
    const firstConUtenti = RUOLI_TAB.find((tab) => (profiliPerRuolo.get(tab.id)?.length ?? 0) > 0)
    if ((profiliPerRuolo.get(ruoloAttivo)?.length ?? 0) > 0) return
    if (firstConUtenti) setRuoloAttivo(firstConUtenti.id)
  }, [profiliPerRuolo, ruoloAttivo])

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
      !window.confirm(
        'Eliminare definitivamente questo utente? Verranno rimossi profilo, accesso al portale e collegamenti in rubrica. L’operazione non è annullabile.'
      )
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
    return {
      profilo_id: profiloId,
      nome_completo,
      email,
      telefono,
      societa,
      area_geografica,
      ruolo,
      registrazione_approvata,
    }
  }

  return (
    <section id="gestione-utenti" className="space-y-10 border border-black rounded-2xl bg-white p-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-black pb-4">
        <Users className="text-[#060d41]" size={28} aria-hidden />
        <div>
          <h2 className="text-2xl font-medium text-zinc-900">Gestione utenti</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Approva le registrazioni, aggiorna i dati o elimina account, associa i contatti (agenti, partner e studio)
            visibili nella rubrica: email e telefono del profilo compaiono per chi è collegato, in entrambe le direzioni tra questi ruoli.
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      {profiliPendentiOrdinati.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <UserCheck size={20} aria-hidden />
            Registrazioni in attesa ({profiliPendentiOrdinati.length})
          </h3>
          <ul className="space-y-4 list-none p-0 m-0">
            {profiliPendentiOrdinati.map((p) => (
              <li key={p.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm text-zinc-700 mb-3">
                  <strong>{p.nome_completo || 'Senza nome'}</strong> · {p.email} · {p.societa || '—'} · Tel.{' '}
                  {p.telefono || '—'} · Ruolo: {ruoloLabel(p.ruolo)} · Area: {p.area_geografica || '—'}
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
                      Nome completo
                      <input
                        name="nome_completo"
                        type="text"
                        defaultValue={p.nome_completo ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      Email (profilo)
                      <input
                        name="email"
                        type="email"
                        defaultValue={p.email ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      Telefono
                      <input
                        name="telefono"
                        type="tel"
                        defaultValue={p.telefono ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      Società
                      <input
                        name="societa"
                        type="text"
                        defaultValue={p.societa ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      Area geografica
                      <input
                        name="area_geografica"
                        type="text"
                        placeholder="Es. MONDO, Emilia Romagna"
                        defaultValue={p.area_geografica ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      Ruolo
                      <select
                        name="ruolo"
                        defaultValue={p.ruolo}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      >
                        {RUOLI_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {ruoloLabel(r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-800">
                      <input type="checkbox" name="registrazione_approvata" value="on" defaultChecked={false} className="rounded border-black" />
                      Approva registrazione (accesso ai cataloghi secondo ruolo e area)
                    </label>
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={deletingId === p.id}
                        className="h-10 rounded-lg bg-[#060d41] text-white px-4 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                      >
                        Salva e conferma
                      </button>
                      {p.ruolo !== 'admin' && p.id !== currentUserId ? (
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => void postDelete(p.id)}
                          className="h-10 rounded-lg border border-red-600 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === p.id ? 'Eliminazione…' : 'Elimina utente'}
                        </button>
                      ) : null}
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Nessuna registrazione in attesa.</p>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900">Utenti e operatori associati</h3>
        <p className="text-sm text-zinc-600">
          Elenco filtrato come il Filtro Manager (area). Scegli un ruolo per vedere solo quegli utenti (ordine
          alfabetico). Per ogni profilo puoi modificare i dati e spuntare i contatti in rubrica: tra agente, partner e
          studio la connessione è reciproca (entrambi vedono nome, email e telefono se presenti).
        </p>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtra utenti per ruolo">
          {RUOLI_TAB.map((tab) => {
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
                {tab.label}
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

        <ul className="space-y-3 list-none p-0 m-0" role="tabpanel" aria-label={`Utenti ${ruoloAttivo}`}>
          {profiliRuoloAttivo.length === 0 ? (
            <li className="rounded-xl border border-dashed border-black/30 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
              Nessun utente con questo ruolo nel filtro area corrente.
            </li>
          ) : null}
          {profiliRuoloAttivo.map((p) => {
            const profiloReadOnly = readOnly || p.id === currentUserId || p.ruolo === 'admin'
            const directAssociati = getDirectAssociati(p)
            const associatiLabel = associatiDirettiSectionLabel(p.ruolo)
            const aggiungiLabel = associatiAggiungiSectionLabel(p.ruolo)
            const candidateAssociati = getCandidateAssociatiProfiles(p.id, p.ruolo, profiliAssociazione)
            return (
              <li key={p.id} className="rounded-xl border border-black bg-zinc-50/80">
                <details className="group">
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
                        {ruoloLabel(p.ruolo)}
                        {p.registrazione_approvata === false ? ' · in attesa' : ''}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">{p.area_geografica || 'Area non definita'}</span>
                  </summary>
                  <div className="border-t border-black/10 px-4 py-4 space-y-4 bg-white">
                    {profiloReadOnly ? (
                      <p className="text-sm text-zinc-600">
                        {readOnly
                          ? 'Visualizzazione in sola lettura (ruolo Manager).'
                          : 'Profilo admin o il tuo account: modifica da Supabase se necessario.'}
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
                            Nome completo
                            <input
                              name="nome_completo"
                              type="text"
                              defaultValue={p.nome_completo ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            Email (profilo)
                            <input
                              name="email"
                              type="email"
                              defaultValue={p.email ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            Telefono
                            <input
                              name="telefono"
                              type="tel"
                              defaultValue={p.telefono ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            Società
                            <input
                              name="societa"
                              type="text"
                              defaultValue={p.societa ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            Area geografica
                            <input
                              name="area_geografica"
                              type="text"
                              defaultValue={p.area_geografica ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            Ruolo
                            <select
                              name="ruolo"
                              defaultValue={p.ruolo}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            >
                              {RUOLI_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {ruoloLabel(r)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-800">
                            <input
                              type="checkbox"
                              name="registrazione_approvata"
                              value="on"
                              defaultChecked={p.registrazione_approvata !== false}
                              className="rounded border-black"
                            />
                            Registrazione approvata
                          </label>
                          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                            <button
                              type="submit"
                              disabled={deletingId === p.id}
                              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                            >
                              Salva profilo
                            </button>
                            {p.ruolo !== 'admin' && p.id !== currentUserId ? (
                              <button
                                type="button"
                                disabled={deletingId === p.id}
                                onClick={() => void postDelete(p.id)}
                                className="h-9 rounded-md border border-red-600 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === p.id ? 'Eliminazione…' : 'Elimina utente'}
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
                                aggiungiLabel={aggiungiLabel ?? 'Associa profilo'}
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

                    {canManageCataloghi && puoPersonalizzareCataloghi(p.ruolo) ? (
                      <div>
                        <p className="text-xs font-medium uppercase text-zinc-600 mb-1">
                          Cataloghi visibili
                        </p>
                        <p className="text-xs text-zinc-500 mb-2">
                          Le categorie spuntate sono visibili a questo utente. Togli la spunta per nasconderne una; quando tutte sono spuntate, vede tutto il previsto per il suo ruolo.
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
