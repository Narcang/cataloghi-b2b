'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cataloghiAssegnabiliAUtente,
  categorieSelezionateDaIds,
  idsCataloghiInCategorie,
  raggruppaCataloghiPerCategoria,
  type CatalogoPermessoRow,
} from '@/lib/catalogPermessiUtente'

export type CatalogoDisponibile = CatalogoPermessoRow

type Props = {
  utenteId: string
  utenteRuolo: string
  allCataloghi: CatalogoDisponibile[]
  readOnly?: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  Scontistiche: 'Merchandising',
}

function catLabel(cat: string): string {
  return CATEGORY_LABEL[cat] ?? cat
}

export default function CatalogoPermessiPanel({ utenteId, utenteRuolo, allCataloghi, readOnly = false }: Props) {
  const cataloghiUtente = useMemo(
    () => cataloghiAssegnabiliAUtente(allCataloghi, utenteRuolo),
    [allCataloghi, utenteRuolo],
  )
  const gruppi = useMemo(() => raggruppaCataloghiPerCategoria(cataloghiUtente), [cataloghiUtente])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const selectedCategories = useMemo(
    () => categorieSelezionateDaIds(gruppi, selectedIds),
    [gruppi, selectedIds],
  )

  useEffect(() => {
    setLoaded(false)
    fetch(`/api/admin/catalogo-permessi?utente_id=${encodeURIComponent(utenteId)}`, {
      credentials: 'same-origin',
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setSelectedIds(new Set<string>(data.catalogo_ids))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [utenteId])

  const toggleCategory = useCallback((categoria: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const gruppo = gruppi.find(g => g.categoria === categoria)
      if (!gruppo) return next

      const allSelected = gruppo.cataloghi.every(c => next.has(c.id))
      for (const c of gruppo.cataloghi) {
        if (allSelected) next.delete(c.id)
        else next.add(c.id)
      }
      return next
    })
    setMsg(null)
  }, [gruppi])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setMsg(null)
    const catalogo_ids = [...selectedIds]
    try {
      const res = await fetch('/api/admin/catalogo-permessi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ utente_id: utenteId, catalogo_ids }),
      })
      const data = await res.json()
      setMsg({ type: data.ok ? 'ok' : 'err', text: data.ok ? 'Permessi salvati' : (data.message ?? 'Errore') })
    } catch {
      setMsg({ type: 'err', text: 'Errore di rete' })
    } finally {
      setSaving(false)
    }
  }, [utenteId, selectedIds])

  const handleSelectCategories = useCallback((categorie: Set<string>) => {
    setSelectedIds(new Set(idsCataloghiInCategorie(gruppi, categorie)))
    setMsg(null)
  }, [gruppi])

  if (gruppi.length === 0) {
    return (
      <p className="text-xs text-zinc-400">
        Nessuna categoria catalogo configurabile per il ruolo &quot;{utenteRuolo}&quot;.
      </p>
    )
  }

  const noneSelected = selectedIds.size === 0

  return (
    <div className="space-y-3">
      {!loaded ? (
        <p className="text-xs text-zinc-400">Caricamento permessi…</p>
      ) : (
        <>
          <p className="text-xs text-zinc-500 italic">
            {noneSelected
              ? 'Nessuna restrizione: l\'utente vede tutte le categorie previste per il suo ruolo.'
              : `${selectedCategories.size} categorie selezionate — l\'utente vedrà solo i PDF in quelle linee.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {gruppi.map(g => (
              <label
                key={g.categoria}
                className={`flex items-start gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm ${
                  readOnly ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-zinc-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.has(g.categoria)}
                  onChange={() => !readOnly && toggleCategory(g.categoria)}
                  disabled={readOnly}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[#060d41]"
                />
                <span>
                  <span className="font-medium text-zinc-900">{catLabel(g.categoria)}</span>
                  <span className="block text-xs text-zinc-500">
                    {g.cataloghi.length} PDF
                  </span>
                </span>
              </label>
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
                {saving ? 'Salvataggio…' : 'Salva categorie'}
              </button>
              {!noneSelected && (
                <button
                  type="button"
                  onClick={() => handleSelectCategories(new Set())}
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
