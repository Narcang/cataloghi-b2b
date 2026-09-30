'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Agente = { id: string; label: string }
type Collegamento = { id: string; label: string; agenteId: string; tipo: 'rivenditore' | 'studio' }

type Props = {
  agenti: Agente[]
  collegamenti: Collegamento[]
}

const TIPO_LABEL: Record<Collegamento['tipo'], string> = {
  rivenditore: 'Rivenditori',
  studio: 'Sede Studio',
}

export default function CollegaRivenditoreAdAgente({ agenti, collegamenti }: Props) {
  const router = useRouter()
  const [scelta, setScelta] = useState<Record<string, string>>(() =>
    Object.fromEntries(collegamenti.map((r) => [r.id, r.agenteId])),
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

  const ordinati = [...collegamenti].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'rivenditore' ? -1 : 1
    return a.label.localeCompare(b.label, 'it', { sensitivity: 'base' })
  })

  return (
    <section className="border border-black rounded-2xl bg-white p-6 space-y-6">
      <div>
        <h2 className="text-xl text-zinc-900 font-medium">Collegamenti dell’agenzia</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Gli inviti del back-office restano sull’agenzia. Da qui assegni un rivenditore o una sede studio a un agente: in struttura compare sotto quell’agente.
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
            {agenti.map((a) => (
              <li key={a.id} className="text-sm font-medium text-zinc-900">
                {a.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-black/20 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">Collegamenti</h3>
        {ordinati.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun rivenditore o sede studio associato all’agenzia.</p>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0">
            {ordinati.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3">
                <span className="w-[110px] text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {TIPO_LABEL[r.tipo]}
                </span>
                <span className="min-w-[180px] text-sm font-medium text-zinc-900">{r.label}</span>
                <select
                  value={scelta[r.id] ?? ''}
                  onChange={(e) => setScelta((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="h-9 rounded-md border border-black/20 bg-white px-3 text-sm text-zinc-900 min-w-[220px]"
                  aria-label={`Agente per ${r.label}`}
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
        )}
      </div>
    </section>
  )
}
