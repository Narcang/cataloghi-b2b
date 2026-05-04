'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { buildCoverStoragePath, buildPdfStoragePath } from '@/lib/catalogStoragePaths'
import { MAX_CATALOG_COVER_BYTES, MAX_CATALOG_PDF_BYTES } from '@/lib/catalogUploadLimits'
import type { CatalogCategory } from '@/lib/catalogCategories'

type Props = { categories: readonly CatalogCategory[] }

export default function CreateCatalogForm({ categories }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const titolo = String(fd.get('titolo') ?? '').trim()
    const categoria = String(fd.get('categoria') ?? '').trim()
    const area_geografica_target = String(fd.get('area_geografica_target') ?? '').trim()
    const stato_pubblicazione = String(fd.get('stato_pubblicazione') ?? 'bozza').trim()
    const pdfInput = form.querySelector<HTMLInputElement>('input[name="file_pdf"]')
    const coverInput = form.querySelector<HTMLInputElement>('input[name="file_copertina"]')
    const pdfFile = pdfInput?.files?.[0]
    const coverFile = coverInput?.files?.[0]

    if (!titolo || !categoria || !area_geografica_target) {
      setError('Titolo, categoria e area sono obbligatori')
      return
    }
    if (!categories.includes(categoria as CatalogCategory)) {
      setError('Categoria non valida')
      return
    }
    if (!pdfFile || pdfFile.size === 0) {
      setError('Seleziona un file PDF valido')
      return
    }
    if (pdfFile.size > MAX_CATALOG_PDF_BYTES) {
      setError(`Il PDF supera il limite di ${MAX_CATALOG_PDF_BYTES / (1024 * 1024)} MB`)
      return
    }
    const isPdf =
      pdfFile.type === 'application/pdf' || pdfFile.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setError('Il file principale deve essere un PDF')
      return
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

    const pdfPath = buildPdfStoragePath(user.id, pdfFile.name)
    let coverPath: string | null = null
    const uploadedPaths: string[] = []

    try {
      const { error: pdfErr } = await supabase.storage
        .from('cataloghi')
        .upload(pdfPath, pdfFile, { contentType: 'application/pdf', upsert: false })

      if (pdfErr) {
        console.error('PDF upload:', pdfErr)
        setError(`Errore upload PDF: ${pdfErr.message}`)
        return
      }
      uploadedPaths.push(pdfPath)

      if (coverFile && coverFile.size > 0) {
        coverPath = buildCoverStoragePath(user.id, coverFile.name)
        const { error: coverErr } = await supabase.storage.from('cataloghi').upload(coverPath, coverFile, {
          contentType: coverFile.type || 'image/jpeg',
          upsert: false,
        })
        if (coverErr) {
          console.error('Cover upload:', coverErr)
          setError(`Errore upload copertina: ${coverErr.message}`)
          await supabase.storage.from('cataloghi').remove([pdfPath])
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
          area_geografica_target,
          stato_pubblicazione,
          file_pdf_storage_path: pdfPath,
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
          className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 disabled:opacity-60"
        >
          <option value="" disabled>
            Seleziona categoria
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="area_geografica_target"
          className="block text-xs text-zinc-600 font-medium uppercase tracking-wide"
        >
          Area Geografica
        </label>
        <input
          id="area_geografica_target"
          name="area_geografica_target"
          type="text"
          required
          placeholder="Es. Emilia Romagna"
          disabled={submitting}
          className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
        />
        <p className="text-xs text-zinc-600">
          Puoi inserire piu aree separate da virgola (es. Liguria, Lazio oppure Italia, Francia).
        </p>
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
          File PDF (max {MAX_CATALOG_PDF_BYTES / (1024 * 1024)} MB, caricamento diretto su storage)
        </label>
        <input
          id="file_pdf"
          name="file_pdf"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={submitting}
          className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a] disabled:opacity-60"
        />
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
