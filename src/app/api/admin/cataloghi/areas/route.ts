import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function redirectWithMessage(request: NextRequest, message: string) {
  const url = new URL(`/dashboard?message=${encodeURIComponent(message)}`, request.url)
  return NextResponse.redirect(url, { status: 303 })
}

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
  const areeRaw = String(formData.get('aree_geografiche') ?? '').trim()
  const aree = parseAreeTarget(areeRaw)

  if (!catalogoId) return redirectWithMessage(request, 'Catalogo non valido')
  if (aree.length === 0) return redirectWithMessage(request, 'Inserisci almeno una area geografica valida')

  const { error } = await supabase
    .from('cataloghi')
    .update({ area_geografica_target: aree })
    .eq('id', catalogoId)

  if (error) {
    console.error('Catalog areas update error:', error)
    return redirectWithMessage(request, `Errore aggiornamento aree: ${error.message}`)
  }

  return redirectWithMessage(request, 'Aree geografiche catalogo aggiornate')
}
