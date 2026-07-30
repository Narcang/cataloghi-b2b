'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import {
  OPZIONE_CATEGORIA_LABEL,
  type OpzioneCategoria,
  type OpzioniSpecializzazioneMap,
} from '@/lib/profiloSpecializzazioneOpzioni'

type Props = {
  categoria: OpzioneCategoria
  opzioni: string[]
  onOpzioniChange: (opzioni: OpzioniSpecializzazioneMap) => void
}

export default function ProfiloOpzioniCategoriaAdmin({ categoria, opzioni, onOpzioniChange }: Props) {
  const [testo, setTesto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function muta(azione: 'aggiungi' | 'rimuovi', etichetta: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/profili/specializzazione-opzioni', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, etichetta, azione }),
      })
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; opzioni?: OpzioniSpecializzazioneMap }
        | null
      if (!res.ok || !data?.ok || !data.opzioni) {
        setError(data?.message ?? 'Operazione non riuscita')
        return
      }
      onOpzioniChange(data.opzioni)
      if (azione === 'aggiungi') setTesto('')
    } finally {
      setLoading(false)
    }
  }

  function handleAggiungi() {
    const etichetta = testo.trim()
    if (!etichetta) return
    void muta('aggiungi', etichetta)
  }

  function handleRimuovi(etichetta: string) {
    if (
      !window.confirm(
        `Rimuovere "${etichetta}" dall'elenco ${OPZIONE_CATEGORIA_LABEL[categoria].toLowerCase()}?\n\nI profili che la usano conservano il valore salvato.`,
      )
    ) {
      return
    }
    void muta('rimuovi', etichetta)
  }

  return (
    <div className="mb-3 rounded-md border border-dashed border-amber-500/50 bg-amber-50/80 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900">
        Admin — voci menu {OPZIONE_CATEGORIA_LABEL[categoria].toLowerCase()}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {opzioni.length === 0 ? (
          <span className="text-[11px] text-zinc-500">Nessuna voce disponibile.</span>
        ) : (
          opzioni.map((option) => (
            <span
              key={option}
              className="inline-flex items-center gap-0.5 rounded border border-black/10 bg-white px-1.5 py-0.5 text-[11px] text-zinc-800"
            >
              {option}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleRimuovi(option)}
                className="inline-flex h-4 w-4 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                aria-label={`Rimuovi ${option}`}
                title="Rimuovi voce dall'elenco"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          type="text"
          value={testo}
          disabled={loading}
          onChange={(e) => setTesto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAggiungi()
            }
          }}
          placeholder="Nuova voce…"
          className="min-w-0 flex-1 h-8 rounded border border-black/20 bg-white px-2 text-xs text-zinc-900"
        />
        <button
          type="button"
          disabled={loading || !testo.trim()}
          onClick={handleAggiungi}
          className="inline-flex h-8 items-center gap-1 rounded border border-[#060d41] bg-[#060d41] px-2.5 text-[11px] font-semibold text-white hover:bg-[#0a155a] disabled:opacity-40"
        >
          <Plus size={12} aria-hidden />
          Aggiungi
        </button>
      </div>
      {error ? <p className="mt-1 text-[10px] text-red-600">{error}</p> : null}
    </div>
  )
}
