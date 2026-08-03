import { NextRequest, NextResponse } from 'next/server'
import { RUOLI_CATALOGO } from '@/lib/catalogRoles'
import { requireAdminCatalogContext, redirectAdminCatalogMessage } from '@/lib/adminCatalogRoute'

const RUOLI_VALIDI = new Set<string>(RUOLI_CATALOGO.map((r) => r.value))


function redirectWithMessage(request: NextRequest, message: string) {
  return redirectAdminCatalogMessage(request, message)
}

export async function POST(request: NextRequest) {
  const resolved = await requireAdminCatalogContext()
  if (!resolved.ok) return resolved.response
  const { dataClient: supabase } = resolved.ctx

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
