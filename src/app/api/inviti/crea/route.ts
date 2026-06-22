import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { puoInvitare } from '@/lib/inviteHierarchy'

function jsonResponse(ok: boolean, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...data }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)
  }

  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const ruoloInvitante = profilo?.ruolo ?? ''
  if (!ruoloInvitante) {
    return jsonResponse(false, 'Profilo non trovato', 403)
  }

  let body: { ruolo_invitato?: string; multi_uso?: boolean }
  try {
    body = await request.json()
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const ruoloInvitato = String(body.ruolo_invitato ?? '').trim()
  if (!ruoloInvitato) {
    return jsonResponse(false, 'ruolo_invitato obbligatorio', 400)
  }

  if (!puoInvitare(ruoloInvitante, ruoloInvitato)) {
    return jsonResponse(false, `Il ruolo "${ruoloInvitante}" non può invitare "${ruoloInvitato}"`, 403)
  }

  const multiUso = body.multi_uso === true

  const svc = createServiceRoleSupabase()
  if (!svc) {
    return jsonResponse(false, 'Configurazione server incompleta', 500)
  }

  const token = crypto.randomUUID()

  const { error } = await svc
    .from('inviti')
    .insert({
      token,
      creato_da: user.id,
      ruolo_invitato: ruoloInvitato,
      multi_uso: multiUso,
    })

  if (error) {
    console.error('inviti insert', error)
    return jsonResponse(false, 'Errore nella creazione del link', 500)
  }

  const baseUrl = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const link = `${baseUrl}/registrazione?token=${token}`

  return jsonResponse(true, 'Link creato', 200, { link, token })
}
