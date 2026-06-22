import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { CATALOG_CATEGORIES } from '@/lib/catalogCategories'
import {
  isValidUserCoverStoragePath,
  isValidUserPdfStoragePath,
  isValidUserZipStoragePath,
} from '@/lib/catalogStoragePaths'
import { MAX_CATALOG_COVER_BYTES } from '@/lib/catalogUploadLimits'
import { isZipDownloadCategory, isZipStoragePath } from '@/lib/catalogFileKind'

function jsonResponse(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

async function assertStorageFileExists(
  supabase: SupabaseClient,
  storagePath: string
): Promise<boolean> {
  const i = storagePath.lastIndexOf('/')
  if (i <= 0) return false
  const folder = storagePath.slice(0, i)
  const fileName = storagePath.slice(i + 1)
  const { data, error } = await supabase.storage.from('cataloghi').list(folder, { limit: 1000 })
  if (error || !data) return false
  return data.some((entry) => entry.name === fileName)
}

type CreateCatalogJsonBody = {
  titolo?: string
  categoria?: string
  /** Ruoli che possono vedere il catalogo (es. ['agente', 'distributore']). */
  ruoli_visibili?: string[]
  stato_pubblicazione?: string
  /** Path oggetto nel bucket `cataloghi` dopo upload client (es. `{userId}/{ts}-file.pdf`). */
  file_pdf_storage_path?: string
  /** Path copertina dopo upload client (es. `covers/{userId}/{ts}-img.jpg`), opzionale. */
  file_copertina_storage_path?: string | null
}

/**
 * Creazione catalogo: PDF (e opzionale copertina) caricati dal client su Supabase Storage;
 * questa route riceve solo metadati + path oggetti già presenti nel bucket.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return jsonResponse(
      false,
      'Richiesta non valida: usa il form aggiornato (Content-Type application/json).',
      415
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)
  }

  const { data: profiloUtente } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  if (profiloUtente?.ruolo !== 'admin') {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  let body: CreateCatalogJsonBody
  try {
    body = (await request.json()) as CreateCatalogJsonBody
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const titolo = String(body.titolo ?? '').trim()
  const categoria = String(body.categoria ?? '').trim()
  const ruoliVisibili = Array.isArray(body.ruoli_visibili)
    ? body.ruoli_visibili.map((r) => String(r).trim()).filter(Boolean)
    : []
  const statoPubblicazione = String(body.stato_pubblicazione ?? 'bozza').trim()
  const filePdfStoragePath = String(body.file_pdf_storage_path ?? '').trim()
  const coverPathRaw = body.file_copertina_storage_path
  const fileCopertinaStoragePath =
    coverPathRaw === null || coverPathRaw === undefined || coverPathRaw === ''
      ? null
      : String(coverPathRaw).trim()

  if (!titolo || !categoria) {
    return jsonResponse(false, 'Titolo e categoria sono obbligatori', 400)
  }
  if (ruoliVisibili.length === 0) {
    return jsonResponse(false, 'Seleziona almeno un ruolo per la visibilità del catalogo', 400)
  }

  if (!CATALOG_CATEGORIES.includes(categoria as (typeof CATALOG_CATEGORIES)[number])) {
    return jsonResponse(false, 'Categoria catalogo non valida', 400)
  }

  if (!filePdfStoragePath) {
    return jsonResponse(false, 'Percorso file catalogo mancante', 400)
  }

  const isZipCat = isZipDownloadCategory(categoria)
  const isStudioZip = isZipCat && isZipStoragePath(filePdfStoragePath)

  if (isZipCat) {
    if (!isZipStoragePath(filePdfStoragePath)) {
      return jsonResponse(false, 'Questa categoria richiede un archivio ZIP', 400)
    }
    if (!isValidUserZipStoragePath(filePdfStoragePath, user.id)) {
      return jsonResponse(false, 'Percorso ZIP non valido o non coerente con l’utente', 400)
    }
  } else {
    if (isZipStoragePath(filePdfStoragePath)) {
      return jsonResponse(false, 'Gli archivi ZIP sono consentiti solo per le categorie File 2D, File 3D e Studio', 400)
    }
    if (!isValidUserPdfStoragePath(filePdfStoragePath, user.id)) {
      return jsonResponse(false, 'Percorso PDF non valido o non coerente con l’utente', 400)
    }
  }

  if (fileCopertinaStoragePath && !isValidUserCoverStoragePath(fileCopertinaStoragePath, user.id)) {
    return jsonResponse(false, 'Percorso copertina non valido o non coerente con l’utente', 400)
  }

  const fileExists = await assertStorageFileExists(supabase, filePdfStoragePath)
  if (!fileExists) {
    return jsonResponse(
      false,
      isStudioZip
        ? 'Il file ZIP non risulta ancora caricato nello storage: riprova dopo l’upload o verifica i permessi del bucket.'
        : 'Il PDF non risulta ancora caricato nello storage: riprova dopo l’upload o verifica i permessi del bucket.',
      400
    )
  }

  if (fileCopertinaStoragePath) {
    const coverExists = await assertStorageFileExists(supabase, fileCopertinaStoragePath)
    if (!coverExists) {
      return jsonResponse(false, 'La copertina non risulta caricata nello storage', 400)
    }
  }

  let urlImmagine: string | null = null
  if (fileCopertinaStoragePath) {
    const { data: coverPublicUrl } = supabase.storage.from('cataloghi').getPublicUrl(fileCopertinaStoragePath)
    urlImmagine = coverPublicUrl.publicUrl
  }

  const statoValido =
    statoPubblicazione === 'attivo' || statoPubblicazione === 'bozza' ? statoPubblicazione : 'bozza'

  const { error: insertError } = await supabase.from('cataloghi').insert({
    titolo,
    categoria,
    ruoli_visibili: ruoliVisibili,
    area_geografica_target: ['MONDO'],
    stato_pubblicazione: statoValido,
    url_file: filePdfStoragePath,
    url_immagine: urlImmagine,
  })

  if (insertError) {
    console.error('Catalog insert error:', insertError)
    const toRemove = [filePdfStoragePath, ...(fileCopertinaStoragePath ? [fileCopertinaStoragePath] : [])]
    await supabase.storage.from('cataloghi').remove(toRemove)

    if (insertError.message.includes('categoria')) {
      return jsonResponse(false, 'DB non aggiornato: esegui script categoria/aree su Supabase', 500)
    }
    if (insertError.message.toLowerCase().includes('row-level security')) {
      return jsonResponse(
        false,
        'Permessi DB: verifica policy RLS admin sulla tabella cataloghi',
        500
      )
    }
    return jsonResponse(false, `Errore salvataggio catalogo: ${insertError.message}`, 500)
  }

  return jsonResponse(true, 'Catalogo creato con successo', 200)
}
