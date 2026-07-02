'use client'

import { useCallback, useEffect, useState } from 'react'

export type CatalogoDisponibile = {
  id: string
  titolo: string | null
  categoria: string | null
  ruoli_visibili: string[]
}

type Props = {
  utenteId: string
  utenteRuolo: string
  allCataloghi: CatalogoDisponibile[]
  readOnly?: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  Scontistiche: 'Merchandising',
}

function catLabel(cat: string | null): string {
  if (!cat) return 'Altro'
  return CATEGORY_LABEL[cat] ?? cat
}

export default function CatalogoPermessiPanel({ utenteId, utenteRuolo, allCataloghi, readOnly = false }: Props) {
  const cataloghiRuolo = allCataloghi.filter(c => c.ruoli_visibili.includes(utenteRuolo))

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    setLoaded(false)
    fetch(`/api/admin/catalogo-permessi?utente_id=${encodeURIComponent(utenteId)}`, {
      credentials: 'same-origin',
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setSelected(new Set<string>(data.catalogo_ids))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [utenteId])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setMsg(null)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/catalogo-permessi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ utente_id: utenteId, catalogo_ids: [...selected] }),
      })
      const data = await res.json()
      setMsg({ type: data.ok ? 'ok' : 'err', text: data.ok ? 'Permessi salvati' : (data.message ?? 'Errore') })
    } catch {
      setMsg({ type: 'err', text: 'Errore di rete' })
    } finally {
      setSaving(false)
    }
  }, [utenteId, selected])

  if (cataloghiRuolo.length === 0) {
    return <p className="text-xs text-zinc-400">Nessun catalogo disponibile per il ruolo &quot;{utenteRuolo}&quot;.</p>
  }

  // Raggruppa per categoria
  const byCategory: Record<string, CatalogoDisponibile[]> = {}
  for (const c of cataloghiRuolo) {
    const cat = c.categoria ?? 'Altro'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(c)
  }

  const noneSelected = selected.size === 0

  return (
    <div className="space-y-3">
      {!loaded ? (
        <p className="text-xs text-zinc-400">Caricamento permessi…</p>
      ) : (
        <>
          <p className="text-xs text-zinc-500 italic">
            {noneSelected
              ? 'Nessuna restrizione: l\'utente vede tutti i cataloghi del suo ruolo.'
              : `${selected.size} catalogo/i abilitati — gli altri non saranno visibili a questo utente.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                  {catLabel(cat)}
                </p>
                <div className="flex flex-col gap-1">
                  {items.map(c => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 text-sm ${readOnly ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => !readOnly && toggle(c.id)}
                        disabled={readOnly}
                        className="h-4 w-4 rounded border-zinc-300 accent-[#060d41]"
                      />
                      <span className="text-zinc-800">{c.titolo ?? c.id}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-8 px-3 rounded-md bg-[#060d41] text-white text-xs font-semibold hover:bg-[#0a155a] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Salvataggio…' : 'Salva restrizioni'}
              </button>
              {!noneSelected && (
                <button
                  type="button"
                  onClick={() => { setSelected(new Set()); setMsg(null) }}
                  className="h-8 px-3 rounded-md border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Rimuovi tutte le restrizioni
                </button>
              )}
              {msg && (
                <span className={`text-xs font-medium ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.text}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
