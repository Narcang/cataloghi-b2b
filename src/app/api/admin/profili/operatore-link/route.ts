import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function jsonResponse(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
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

  if (!operatore || (operatore.ruolo !== 'agente' && operatore.ruolo !== 'distributore')) {
    return jsonResponse(false, 'L’operatore deve essere un agente o un partner (distributore)', 400)
  }

  if (action === 'add') {
    const { error } = await supabase.from('connessioni_utente_operatore').insert({
      utente_id: utenteId,
      operatore_id: operatoreId,
    })
    if (error) {
      if (error.code === '23505') {
        return jsonResponse(true, 'Associazione già presente', 200)
      }
      console.error('operatore-link add', error)
      return jsonResponse(false, error.message, 500)
    }
    return jsonResponse(true, 'Operatore associato', 200)
  }

  const { error: delErr } = await supabase
    .from('connessioni_utente_operatore')
    .delete()
    .eq('utente_id', utenteId)
    .eq('operatore_id', operatoreId)

  if (delErr) {
    console.error('operatore-link remove', delErr)
    return jsonResponse(false, delErr.message, 500)
  }

  return jsonResponse(true, 'Associazione rimossa', 200)
}
