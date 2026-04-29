import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CATALOG_CATEGORIES } from '@/lib/catalogCategories'

function parseAreeTarget(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function redirectWithMessage(request: NextRequest, message: string) {
  const url = new URL(`/dashboard?message=${encodeURIComponent(message)}`, request.url)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url), { status: 303 })

  const { data: profiloUtente } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  if (profiloUtente?.ruolo !== 'admin') {
    return redirectWithMessage(request, 'Operazione non consentita')
  }

  const formData = await request.formData()
  const titolo = String(formData.get('titolo') ?? '').trim()
  const categoria = String(formData.get('categoria') ?? '').trim()
  const areaGeograficaTargetRaw = String(formData.get('area_geografica_target') ?? '').trim()
  const areeTarget = parseAreeTarget(areaGeograficaTargetRaw)
  const statoPubblicazione = String(formData.get('stato_pubblicazione') ?? 'bozza').trim()
  const filePdf = formData.get('file_pdf')
  const fileCopertina = formData.get('file_copertina')

  if (!titolo || areeTarget.length === 0 || !categoria) {
    return redirectWithMessage(request, 'Titolo, categoria e area sono obbligatori')
  }

  if (!CATALOG_CATEGORIES.includes(categoria as (typeof CATALOG_CATEGORIES)[number])) {
    return redirectWithMessage(request, 'Categoria catalogo non valida')
  }

  if (!(filePdf instanceof File) || filePdf.size === 0) {
    return redirectWithMessage(request, 'Seleziona un file PDF valido')
  }

  const isPdf = filePdf.type === 'application/pdf' || filePdf.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return redirectWithMessage(request, 'Il file deve essere un PDF')
  }

  const fileBuffer = await filePdf.arrayBuffer()
  const sanitizedName = filePdf.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${user.id}/${Date.now()}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('cataloghi')
    .upload(filePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('Catalog PDF upload error:', uploadError)
    return redirectWithMessage(request, 'Errore upload PDF: controlla bucket e permessi')
  }

  let urlImmagine: string | null = null
  if (fileCopertina instanceof File && fileCopertina.size > 0) {
    const isImage = fileCopertina.type.startsWith('image/')
    if (!isImage) {
      return redirectWithMessage(request, 'La copertina deve essere un file immagine')
    }

    const coverBuffer = await fileCopertina.arrayBuffer()
    const sanitizedCoverName = fileCopertina.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const coverPath = `covers/${user.id}/${Date.now()}-${sanitizedCoverName}`

    const { error: coverUploadError } = await supabase.storage
      .from('cataloghi')
      .upload(coverPath, coverBuffer, {
        contentType: fileCopertina.type || 'image/jpeg',
        upsert: false,
      })

    if (coverUploadError) {
      console.error('Catalog cover upload error:', coverUploadError)
      return redirectWithMessage(request, 'Errore upload copertina')
    }

    const { data: coverPublicUrl } = supabase.storage.from('cataloghi').getPublicUrl(coverPath)
    urlImmagine = coverPublicUrl.publicUrl
  }

  const statoValido =
    statoPubblicazione === 'attivo' || statoPubblicazione === 'bozza' ? statoPubblicazione : 'bozza'

  const { error: insertError } = await supabase.from('cataloghi').insert({
    titolo,
    categoria,
    area_geografica_target: areeTarget,
    stato_pubblicazione: statoValido,
    url_file: filePath,
    url_immagine: urlImmagine,
  })

  if (insertError) {
    console.error('Catalog insert error:', insertError)
    if (insertError.message.includes('categoria')) {
      return redirectWithMessage(request, 'DB non aggiornato: esegui script categoria/aree su Supabase')
    }
    if (insertError.message.toLowerCase().includes('row-level security')) {
      return redirectWithMessage(request, 'Permessi DB: verifica policy RLS admin sulla tabella cataloghi')
    }
    return redirectWithMessage(request, `Errore salvataggio catalogo: ${insertError.message}`)
  }

  return redirectWithMessage(request, 'Catalogo creato con successo')
}
