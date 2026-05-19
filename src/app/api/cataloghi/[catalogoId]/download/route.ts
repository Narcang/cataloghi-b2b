import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCatalogAccessDenial } from '@/lib/catalogAccess'
import { downloadFileNameFromCatalog, isStudioZipCatalog } from '@/lib/catalogFileKind'

export async function GET(
  _request: Request,
  context: { params: Promise<{ catalogoId: string }> },
) {
  const { catalogoId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: catalogo, error } = await supabase
    .from('cataloghi')
    .select('id, titolo, categoria, url_file, stato_pubblicazione')
    .eq('id', catalogoId)
    .maybeSingle()

  if (error) {
    console.error('Catalog download fetch error:', error)
    return NextResponse.json({ message: 'Errore nel recupero del catalogo' }, { status: 500 })
  }

  let ruolo: string | null = null
  if (user) {
    const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).maybeSingle()
    ruolo = profilo?.ruolo ?? 'free'
  }

  const denial = getCatalogAccessDenial(catalogo, {
    isAuthenticated: Boolean(user),
    ruolo,
  })
  if (denial) {
    return NextResponse.json({ message: denial.message }, { status: denial.status })
  }

  if (!catalogo?.url_file) {
    return NextResponse.json({ message: 'File non disponibile' }, { status: 404 })
  }

  if (!isStudioZipCatalog(catalogo.categoria, catalogo.url_file)) {
    return NextResponse.json(
      { message: 'Questo catalogo non è scaricabile come archivio ZIP' },
      { status: 400 },
    )
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from('cataloghi')
    .download(catalogo.url_file)

  if (downloadError || !fileData) {
    console.error('Catalog ZIP download error:', downloadError)
    return NextResponse.json({ message: 'Impossibile scaricare il file' }, { status: 502 })
  }

  const fileName = downloadFileNameFromCatalog(catalogo.titolo, catalogo.url_file)
  const buffer = await fileData.arrayBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
