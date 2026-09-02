import { NextRequest, NextResponse } from 'next/server'
import { requireAdminCatalogContext } from '@/lib/adminCatalogRoute'
import {
  buildCoverStoragePath,
  buildPdfStoragePath,
  buildZipStoragePath,
} from '@/lib/catalogStoragePaths'
import {
  MAX_CATALOG_COVER_BYTES,
  MAX_CATALOG_PDF_BYTES,
  MAX_CATALOG_STUDIO_ZIP_BYTES,
} from '@/lib/catalogUploadLimits'

export const runtime = 'nodejs'

function json(ok: boolean, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

/**
 * Upload sul bucket del mercato monitorato (Italia: sessione; Russia: service role).
 * Serve quando l'admin monitora Russia: il client browser parla solo con il progetto IT.
 */
export async function POST(request: NextRequest) {
  const resolved = await requireAdminCatalogContext()
  if (!resolved.ok) {
    const status = resolved.response.status
    const payload = (await resolved.response.json().catch(() => null)) as { message?: string } | null
    return json(false, payload?.message ?? 'Operazione non consentita', status)
  }
  const { dataClient, user } = resolved.ctx

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return json(false, 'Richiesta non valida', 400)
  }

  const file = formData.get('file')
  const kind = String(formData.get('kind') ?? '').trim()

  if (!(file instanceof File) || file.size === 0) {
    return json(false, 'File mancante', 400)
  }

  let path: string
  let contentType: string
  if (kind === 'cover') {
    if (file.size > MAX_CATALOG_COVER_BYTES) {
      return json(false, `La copertina supera il limite di ${MAX_CATALOG_COVER_BYTES / (1024 * 1024)} MB`, 400)
    }
    if (!file.type.startsWith('image/')) {
      return json(false, 'La copertina deve essere un’immagine', 400)
    }
    path = buildCoverStoragePath(user.id, file.name)
    contentType = file.type || 'image/jpeg'
  } else if (kind === 'zip') {
    if (file.size > MAX_CATALOG_STUDIO_ZIP_BYTES) {
      return json(false, `Il file ZIP supera il limite di ${MAX_CATALOG_STUDIO_ZIP_BYTES / (1024 * 1024)} MB`, 400)
    }
    path = buildZipStoragePath(user.id, file.name)
    contentType = 'application/zip'
  } else if (kind === 'pdf') {
    if (file.size > MAX_CATALOG_PDF_BYTES) {
      return json(false, `Il PDF supera il limite di ${MAX_CATALOG_PDF_BYTES / (1024 * 1024)} MB`, 400)
    }
    path = buildPdfStoragePath(user.id, file.name)
    contentType = 'application/pdf'
  } else {
    return json(false, 'Tipo file non valido', 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await dataClient.storage.from('cataloghi').upload(path, buffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    console.error('Admin catalog storage-upload:', error)
    return json(false, `Errore upload file: ${error.message}`, 400)
  }

  return json(true, 'OK', 200, { path })
}
