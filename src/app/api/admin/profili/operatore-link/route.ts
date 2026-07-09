import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function jsonResponse(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

/** Ruoli che possono comparire nella rubrica e ricevere il collegamento reciproco. */
const RUBRICA_ROLES = new Set(['agenzia', 'agente', 'rivenditore', 'distributore', 'studio', 'partner_dipendente'])

function isRubricaRuolo(ruolo: string | null | undefined): boolean {
  return Boolean(ruolo && RUBRICA_ROLES.has(ruolo))
}

type Body = {
  action?: 'add' | 'remove'
  utente_id?: string
  operatore_id?: string
}

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

  const utenteId = String(body.utente_id ?? '').trim()
  const operatoreId = String(body.operatore_id ?? '').trim()
  const action = body.action

  if (!utenteId || !operatoreId || (action !== 'add' && action !== 'remove')) {
    return jsonResponse(false, 'Parametri non validi', 400)
  }

  if (utenteId === operatoreId) {
    return jsonResponse(false, 'Utente e operatore devono essere distinti', 400)
  }

  const { data: utente } = await supabase.from('profili').select('id, ruolo').eq('id', utenteId).maybeSingle()

  if (!utente) {
    return jsonResponse(false, 'Profilo utente non trovato', 404)
  }

  if (utente.ruolo === 'admin') {
    return jsonResponse(false, 'Non associare operatori a un account admin', 400)
  }

  const { data: operatore } = await supabase.from('profili').select('id, ruolo').eq('id', operatoreId).maybeSingle()

  if (!operatore || !isRubricaRuolo(operatore.ruolo)) {
    return jsonResponse(false, 'Il contatto deve essere un agente, un venditore, uno studio o un promoter', 400)
  }

  if (action === 'add') {
    const { error: insErr } = await supabase.from('connessioni_utente_operatore').insert({
      utente_id: utenteId,
      operatore_id: operatoreId,
    })
    const forwardNew = !insErr
    if (insErr && insErr.code !== '23505') {
      console.error('operatore-link add', insErr)
      let msg = insErr.message
      if (msg.includes('permission denied')) {
        msg += ' Esegui su Supabase: supabase_alter_admin_grants_profili_connessioni.sql'
      }
      return jsonResponse(false, msg, 500)
    }

    if (isRubricaRuolo(utente.ruolo) && isRubricaRuolo(operatore.ruolo)) {
      const { error: revErr } = await supabase.from('connessioni_utente_operatore').insert({
        utente_id: operatoreId,
        operatore_id: utenteId,
      })
      if (revErr && revErr.code !== '23505') {
        console.error('operatore-link add reciprocal', revErr)
        if (forwardNew) {
          await supabase.from('connessioni_utente_operatore').delete().eq('utente_id', utenteId).eq('operatore_id', operatoreId)
        }
        let revMsg = revErr.message
        if (revMsg.includes('permission denied')) {
          revMsg += ' Esegui su Supabase: supabase_alter_admin_grants_profili_connessioni.sql'
        }
        return jsonResponse(false, revMsg, 500)
      }
    }

    return jsonResponse(true, insErr?.code === '23505' ? 'Associazione già presente' : 'Contatto associato', 200)
  }

  const { error: delErr } = await supabase
    .from('connessioni_utente_operatore')
    .delete()
    .eq('utente_id', utenteId)
    .eq('operatore_id', operatoreId)

  if (delErr) {
    console.error('operatore-link remove', delErr)
    let msg = delErr.message
    if (msg.includes('permission denied')) {
      msg += ' Esegui su Supabase: supabase_alter_admin_grants_profili_connessioni.sql'
    }
    return jsonResponse(false, msg, 500)
  }

  if (isRubricaRuolo(utente.ruolo) && isRubricaRuolo(operatore.ruolo)) {
    const { error: delRev } = await supabase
      .from('connessioni_utente_operatore')
      .delete()
      .eq('utente_id', operatoreId)
      .eq('operatore_id', utenteId)
    if (delRev) {
      console.error('operatore-link remove reciprocal', delRev)
      return jsonResponse(false, delRev.message, 500)
    }
  }

  return jsonResponse(true, 'Associazione rimossa', 200)
}
