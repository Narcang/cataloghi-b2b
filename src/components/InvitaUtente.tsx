'use client'

import { useState } from 'react'
import { ruoliInvitabili } from '@/lib/inviteHierarchy'

type Props = {
  ruoloCorrente: string
}

export default function InvitaUtente({ ruoloCorrente }: Props) {
  const opzioni = ruoliInvitabili(ruoloCorrente)
  const [ruoloSelezionato, setRuoloSelezionato] = useState('')
  const [multiUso, setMultiUso] = useState(false)
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiato, setCopiato] = useState(false)

  if (opzioni.length === 0) return null

  async function handleCrea() {
    setLoading(true)
    setError(null)
    setLink(null)
    setCopiato(false)

    try {
      const res = await fetch('/api/inviti/crea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ruolo_invitato: ruoloSelezionato, multi_uso: multiUso }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.message ?? 'Errore nella creazione del link')
      } else {
        setLink(json.link)
      }
    } catch {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopia() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2500)
    } catch {
      // fallback: seleziona il testo
    }
  }

  return (
    <div className="rounded-xl border border-black/10 bg-zinc-50 p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Invita un utente</h3>
      <p className="text-xs text-zinc-500">
        Genera un link monouso. Chi si registra tramite questo link ottiene il ruolo selezionato e viene
        collegato automaticamente al tuo profilo dopo l&apos;approvazione.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">Ruolo</label>
          <select
            value={ruoloSelezionato}
            onChange={(e) => { setRuoloSelezionato(e.target.value); setLink(null) }}
            className="h-9 rounded-md border border-black/20 bg-white px-3 text-sm text-zinc-900 min-w-[140px]"
          >
            <option value="" disabled>— Seleziona ruolo —</option>
            {opzioni.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleCrea}
          disabled={loading || !ruoloSelezionato}
          className="h-9 px-4 rounded-md bg-[#060d41] text-white text-sm font-medium hover:bg-[#0a155a] disabled:opacity-60 transition-colors"
        >
          {loading ? 'Generazione…' : 'Genera link'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="multi-uso"
          checked={multiUso}
          onChange={(e) => { setMultiUso(e.target.checked); setLink(null) }}
          className="h-4 w-4 rounded border-zinc-300 accent-[#060d41]"
        />
        <label htmlFor="multi-uso" className="text-xs text-zinc-600">
          Link permanente — può essere usato da più persone (non si disattiva)
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {link && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 uppercase tracking-wide">Link di invito</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 h-9 rounded-md border border-black/20 bg-white px-3 text-xs text-zinc-700 font-mono"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={handleCopia}
              className="h-9 px-3 rounded-md border border-black/20 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors whitespace-nowrap"
            >
              {copiato ? 'Copiato!' : 'Copia'}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            {multiUso
              ? 'Link permanente: può essere usato da più persone.'
              : 'Link monouso: si disattiva dopo la prima registrazione.'}
          </p>
        </div>
      )}
    </div>
  )
}
