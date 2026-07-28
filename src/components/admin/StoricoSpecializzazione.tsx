'use client'

import { useState } from 'react'
import { History, ChevronDown, ChevronRight } from 'lucide-react'
import {
  formatVoceStorico,
  SEZIONE_STORICO_LABEL,
  type SezioneStorico,
  type VoceStorico,
} from '@/lib/profiloSpecializzazioneStorico'

type StoricoRiga = {
  id: string
  sezione: string
  voci: VoceStorico[]
  aggiornato_il_precedente: string | null
  creato_il: string
}

type Props = {
  profiloId: string
  sezione: SezioneStorico
}

function formatQuando(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StoricoSpecializzazione({ profiloId, sezione }: Props) {
  const [aperto, setAperto] = useState(false)
  const [caricato, setCaricato] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [righe, setRighe] = useState<StoricoRiga[]>([])

  async function carica() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/profili/storico?profilo_id=${encodeURIComponent(profiloId)}&sezione=${encodeURIComponent(sezione)}`,
        { credentials: 'same-origin' },
      )
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; storico?: StoricoRiga[] }
        | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Caricamento non riuscito')
        return
      }
      setRighe(data.storico ?? [])
      setCaricato(true)
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    const next = !aperto
    setAperto(next)
    if (next && !caricato && !loading) {
      void carica()
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-white hover:underline"
      >
        {aperto ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
        <History size={12} aria-hidden />
        Storico {SEZIONE_STORICO_LABEL[sezione].toLowerCase()}
      </button>

      {aperto ? (
        <div className="mt-1 rounded-md border border-black/10 bg-zinc-50 p-2 max-w-[16rem]">
          {loading ? (
            <p className="text-[10px] text-zinc-500">Caricamento…</p>
          ) : error ? (
            <p className="text-[10px] text-red-600">{error}</p>
          ) : righe.length === 0 ? (
            <p className="text-[10px] text-zinc-500">Nessun inserimento precedente.</p>
          ) : (
            <ul className="space-y-2 list-none p-0 m-0">
              {righe.map((riga) => {
                const quando = formatQuando(riga.aggiornato_il_precedente) ?? formatQuando(riga.creato_il)
                return (
                  <li key={riga.id} className="border-b border-black/5 last:border-0 pb-1.5 last:pb-0">
                    {quando ? (
                      <p className="text-[10px] font-semibold text-zinc-600">{quando}</p>
                    ) : null}
                    <div className="mt-0.5 space-y-0.5">
                      {riga.voci.map((voce, index) => (
                        <p key={`${riga.id}-${index}`} className="text-[11px] text-zinc-700 leading-snug">
                          {formatVoceStorico(voce)}
                        </p>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
