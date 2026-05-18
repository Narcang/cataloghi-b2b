'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Users, UserCheck } from 'lucide-react'

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

const RUOLI_OPTIONS = ['free', 'studio', 'agente', 'distributore', 'fornitore', 'admin'] as const

type RuoloOption = (typeof RUOLI_OPTIONS)[number]

const RUOLI_TAB: { id: RuoloOption; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'agente', label: 'Agente' },
  { id: 'distributore', label: 'Partner' },
  { id: 'studio', label: 'Studio' },
  { id: 'free', label: 'Free' },
  { id: 'fornitore', label: 'Fornitore' },
]

function profiloSortKey(p: ProfiloGestioneRow): string {
  return (p.nome_completo || p.email || p.id).trim().toLocaleLowerCase('it')
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
  operatoriDisponibili: OperatoreAssociazione[]
  links: { utente_id: string; operatore_id: string }[]
}

export default function AdminProfiliPanel({
  currentUserId,
  profiliPendenti,
  profiliLista,
  operatoriDisponibili,
  links,
}: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [ruoloAttivo, setRuoloAttivo] = useState<RuoloOption>('admin')

  const profiliPendentiOrdinati = useMemo(() => sortProfiliAlfabetico(profiliPendenti), [profiliPendenti])

  const profiliPerRuolo = useMemo(() => {
    const map = new Map<RuoloOption, ProfiloGestioneRow[]>()
    for (const ruolo of RUOLI_OPTIONS) map.set(ruolo, [])
    for (const profilo of sortProfiliAlfabetico(profiliLista)) {
      const ruolo = RUOLI_OPTIONS.includes(profilo.ruolo as RuoloOption)
        ? (profilo.ruolo as RuoloOption)
        : 'free'
      map.get(ruolo)!.push(profilo)
    }
    return map
  }, [profiliLista])

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
                  {p.telefono || '—'}
                </p>
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
                          {r}
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
            const readOnly = p.id === currentUserId || p.ruolo === 'admin'
            const selected = linksByUtente.get(p.id) ?? new Set<string>()
            return (
              <li key={p.id} className="rounded-xl border border-black bg-zinc-50/80">
                <details className="group">
                  <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900">
                      {p.nome_completo || p.email || p.id}
                      <span className="ml-2 text-xs font-normal text-zinc-500">
                        {p.ruolo}
                        {p.registrazione_approvata === false ? ' · in attesa' : ''}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">{p.area_geografica || 'Area non definita'}</span>
                  </summary>
                  <div className="border-t border-black/10 px-4 py-4 space-y-4 bg-white">
                    {readOnly ? (
                      <p className="text-sm text-zinc-600">Profilo admin o il tuo account: modifica da Supabase se necessario.</p>
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
                                  {r}
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

                        <div>
                          <p className="text-xs font-medium uppercase text-zinc-600 mb-2">
                            Contatti in rubrica (agenti, partner, studio)
                          </p>
                          <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto border border-black/15 rounded-lg p-3 bg-zinc-50">
                            {operatoriDisponibili.filter((op) => op.id !== p.id).length === 0 ? (
                              <span className="text-sm text-zinc-500">
                                Nessun altro agente, partner o studio nel filtro area corrente.
                              </span>
                            ) : (
                              operatoriDisponibili
                                .filter((op) => op.id !== p.id)
                                .map((op) => (
                                <label key={op.id} className="flex items-center gap-2 text-sm text-zinc-800 min-w-[200px]">
                                  <input
                                    type="checkbox"
                                    checked={selected.has(op.id)}
                                    onChange={async (e) => {
                                      const on = e.target.checked
                                      const ok = await postLink(on ? 'add' : 'remove', p.id, op.id)
                                      if (!ok) e.target.checked = !on
                                    }}
                                  />
                                  <span>
                                    {op.nome_completo || op.email}{' '}
                                    <span className="text-zinc-500 text-xs">
                                      ({op.ruolo === 'distributore' ? 'partner' : op.ruolo}
                                      {op.area_geografica ? ` · ${op.area_geografica}` : ''})
                                    </span>
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
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
