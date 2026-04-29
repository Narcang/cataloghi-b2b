import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
  const catalogoId = String(formData.get('catalogo_id') ?? '')
  const rimuoviCopertina = String(formData.get('rimuovi_copertina') ?? '') === 'on'
  const fileCopertina = formData.get('file_copertina')

  if (!catalogoId) return redirectWithMessage(request, 'Catalogo non valido')

  let urlImmagineNuova: string | null | undefined = undefined

  if (rimuoviCopertina) {
    urlImmagineNuova = null
  } else if (fileCopertina instanceof File && fileCopertina.size > 0) {
    const isImage = fileCopertina.type.startsWith('image/')
    if (!isImage) {
      return redirectWithMessage(request, 'La copertina deve essere un file immagine')
    }

    const coverBuffer = await fileCopertina.arrayBuffer()
    const sanitizedName = fileCopertina.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const coverPath = `covers/${catalogoId}/${Date.now()}-${sanitizedName}`

    const { error: coverUploadError } = await supabase.storage.from('cataloghi').upload(coverPath, coverBuffer, {
      contentType: fileCopertina.type || 'image/jpeg',
      upsert: false,
    })

    if (coverUploadError) {
      console.error('Catalog cover upload error:', coverUploadError)
      return redirectWithMessage(request, 'Errore upload copertina')
    }

    const { data: coverPublicUrl } = supabase.storage.from('cataloghi').getPublicUrl(coverPath)
    urlImmagineNuova = coverPublicUrl.publicUrl
  }

  if (urlImmagineNuova === undefined) {
    return redirectWithMessage(request, 'Seleziona un file immagine o rimuovi la copertina')
  }

  const { error } = await supabase.from('cataloghi').update({ url_immagine: urlImmagineNuova }).eq('id', catalogoId)
  if (error) {
    console.error('Catalog cover update error:', error)
    if (error.message.toLowerCase().includes('row-level security')) {
      return redirectWithMessage(request, 'Permessi DB: verifica policy RLS admin su tabella cataloghi')
    }
    return redirectWithMessage(request, `Errore aggiornamento copertina: ${error.message}`)
  }

  return redirectWithMessage(request, 'Copertina catalogo aggiornata')
}
