'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildGruppiCategorieConfigurabili,
  categorieConfigurabiliPerRuolo,
  categorieNascoste,
  categoriaVisibilePerUtente,
  idsVisibiliDaWhitelist,
  tuttiIdsAssegnabili,
  whitelistDaIdsVisibili,
  type CatalogoPermessoRow,
} from '@/lib/catalogPermessiUtente'
import { portaleCategoryDisplayLabel } from '@/lib/catalogCategories'

export type CatalogoDisponibile = CatalogoPermessoRow

type Props = {
  utenteId: string
  utenteRuolo: string
  allCataloghi?: CatalogoDisponibile[]
  /** Già noti dalla pagina: niente seconda richiesta. */
  permessiIniziali?: string[]
  permessiPronti?: boolean
  readOnly?: boolean
  /** Il pulsante Salva della scheda profilo persiste anche queste spunte. */
  salvaConProfilo?: boolean
  onRegistraSalva?: (salva: (() => Promise<boolean>) | null) => void
}

const CATEGORY_LABEL: Record<string, string> = {}

function catLabel(cat: string): string {
  return CATEGORY_LABEL[cat] ?? portaleCategoryDisplayLabel(cat)
}

function stessiIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const altri = new Set(b)
  return a.every((id) => altri.has(id))
}

export default function CatalogoPermessiPanel({
  utenteId,
  utenteRuolo,
  allCataloghi = [],
  permessiIniziali,
  permessiPronti = false,
  readOnly = false,
  salvaConProfilo = false,
  onRegistraSalva,
}: Props) {
  const [cataloghi, setCataloghi] = useState<CatalogoPermessoRow[]>(allCataloghi)
  const [cataloghiError, setCataloghiError] = useState<string | null>(null)

  const gruppi = useMemo(
    () => buildGruppiCategorieConfigurabili(cataloghi, utenteRuolo),
    [cataloghi, utenteRuolo],
  )
  const gruppiConPdf = useMemo(() => gruppi.filter(g => g.cataloghi.length > 0), [gruppi])
  const categorieRuolo = useMemo(() => categorieConfigurabiliPerRuolo(utenteRuolo), [utenteRuolo])
  const allAssignableIds = useMemo(() => tuttiIdsAssegnabili(gruppiConPdf), [gruppiConPdf])

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [whitelistLoaded, setWhitelistLoaded] = useState<string[] | null>(
    permessiPronti ? (permessiIniziali ?? []) : null,
  )
  const [cataloghiReady, setCataloghiReady] = useState(allCataloghi.length > 0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const hiddenCategories = useMemo(
    () => categorieNascoste(gruppiConPdf, visibleIds),
    [gruppiConPdf, visibleIds],
  )

  const loaded = whitelistLoaded !== null && (cataloghiReady || allAssignableIds.length === 0)

  useEffect(() => {
    if (allCataloghi.length > 0) {
      setCataloghi(allCataloghi)
      setCataloghiReady(true)
    }
  }, [allCataloghi])

  useEffect(() => {
    if (allCataloghi.length > 0) return
    let cancelled = false
    fetch('/api/admin/catalogo-permessi/cataloghi', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.ok && Array.isArray(data.cataloghi)) {
          setCataloghi(data.cataloghi)
          setCataloghiError(null)
          setCataloghiReady(true)
        } else if (!data.ok) {
          setCataloghiError(data.message ?? 'Errore caricamento cataloghi')
        }
      })
      .catch(() => {
        if (!cancelled) setCataloghiError('Errore di rete nel caricamento cataloghi')
      })
    return () => { cancelled = true }
  }, [allCataloghi.length])

  useEffect(() => {
    if (permessiPronti) {
      setWhitelistLoaded(permessiIniziali ?? [])
      return
    }
    let cancelled = false
    setWhitelistLoaded(null)
    fetch(`/api/admin/catalogo-permessi?utente_id=${encodeURIComponent(utenteId)}`, {
      credentials: 'same-origin',
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.ok) setWhitelistLoaded(Array.isArray(data.catalogo_ids) ? data.catalogo_ids : [])
        else setWhitelistLoaded([])
      })
      .catch(() => {
        if (!cancelled) setWhitelistLoaded([])
      })
    return () => { cancelled = true }
  }, [utenteId, permessiPronti, permessiIniziali])

  useEffect(() => {
    if (whitelistLoaded === null || allAssignableIds.length === 0) return
    setVisibleIds(idsVisibiliDaWhitelist(whitelistLoaded, allAssignableIds))
  }, [whitelistLoaded, allAssignableIds])

  const toggleCategory = useCallback((categoria: string) => {
    setVisibleIds(prev => {
      const next = new Set(prev)
      const gruppo = gruppiConPdf.find(g => g.categoria === categoria)
      if (!gruppo) return next

      const isVisible = categoriaVisibilePerUtente(gruppo, next)
      for (const c of gruppo.cataloghi) {
        if (isVisible) next.delete(c.id)
        else next.add(c.id)
      }
      return next
    })
    setMsg(null)
  }, [gruppiConPdf])

  const persisti = useCallback(async (catalogo_ids: string[]) => {
    const res = await fetch('/api/admin/catalogo-permessi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ utente_id: utenteId, catalogo_ids }),
    })
    const data = await res.json()
    if (data.ok) {
      const saved = Array.isArray(data.catalogo_ids) ? data.catalogo_ids : catalogo_ids
      setWhitelistLoaded(saved)
      setVisibleIds(idsVisibiliDaWhitelist(saved, allAssignableIds))
    }
    return { ok: Boolean(data.ok), message: data.ok ? 'Permessi salvati' : (data.message ?? 'Errore') }
  }, [utenteId, allAssignableIds])

  const salvaSeCambiato = useCallback(async () => {
    if (whitelistLoaded === null) return true
    const catalogo_ids = whitelistDaIdsVisibili(visibleIds, allAssignableIds)
    if (stessiIds(catalogo_ids, whitelistLoaded)) {
      if (!salvaConProfilo) setMsg({ type: 'ok', text: 'Permessi salvati' })
      return true
    }
    setSaving(true)
    setMsg(null)
    try {
      const esito = await persisti(catalogo_ids)
      if (!salvaConProfilo) {
        setMsg({ type: esito.ok ? 'ok' : 'err', text: esito.message })
      }
      return esito.ok
    } catch {
      if (!salvaConProfilo) setMsg({ type: 'err', text: 'Errore di rete' })
      return false
    } finally {
      setSaving(false)
    }
  }, [whitelistLoaded, visibleIds, allAssignableIds, persisti, salvaConProfilo])

  useEffect(() => {
    if (!onRegistraSalva) return
    onRegistraSalva(salvaSeCambiato)
    return () => onRegistraSalva(null)
  }, [onRegistraSalva, salvaSeCambiato])

  const handleSave = useCallback(async () => {
    await salvaSeCambiato()
  }, [salvaSeCambiato])

  const handleResetAllVisible = useCallback(async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/catalogo-permessi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ utente_id: utenteId, catalogo_ids: [] }),
      })
      const data = await res.json()
      if (data.ok) {
        setWhitelistLoaded([])
        setVisibleIds(idsVisibiliDaWhitelist([], allAssignableIds))
      }
      setMsg({ type: data.ok ? 'ok' : 'err', text: data.ok ? 'Tutte le categorie di nuovo visibili' : (data.message ?? 'Errore') })
    } catch {
      setMsg({ type: 'err', text: 'Errore di rete' })
    } finally {
      setSaving(false)
    }
  }, [utenteId, allAssignableIds])

  if (categorieRuolo.length === 0) {
    return (
      <p className="text-xs text-zinc-400">
        Nessuna categoria configurabile per il ruolo &quot;{utenteRuolo}&quot;.
      </p>
    )
  }

  const pdfCountByCat = new Map(gruppi.map(g => [g.categoria, g.cataloghi.length]))
  const hasRestrictions = hiddenCategories.size > 0

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
              const gruppo = gruppiConPdf.find(g => g.categoria === categoria)
              const checked = hasPdf && gruppo
                ? categoriaVisibilePerUtente(gruppo, visibleIds)
                : false
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
            {hasRestrictions
              ? `${hiddenCategories.size} sezioni nascoste per questo utente. Spunta di nuovo per renderle visibili.`
              : 'Tutte le sezioni della dashboard sono visibili. Togli la spunta per nascondere una sezione a questo utente.'}
          </p>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {salvaConProfilo ? null : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || gruppiConPdf.length === 0}
                  className="h-9 px-4 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Salvataggio…' : 'Salva dashboard'}
                </button>
              )}
              {hasRestrictions && (
                <button
                  type="button"
                  onClick={() => {
                    if (salvaConProfilo) {
                      setVisibleIds(new Set(allAssignableIds))
                      setMsg(null)
                      return
                    }
                    void handleResetAllVisible()
                  }}
                  disabled={saving}
                  className="h-9 px-4 rounded-md border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Mostra tutte le sezioni
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
