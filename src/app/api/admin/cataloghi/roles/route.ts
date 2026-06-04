import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { RUOLI_CATALOGO } from '@/lib/catalogRoles'

const RUOLI_VALIDI = new Set<string>(RUOLI_CATALOGO.map((r) => r.value))


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
  const catalogoId = String(formData.get('catalogo_id') ?? '').trim()
  const ruoliRaw = formData.getAll('ruoli_visibili').map((v) => String(v).trim())
  const ruoliVisibili = ruoliRaw.filter((r) => RUOLI_VALIDI.has(r))

  if (!catalogoId) return redirectWithMessage(request, 'Catalogo non valido')
  if (ruoliVisibili.length === 0) {
    return redirectWithMessage(request, 'Seleziona almeno un ruolo per la visibilità del catalogo')
  }

  const { error } = await supabase
    .from('cataloghi')
    .update({ ruoli_visibili: ruoliVisibili })
    .eq('id', catalogoId)

  if (error) {
    console.error('Catalog roles update error:', error)
    return redirectWithMessage(request, `Errore aggiornamento ruoli: ${error.message}`)
  }

  return redirectWithMessage(request, 'Visibilità catalogo aggiornata')
}
