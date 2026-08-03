import { NextRequest, NextResponse } from 'next/server'
import { requireAdminCatalogContext, redirectAdminCatalogMessage } from '@/lib/adminCatalogRoute'

function redirectWithMessage(request: NextRequest, message: string) {
  return redirectAdminCatalogMessage(request, message)
}

export async function POST(request: NextRequest) {
  const resolved = await requireAdminCatalogContext()
  if (!resolved.ok) return resolved.response
  const { dataClient: supabase } = resolved.ctx

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
