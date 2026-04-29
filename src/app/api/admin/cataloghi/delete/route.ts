import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function redirectWithMessage(request: NextRequest, message: string) {
  const url = new URL(`/dashboard?message=${encodeURIComponent(message)}`, request.url)
  return NextResponse.redirect(url, { status: 303 })
}

function getStoragePathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/cataloghi/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
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
  if (!catalogoId) return redirectWithMessage(request, 'Catalogo non valido')

  const { data: catalogo, error: catalogoError } = await supabase
    .from('cataloghi')
    .select('id, url_file, url_immagine')
    .eq('id', catalogoId)
    .single()

  if (catalogoError || !catalogo) {
    return redirectWithMessage(request, 'Catalogo non trovato')
  }

  const pathsToDelete: string[] = []
  if (catalogo.url_file) pathsToDelete.push(catalogo.url_file)
  if (catalogo.url_immagine) {
    const extracted = getStoragePathFromPublicUrl(catalogo.url_immagine)
    if (extracted) pathsToDelete.push(extracted)
  }

  if (pathsToDelete.length > 0) {
    const { error: storageRemoveError } = await supabase.storage.from('cataloghi').remove(pathsToDelete)
    if (storageRemoveError) {
      console.error('Catalog storage remove error:', storageRemoveError)
    }
  }

  const { error: deleteError } = await supabase.from('cataloghi').delete().eq('id', catalogoId)
  if (deleteError) {
    console.error('Catalog delete error:', deleteError)
    return redirectWithMessage(request, `Errore eliminazione catalogo: ${deleteError.message}`)
  }

  return redirectWithMessage(request, 'Catalogo eliminato con successo')
}
