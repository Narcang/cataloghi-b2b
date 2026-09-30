'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Persona = { id: string; label: string; agenteId: string }

type Props = {
  agenti: { id: string; label: string }[]
  rivenditori: Persona[]
}

export default function CollegaRivenditoreAdAgente({ agenti, rivenditori }: Props) {
  const router = useRouter()
  const [scelta, setScelta] = useState<Record<string, string>>(() =>
    Object.fromEntries(rivenditori.map((r) => [r.id, r.agenteId])),
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function salva(profiloId: string) {
    setSavingId(profiloId)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/collega-rivenditore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ profilo_id: profiloId, agente_id: scelta[profiloId] ?? '' }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Collegamento non riuscito')
        return
      }
      setMessage(data.message ?? 'Collegamento aggiornato')
      router.refresh()
    } finally {
      setSavingId(null)
    }
  }

  if (rivenditori.length === 0) return null

  return (
    <section className="border border-black rounded-2xl bg-white p-6 space-y-4">
      <div>
        <h2 className="text-xl text-zinc-900 font-medium">Collega i rivenditori agli agenti</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Gli inviti del back-office restano sull’agenzia. Da qui puoi assegnare un rivenditore a un agente della stessa agenzia: in struttura compare sotto quell’agente, con i suoi venditori e studi.
        </p>
      </div>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="space-y-3 list-none p-0 m-0">
        {rivenditori.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3">
            <span className="min-w-[180px] text-sm font-medium text-zinc-900">{r.label}</span>
            <select
              value={scelta[r.id] ?? ''}
              onChange={(e) => setScelta((prev) => ({ ...prev, [r.id]: e.target.value }))}
              className="h-9 rounded-md border border-black/20 bg-white px-3 text-sm text-zinc-900 min-w-[220px]"
            >
              <option value="">Agenzia (nessun agente)</option>
              {agenti.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={savingId === r.id}
              onClick={() => void salva(r.id)}
              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
            >
              {savingId === r.id ? 'Salvataggio…' : 'Salva'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
