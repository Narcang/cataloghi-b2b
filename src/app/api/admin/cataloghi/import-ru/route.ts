import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdminCatalogContext } from '@/lib/adminCatalogRoute'
import { isMercatoRuConfigured } from '@/lib/mercato'
import { sanitizeStorageFileName } from '@/lib/catalogStoragePaths'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { createServiceRoleSupabaseForMercato } from '@/utils/supabase/market'

export const runtime = 'nodejs'
export const maxDuration = 60

const PUBLIC_MARKER = '/storage/v1/object/public/cataloghi/'

function json(ok: boolean, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

function storagePathFromField(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('http')) return trimmed
  const idx = trimmed.indexOf(PUBLIC_MARKER)
  if (idx === -1) return null
  try {
    return decodeURIComponent(trimmed.slice(idx + PUBLIC_MARKER.length).split('?')[0] ?? '')
  } catch {
    return trimmed.slice(idx + PUBLIC_MARKER.length).split('?')[0] ?? null
  }
}

function contentTypeForPath(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.zip')) return 'application/zip'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

async function copyStorageObject(
  from: SupabaseClient,
  to: SupabaseClient,
  sourcePath: string,
  destPath: string,
): Promise<string | null> {
  const { data, error } = await from.storage.from('cataloghi').download(sourcePath)
  if (error || !data) return error?.message ?? 'Download fallito'
  const buffer = Buffer.from(await data.arrayBuffer())
  const { error: uploadError } = await to.storage.from('cataloghi').upload(destPath, buffer, {
    contentType: contentTypeForPath(sourcePath),
    upsert: false,
  })
  if (uploadError) return uploadError.message
  return null
}

type RuCatalogo = {
  id: string
  titolo: string
  categoria: string
  url_file: string
  url_immagine: string | null
  ruoli_visibili: string[] | null
  stato_pubblicazione: string | null
  area_geografica_target: string[] | null
}

export async function GET() {
  const resolved = await requireAdminCatalogContext()
  if (!resolved.ok) return resolved.response

  if (!isMercatoRuConfigured()) {
    return json(false, 'Variabili Supabase Russia non configurate su Vercel.', 400)
  }

  const ru = createServiceRoleSupabaseForMercato('ru')
  if (!ru) return json(false, 'Client Russia non disponibile', 500)

  const { count, error } = await ru.from('cataloghi').select('id', { count: 'exact', head: true })
  if (error) return json(false, `Lettura Russia: ${error.message}`, 500)

  return json(true, 'OK', 200, { ruCount: count ?? 0 })
}

export async function POST() {
  const resolved = await requireAdminCatalogContext()
  if (!resolved.ok) return resolved.response
  const { user, authClient } = resolved.ctx

  if (!isMercatoRuConfigured()) {
    return json(false, 'Variabili Supabase Russia non configurate su Vercel.', 400)
  }

  const ru = createServiceRoleSupabaseForMercato('ru')
  if (!ru) return json(false, 'Client Russia non disponibile', 500)

  const itStorage = createServiceRoleSupabase() ?? authClient

  const { data: ruRows, error: ruError } = await ru
    .from('cataloghi')
    .select(
      'id, titolo, categoria, url_file, url_immagine, ruoli_visibili, stato_pubblicazione, area_geografica_target',
    )
    .order('creato_il', { ascending: true })

  if (ruError) return json(false, `Lettura cataloghi Russia: ${ruError.message}`, 500)

  const source = (ruRows ?? []) as RuCatalogo[]
  if (source.length === 0) {
    return json(true, 'Sul progetto Russia non risulta nessun catalogo da copiare.', 200, {
      imported: 0,
      skipped: 0,
      failed: 0,
      ruCount: 0,
    })
  }

  const { data: existingRu, error: existingError } = await authClient
    .from('cataloghi')
    .select('titolo, categoria')
    .eq('lingua', 'ru')

  if (existingError) return json(false, `Lettura Italia: ${existingError.message}`, 500)

  const already = new Set(
    (existingRu ?? []).map((row) => `${String(row.titolo ?? '').trim()}|${String(row.categoria ?? '').trim()}`),
  )

  let imported = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []

  for (const row of source) {
    const key = `${row.titolo.trim()}|${row.categoria.trim()}`
    if (already.has(key)) {
      skipped += 1
      continue
    }

    const filePath = storagePathFromField(row.url_file)
    if (!filePath) {
      failed += 1
      errors.push(`${row.titolo}: percorso file mancante`)
      continue
    }

    const baseName = sanitizeStorageFileName(filePath.split('/').pop() || 'catalogo.pdf')
    const destFile = `${user.id}/imported-ru/${row.id}-${baseName}`
    const copyFileError = await copyStorageObject(ru, itStorage, filePath, destFile)
    if (copyFileError) {
      failed += 1
      errors.push(`${row.titolo}: ${copyFileError}`)
      continue
    }

    let urlImmagine: string | null = null
    const coverPath = storagePathFromField(row.url_immagine)
    if (coverPath) {
      const coverName = sanitizeStorageFileName(coverPath.split('/').pop() || 'cover.jpg')
      const destCover = `covers/${user.id}/imported-ru-${row.id}-${coverName}`
      const copyCoverError = await copyStorageObject(ru, itStorage, coverPath, destCover)
      if (!copyCoverError) {
        urlImmagine = itStorage.storage.from('cataloghi').getPublicUrl(destCover).data.publicUrl
      }
    }

    const stato =
      row.stato_pubblicazione === 'attivo' || row.stato_pubblicazione === 'bozza'
        ? row.stato_pubblicazione
        : 'bozza'

    const { error: insertError } = await authClient.from('cataloghi').insert({
      titolo: row.titolo,
      categoria: row.categoria,
      lingua: 'ru',
      ruoli_visibili: row.ruoli_visibili ?? [],
      area_geografica_target: row.area_geografica_target?.length ? row.area_geografica_target : ['MONDO'],
      stato_pubblicazione: stato,
      url_file: destFile,
      url_immagine: urlImmagine,
    })

    if (insertError) {
      await itStorage.storage.from('cataloghi').remove([destFile])
      failed += 1
      errors.push(`${row.titolo}: ${insertError.message}`)
      continue
    }

    already.add(key)
    imported += 1
  }

  const message =
    imported === 0 && skipped === 0 && failed === 0
      ? 'Sul progetto Russia non risulta nessun catalogo da copiare.'
      : `Import Russia: ${imported} copiati, ${skipped} già presenti, ${failed} errori.`

  return json(true, message, 200, {
    imported,
    skipped,
    failed,
    ruCount: source.length,
    errors: errors.slice(0, 8),
  })
}
