'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildGruppiCategorieConfigurabili,
  categorieConfigurabiliPerRuolo,
  categorieSelezionateDaIds,
  idsCataloghiInCategorie,
  type CatalogoPermessoRow,
} from '@/lib/catalogPermessiUtente'

export type CatalogoDisponibile = CatalogoPermessoRow

type Props = {
  utenteId: string
  utenteRuolo: string
  allCataloghi?: CatalogoDisponibile[]
  readOnly?: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  Scontistiche: 'Merchandising',
}

function catLabel(cat: string): string {
  return CATEGORY_LABEL[cat] ?? cat
}

export default function CatalogoPermessiPanel({
  utenteId,
  utenteRuolo,
  allCataloghi = [],
  readOnly = false,
}: Props) {
  const [cataloghi, setCataloghi] = useState<CatalogoPermessoRow[]>(allCataloghi)
  const [cataloghiError, setCataloghiError] = useState<string | null>(null)

  const gruppi = useMemo(
    () => buildGruppiCategorieConfigurabili(cataloghi, utenteRuolo),
    [cataloghi, utenteRuolo],
  )
  const gruppiConPdf = useMemo(() => gruppi.filter(g => g.cataloghi.length > 0), [gruppi])
  const categorieRuolo = useMemo(() => categorieConfigurabiliPerRuolo(utenteRuolo), [utenteRuolo])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const selectedCategories = useMemo(
    () => categorieSelezionateDaIds(gruppiConPdf, selectedIds),
    [gruppiConPdf, selectedIds],
  )

  useEffect(() => {
    if (allCataloghi.length > 0) setCataloghi(allCataloghi)
  }, [allCataloghi])

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/catalogo-permessi/cataloghi', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.ok && Array.isArray(data.cataloghi)) {
          setCataloghi(data.cataloghi)
          setCataloghiError(null)
        } else if (!data.ok) {
          setCataloghiError(data.message ?? 'Errore caricamento cataloghi')
        }
      })
      .catch(() => {
        if (!cancelled) setCataloghiError('Errore di rete nel caricamento cataloghi')
      })
    return () => { cancelled = true }
  }, [])

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
    const categorie = [...selectedCategories]
    try {
      const res = await fetch('/api/admin/catalogo-permessi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ utente_id: utenteId, categorie }),
      })
      const data = await res.json()
      if (data.ok && Array.isArray(data.catalogo_ids)) {
        setSelectedIds(new Set<string>(data.catalogo_ids))
      }
      setMsg({ type: data.ok ? 'ok' : 'err', text: data.ok ? 'Permessi salvati' : (data.message ?? 'Errore') })
    } catch {
      setMsg({ type: 'err', text: 'Errore di rete' })
    } finally {
      setSaving(false)
    }
  }, [utenteId, selectedCategories])

  const handleClearRestrictions = useCallback(async () => {
    setSelectedIds(new Set())
    setMsg(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/catalogo-permessi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ utente_id: utenteId, categorie: [] }),
      })
      const data = await res.json()
      setMsg({ type: data.ok ? 'ok' : 'err', text: data.ok ? 'Restrizioni rimosse' : (data.message ?? 'Errore') })
    } catch {
      setMsg({ type: 'err', text: 'Errore di rete' })
    } finally {
      setSaving(false)
    }
  }, [utenteId])

  if (categorieRuolo.length === 0) {
    return (
      <p className="text-xs text-zinc-400">
        Nessuna categoria configurabile per il ruolo &quot;{utenteRuolo}&quot;.
      </p>
    )
  }

  const noneSelected = selectedIds.size === 0
  const pdfCountByCat = new Map(gruppi.map(g => [g.categoria, g.cataloghi.length]))

  return (
    <div className="space-y-3">
      {cataloghiError ? (
        <p className="text-xs text-amber-700">{cataloghiError}</p>
      ) : null}

      {!loaded ? (
        <p className="text-xs text-zinc-400">Caricamento permessi…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 max-h-56 overflow-y-auto">
            {categorieRuolo.map(categoria => {
              const pdfCount = pdfCountByCat.get(categoria) ?? 0
              const hasPdf = pdfCount > 0
              const checked = hasPdf && selectedCategories.has(categoria)
              return (
                <label
                  key={categoria}
                  className={`flex items-center gap-2 text-sm text-zinc-800 min-w-[200px] ${
                    !hasPdf || readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => hasPdf && !readOnly && toggleCategory(categoria)}
                    disabled={readOnly || !hasPdf}
                    className="rounded border-black accent-[#060d41]"
                  />
                  <span>
                    {catLabel(categoria)}
                    <span className="text-zinc-500 text-xs">
                      {hasPdf ? ` (${pdfCount} PDF)` : ' (nessun PDF)'}
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
                disabled={saving || gruppiConPdf.length === 0}
                className="h-9 px-4 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Salvataggio…' : 'Salva categorie'}
              </button>
              {!noneSelected && (
                <button
                  type="button"
                  onClick={handleClearRestrictions}
                  disabled={saving}
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
