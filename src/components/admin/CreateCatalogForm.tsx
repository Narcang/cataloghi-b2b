'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { buildCoverStoragePath, buildPdfStoragePath, buildZipStoragePath } from '@/lib/catalogStoragePaths'
import {
  MAX_CATALOG_COVER_BYTES,
  MAX_CATALOG_PDF_BYTES,
  MAX_CATALOG_STUDIO_ZIP_BYTES,
} from '@/lib/catalogUploadLimits'
import { type CatalogCategory } from '@/lib/catalogCategories'

const CATEGORY_DISPLAY_LABEL: Partial<Record<CatalogCategory, string>> = {
  Scontistiche: 'Merchandising',
}

function categoryDisplayLabel(cat: CatalogCategory): string {
  return CATEGORY_DISPLAY_LABEL[cat] ?? cat
}
import { isZipDownloadCategory } from '@/lib/catalogFileKind'
import { RUOLI_CATALOGO, RUOLI_CATALOGO_DEFAULT, type RuoloCatalogo } from '@/lib/catalogRoles'

type Props = { categories: readonly CatalogCategory[] }

export default function CreateCatalogForm({ categories }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categoriaSelezionata, setCategoriaSelezionata] = useState('')
  const [ruoliSelezionati, setRuoliSelezionati] = useState<RuoloCatalogo[]>(RUOLI_CATALOGO_DEFAULT)

  const isZipCategory = isZipDownloadCategory(categoriaSelezionata)
  const maxMainFileBytes = isZipCategory ? MAX_CATALOG_STUDIO_ZIP_BYTES : MAX_CATALOG_PDF_BYTES
  const maxMainFileMb = maxMainFileBytes / (1024 * 1024)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const titolo = String(fd.get('titolo') ?? '').trim()
    const categoria = String(fd.get('categoria') ?? '').trim()
    const stato_pubblicazione = String(fd.get('stato_pubblicazione') ?? 'bozza').trim()
    const mainInput = form.querySelector<HTMLInputElement>('input[name="file_pdf"]')
    const coverInput = form.querySelector<HTMLInputElement>('input[name="file_copertina"]')
    const mainFile = mainInput?.files?.[0]
    const coverFile = coverInput?.files?.[0]
    const studioZip = isZipDownloadCategory(categoria)

    if (!titolo || !categoria) {
      setError('Titolo e categoria sono obbligatori')
      return
    }
    if (ruoliSelezionati.length === 0) {
      setError('Seleziona almeno un ruolo che può vedere questo catalogo')
      return
    }
    if (!categories.includes(categoria as CatalogCategory)) {
      setError('Categoria non valida')
      return
    }
    if (!mainFile || mainFile.size === 0) {
      setError(studioZip ? 'Seleziona un file ZIP valido' : 'Seleziona un file PDF valido')
      return
    }
    if (mainFile.size > maxMainFileBytes) {
      setError(
        studioZip
          ? `Il file ZIP supera il limite di ${maxMainFileMb} MB`
          : `Il PDF supera il limite di ${maxMainFileMb} MB`,
      )
      return
    }

    if (studioZip) {
      const isZip =
        mainFile.type === 'application/zip' ||
        mainFile.type === 'application/x-zip-compressed' ||
        mainFile.name.toLowerCase().endsWith('.zip')
      if (!isZip) {
        setError('Per questa categoria il file principale deve essere un archivio ZIP')
        return
      }
    } else {
      const isPdf =
        mainFile.type === 'application/pdf' || mainFile.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        setError('Il file principale deve essere un PDF')
        return
      }
    }

    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > MAX_CATALOG_COVER_BYTES) {
        setError(`La copertina supera il limite di ${MAX_CATALOG_COVER_BYTES / (1024 * 1024)} MB`)
        return
      }
      if (!coverFile.type.startsWith('image/')) {
        setError('La copertina deve essere un’immagine')
        return
      }
    }

    setSubmitting(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSubmitting(false)
      setError('Sessione non valida: effettua di nuovo l’accesso')
      return
    }

    const mainPath = studioZip
      ? buildZipStoragePath(user.id, mainFile.name)
      : buildPdfStoragePath(user.id, mainFile.name)
    let coverPath: string | null = null
    const uploadedPaths: string[] = []

    try {
      const { error: mainErr } = await supabase.storage.from('cataloghi').upload(mainPath, mainFile, {
        contentType: studioZip ? 'application/zip' : 'application/pdf',
        upsert: false,
      })

      if (mainErr) {
        console.error('Catalog file upload:', mainErr)
        setError(`Errore upload file: ${mainErr.message}`)
        return
      }
      uploadedPaths.push(mainPath)

      if (coverFile && coverFile.size > 0) {
        coverPath = buildCoverStoragePath(user.id, coverFile.name)
        const { error: coverErr } = await supabase.storage.from('cataloghi').upload(coverPath, coverFile, {
          contentType: coverFile.type || 'image/jpeg',
          upsert: false,
        })
        if (coverErr) {
          console.error('Cover upload:', coverErr)
          setError(`Errore upload copertina: ${coverErr.message}`)
          await supabase.storage.from('cataloghi').remove([mainPath])
          return
        }
        uploadedPaths.push(coverPath)
      }

      const res = await fetch('/api/admin/cataloghi/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          titolo,
          categoria,
          ruoli_visibili: ruoliSelezionati,
          stato_pubblicazione,
          file_pdf_storage_path: mainPath,
          file_copertina_storage_path: coverPath,
        }),
      })

      const payload = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      const message = payload?.message ?? 'Risposta non valida dal server'

      if (!res.ok || !payload?.ok) {
        await supabase.storage.from('cataloghi').remove(uploadedPaths)
        setError(message)
        return
      }

      router.push(`/dashboard?message=${encodeURIComponent(message)}`)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {error ? (
        <div className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="titolo" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
          Titolo Catalogo
        </label>
        <input
          id="titolo"
          name="titolo"
          type="text"
          required
          disabled={submitting}
          className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="categoria" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
          Categoria
        </label>
        <select
          id="categoria"
          name="categoria"
          required
          defaultValue=""
          disabled={submitting}
          onChange={(e) => setCategoriaSelezionata(e.target.value)}
          className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 disabled:opacity-60"
        >
          <option value="" disabled>
            Seleziona categoria
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {categoryDisplayLabel(cat)}
            </option>
          ))}
        </select>
        {isZipCategory ? (
          <p className="text-xs text-zinc-600">
            Carica un archivio ZIP (max {maxMainFileMb} MB) scaricabile dagli utenti autorizzati.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <p className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
          Chi può vedere questo catalogo
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {RUOLI_CATALOGO.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-zinc-900 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={submitting}
                checked={ruoliSelezionati.includes(r.value)}
                onChange={(e) =>
                  setRuoliSelezionati((prev) =>
                    e.target.checked ? [...prev, r.value] : prev.filter((v) => v !== r.value),
                  )
                }
                className="rounded border-black accent-[#060d41]"
              />
              {r.label}
            </label>
          ))}
        </div>
        {ruoliSelezionati.length === 0 ? (
          <p className="text-xs text-red-600">Seleziona almeno un ruolo.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="stato_pubblicazione"
          className="block text-xs text-zinc-600 font-medium uppercase tracking-wide"
        >
          Stato
        </label>
        <select
          id="stato_pubblicazione"
          name="stato_pubblicazione"
          defaultValue="bozza"
          disabled={submitting}
          className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 disabled:opacity-60"
        >
          <option value="bozza">Bozza</option>
          <option value="attivo">Attivo</option>
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="file_pdf" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
          {isZipCategory
            ? `File ZIP (max ${maxMainFileMb} MB, caricamento diretto su storage)`
            : `File PDF (max ${maxMainFileMb} MB, caricamento diretto su storage)`}
        </label>
        <input
          key={isZipCategory ? 'catalog-file-zip' : 'catalog-file-pdf'}
          id="file_pdf"
          name="file_pdf"
          type="file"
          accept={
            isZipCategory
              ? '.zip,application/zip,application/x-zip-compressed,application/octet-stream'
              : '.pdf,application/pdf'
          }
          required
          disabled={submitting}
          className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a] disabled:opacity-60"
        />
        {isZipCategory ? (
          <p className="text-xs text-zinc-500">
            Nel dialogo di Windows, se i file ZIP non compaiono, imposta il filtro su &quot;Tutti i file
            (*.*)&quot;.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="file_copertina_nuovo" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
          Copertina (immagine A4 verticale, opzionale) — max {MAX_CATALOG_COVER_BYTES / (1024 * 1024)} MB
        </label>
        <input
          id="file_copertina_nuovo"
          name="file_copertina"
          type="file"
          accept="image/*"
          disabled={submitting}
          className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a] disabled:opacity-60"
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-md bg-[#060d41] text-white px-5 text-sm font-semibold hover:bg-[#0a155a] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Caricamento…' : 'Crea Catalogo'}
        </button>
      </div>
    </form>
  )
}
