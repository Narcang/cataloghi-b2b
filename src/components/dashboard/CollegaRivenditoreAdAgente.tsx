'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Agente = { id: string; label: string }
type Cliente = { id: string; label: string; ruolo: string; ruoloLabel: string; agenteId: string }

type Props = {
  agenti: Agente[]
  clienti: Cliente[]
}

const ORDINE_RUOLI = ['back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato']

export default function CollegaRivenditoreAdAgente({ agenti, clienti }: Props) {
  const router = useRouter()
  const [agenteId, setAgenteId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const gruppi = useMemo(() => {
    const byRuolo = new Map<string, Cliente[]>()
    for (const cliente of clienti) {
      const list = byRuolo.get(cliente.ruolo) ?? []
      list.push(cliente)
      byRuolo.set(cliente.ruolo, list)
    }
    return ORDINE_RUOLI.flatMap((ruolo) => {
      const list = byRuolo.get(ruolo)
      if (!list?.length) return []
      list.sort((a, b) => a.label.localeCompare(b.label, 'it', { sensitivity: 'base' }))
      return [{ ruolo, label: list[0]?.ruoloLabel ?? ruolo, clienti: list }]
    })
  }, [clienti])

  const agenteLabel = new Map(agenti.map((a) => [a.id, a.label]))

  async function salva(profiloId: string, nuovoAgenteId: string) {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/collega-rivenditore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ profilo_id: profiloId, agente_id: nuovoAgenteId }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Collegamento non riuscito')
        return
      }
      setMessage(data.message ?? 'Collegamento aggiornato')
      setClienteId('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const cliente = clienti.find((c) => c.id === clienteId)

  return (
    <section className="border border-black rounded-2xl bg-white p-6 space-y-6">
      <div>
        <h2 className="text-xl text-zinc-900 font-medium">Collegamenti dell’agenzia</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Scegli un agente, poi un cliente da collegare. In struttura il cliente compare sotto quell’agente.
        </p>
      </div>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">Agenti</h3>
        {agenti.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun agente associato all’agenzia.</p>
        ) : (
          <ul className="space-y-2 list-none p-0 m-0">
            {agenti.map((a) => {
              const selected = agenteId === a.id
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setAgenteId(a.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm font-medium ${
                      selected ? 'bg-[#060d41] text-white' : 'text-zinc-900 hover:bg-zinc-100'
                    }`}
                    aria-pressed={selected}
                  >
                    {a.label}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-black/20 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">Collegamenti</h3>
        {clienti.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun cliente associato all’agenzia.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-zinc-900" htmlFor="clienti-agenzia">
              Clienti
            </label>
            <select
              id="clienti-agenzia"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="h-9 rounded-md border border-black/20 bg-white px-3 text-sm text-zinc-900 min-w-[260px]"
            >
              <option value="">Clienti</option>
              {gruppi.map((gruppo) => (
                <optgroup key={gruppo.ruolo} label={gruppo.label}>
                  {gruppo.clienti.map((c) => {
                    const gia = c.agenteId ? agenteLabel.get(c.agenteId) : ''
                    return (
                      <option key={c.id} value={c.id}>
                        {gia ? `${c.label} · ${gia}` : c.label}
                      </option>
                    )
                  })}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              disabled={saving || !agenteId || !clienteId}
              onClick={() => void salva(clienteId, agenteId)}
              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
            {cliente?.agenteId ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void salva(cliente.id, '')}
                className="h-9 rounded-md border border-black/20 px-3 text-sm font-medium text-zinc-900 disabled:opacity-50"
              >
                Lascia in agenzia
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
