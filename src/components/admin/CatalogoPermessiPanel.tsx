'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildGruppiCategorieConfigurabili,
  categorieSelezionateDaIds,
  idsCataloghiInCategorie,
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
  const gruppi = useMemo(
    () => buildGruppiCategorieConfigurabili(allCataloghi, utenteRuolo),
    [allCataloghi, utenteRuolo],
  )
  const gruppiConPdf = useMemo(() => gruppi.filter(g => g.cataloghi.length > 0), [gruppi])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const selectedCategories = useMemo(
    () => categorieSelezionateDaIds(gruppiConPdf, selectedIds),
    [gruppiConPdf, selectedIds],
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
      const gruppo = gruppiConPdf.find(g => g.categoria === categoria)
      if (!gruppo) return next

      const allSelected = gruppo.cataloghi.every(c => next.has(c.id))
      for (const c of gruppo.cataloghi) {
        if (allSelected) next.delete(c.id)
        else next.add(c.id)
      }
      return next
    })
    setMsg(null)
  }, [gruppiConPdf])

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
    setSelectedIds(new Set(idsCataloghiInCategorie(gruppiConPdf, categorie)))
    setMsg(null)
  }, [gruppiConPdf])

  if (gruppi.length === 0) {
    return (
      <p className="text-xs text-zinc-400">
        Nessuna categoria configurabile per il ruolo &quot;{utenteRuolo}&quot;.
      </p>
    )
  }

  if (allCataloghi.length === 0) {
    return (
      <p className="text-xs text-amber-700">
        Elenco cataloghi non disponibile (verifica SUPABASE_SERVICE_ROLE_KEY in produzione).
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
          <div className="flex flex-wrap gap-3 max-h-56 overflow-y-auto">
            {gruppi.map(g => {
              const hasPdf = g.cataloghi.length > 0
              const checked = hasPdf && selectedCategories.has(g.categoria)
              return (
                <label
                  key={g.categoria}
                  className={`flex items-center gap-2 text-sm text-zinc-800 min-w-[200px] ${
                    !hasPdf || readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => hasPdf && !readOnly && toggleCategory(g.categoria)}
                    disabled={readOnly || !hasPdf}
                    className="rounded border-black accent-[#060d41]"
                  />
                  <span>
                    {catLabel(g.categoria)}
                    <span className="text-zinc-500 text-xs">
                      {hasPdf ? ` (${g.cataloghi.length} PDF)` : ' (nessun PDF)'}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          <p className="text-xs text-zinc-500">
            {noneSelected
              ? 'Nessuna restrizione: l\'utente vede tutte le categorie previste per il suo ruolo.'
              : `${selectedCategories.size} categorie selezionate — l\'utente vedrà solo quelle linee.`}
          </p>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Salvataggio…' : 'Salva categorie'}
              </button>
              {!noneSelected && (
                <button
                  type="button"
                  onClick={() => handleSelectCategories(new Set())}
                  className="h-9 px-4 rounded-md border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
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
