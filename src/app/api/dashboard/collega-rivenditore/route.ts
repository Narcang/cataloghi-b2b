import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

function json(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

/** Il back-office collega un rivenditore o una sede studio della propria agenzia a un agente, oppure lo riporta sull'agenzia. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return json(false, 'Sessione scaduta', 401)

  const { data: caller } = await supabase
    .from('profili')
    .select('ruolo, invitato_da')
    .eq('id', user.id)
    .maybeSingle()
  if (caller?.ruolo !== 'back_office') return json(false, 'Operazione non consentita', 403)

  let body: { profilo_id?: string; agente_id?: string | null }
  try {
    body = (await request.json()) as { profilo_id?: string; agente_id?: string | null }
  } catch {
    return json(false, 'JSON non valido', 400)
  }

  const profiloId = String(body.profilo_id ?? '').trim()
  const agenteId = String(body.agente_id ?? '').trim()
  if (!profiloId) return json(false, 'Profilo mancante', 400)

  const svc = createServiceRoleSupabase()
  if (!svc) return json(false, 'Configurazione server incompleta', 500)

  const agenziaId = caller.invitato_da
  if (!agenziaId) return json(false, 'Agenzia non trovata', 400)
  const { data: agenzia } = await svc.from('profili').select('id, ruolo').eq('id', agenziaId).maybeSingle()
  if (agenzia?.ruolo !== 'agenzia') return json(false, 'Agenzia non trovata', 400)

  const { data: target } = await svc
    .from('profili')
    .select('id, ruolo, invitato_da')
    .eq('id', profiloId)
    .maybeSingle()
  if (target?.ruolo !== 'rivenditore' && target?.ruolo !== 'studio') {
    return json(false, 'Profilo non valido', 400)
  }

  const { data: agenti } = await svc
    .from('profili')
    .select('id, ruolo, invitato_da')
    .eq('ruolo', 'agente')
    .limit(500)
  const agentiAgenzia = new Set(
    (agenti ?? [])
      .filter((p) => p.invitato_da === agenziaId)
      .map((p) => p.id),
  )
  for (const p of agenti ?? []) {
    if (p.invitato_da && agentiAgenzia.has(p.invitato_da)) agentiAgenzia.add(p.id)
  }

  const parentOk =
    target.invitato_da === agenziaId ||
    (target.invitato_da != null && agentiAgenzia.has(target.invitato_da))
  if (!parentOk) return json(false, 'Questo profilo non è della tua agenzia', 403)

  const nuovoParent = agenteId || agenziaId
  if (agenteId && !agentiAgenzia.has(agenteId)) {
    return json(false, 'Agente non trovato nella tua agenzia', 400)
  }

  const { error } = await svc.from('profili').update({ invitato_da: nuovoParent }).eq('id', profiloId)
  if (error) return json(false, error.message, 500)
  return json(true, 'Collegamento aggiornato', 200)
}
