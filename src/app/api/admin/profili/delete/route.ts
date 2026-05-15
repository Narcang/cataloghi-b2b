import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

function jsonResponse(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

type Body = {
  profilo_id?: string
}

/**
 * Elimina riga `profili` con sessione admin (RLS), poi account Auth con service role se disponibile.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)
  }

  const { data: profiloUtente } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()

  if (profiloUtente?.ruolo !== 'admin') {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const profiloId = String(body.profilo_id ?? '').trim()
  if (!profiloId) {
    return jsonResponse(false, 'profilo_id obbligatorio', 400)
  }

  if (profiloId === user.id) {
    return jsonResponse(false, 'Non puoi eliminare il tuo stesso account da qui', 400)
  }

  const { data: target, error: targetErr } = await supabase.from('profili').select('id, ruolo').eq('id', profiloId).maybeSingle()

  if (targetErr || !target) {
    return jsonResponse(false, 'Profilo non trovato', 404)
  }

  if (target.ruolo === 'admin') {
    return jsonResponse(false, 'Non è consentito eliminare un account amministratore', 400)
  }

  // DELETE su `profili`: usa la sessione admin (RLS "Admin gestisce tutti i profili"), non il service role.
  // Su molti progetti il service_role non ha GRANT DELETE su `profili` → "permission denied for table profili".
  const { data: deletedRows, error: delProfErr } = await supabase.from('profili').delete().eq('id', profiloId).select('id')

  if (delProfErr) {
    console.error('admin profili delete: profili', delProfErr)
    let msg = delProfErr.message
    if (msg.includes('permission denied') && msg.includes('profili')) {
      msg +=
        ' Esegui su Supabase: supabase_alter_admin_grants_profili_connessioni.sql (GRANT su profili).'
    }
    return jsonResponse(false, msg, 500)
  }

  if (!deletedRows?.length) {
    return jsonResponse(false, 'Impossibile eliminare il profilo (nessuna riga aggiornata).', 409)
  }

  const svc = createServiceRoleSupabase()
  if (!svc) {
    return jsonResponse(
      true,
      'Profilo eliminato. Per rimuovere anche l’account da Authentication configura SUPABASE_SERVICE_ROLE_KEY sul server, oppure elimina l’utente da Supabase → Authentication.',
      200
    )
  }

  const { error: authErr } = await svc.auth.admin.deleteUser(profiloId)

  if (authErr) {
    console.error('admin profili delete: auth.admin.deleteUser', authErr)
    return jsonResponse(
      true,
      'Profilo rimosso dal database; verifica in Supabase → Authentication se l’utente va eliminato manualmente.',
      200
    )
  }

  return jsonResponse(true, 'Utente e profilo eliminati definitivamente.', 200)
}
