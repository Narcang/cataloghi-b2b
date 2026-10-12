import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import {
  findAuthUserByEmail,
  generatePasswordRecoveryLink,
  recoveryRedirectTo,
} from '@/lib/ultimoAccessoUtenti'

function jsonResponse(ok: boolean, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...data }, { status })
}

/** Genera un link per impostare la password, senza cambiare ruolo né associazioni. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)

  const { data: profiloUtente } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  if (profiloUtente?.ruolo !== 'admin' && profiloUtente?.ruolo !== 'manager') {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  let body: { email?: string; password?: string }
  try {
    body = (await request.json()) as { email?: string; password?: string }
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  if (!email.includes('@')) return jsonResponse(false, 'Email non valida', 400)
  if (password && password.length < 6) {
    return jsonResponse(false, 'La password deve contenere almeno 6 caratteri', 400)
  }

  const svc = createServiceRoleSupabase()
  if (!svc) return jsonResponse(false, 'Configurazione server incompleta', 500)

  const authUser = await findAuthUserByEmail(svc, email)
  if (!authUser) {
    return jsonResponse(false, 'Nessun account Authentication con questa email', 404)
  }

  if (password) {
    const { error: pwdErr } = await svc.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
    })
    if (pwdErr) {
      console.error('link-password updateUser', pwdErr.message)
      return jsonResponse(false, pwdErr.message, 500)
    }
    return jsonResponse(
      true,
      'Password impostata. Il ruolo non è stato modificato: può entrare con email e questa password.',
      200,
    )
  }

  await svc.auth.admin.updateUserById(authUser.id, { email_confirm: true })

  const redirectTo = recoveryRedirectTo(request.headers.get('origin'))
  const { link, error } = await generatePasswordRecoveryLink(svc, email, redirectTo)
  if (!link) {
    return jsonResponse(false, error ?? 'Impossibile generare il link', 500)
  }

  return jsonResponse(
    true,
    'Link pronto: copialo e invialo all’utente (WhatsApp o email). Non parte nessuna mail automatica.',
    200,
    { recovery_link: link },
  )
}
