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
  const statoPubblicazione = String(formData.get('stato_pubblicazione') ?? '')

  if (!catalogoId) {
    return redirectWithMessage(request, 'Catalogo non valido')
  }

  if (statoPubblicazione !== 'bozza' && statoPubblicazione !== 'attivo') {
    return redirectWithMessage(request, 'Stato non valido')
  }

  const { error } = await supabase
    .from('cataloghi')
    .update({ stato_pubblicazione: statoPubblicazione })
    .eq('id', catalogoId)

  if (error) {
    console.error('Catalog status update error:', error)
    return redirectWithMessage(request, `Errore aggiornamento stato: ${error.message}`)
  }

  return redirectWithMessage(
    request,
    statoPubblicazione === 'bozza'
      ? 'Catalogo impostato come bozza/nascosto'
      : 'Catalogo pubblicato'
  )
}
