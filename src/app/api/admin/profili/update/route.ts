import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const RUOLI_OK = new Set(['admin', 'agente', 'fornitore', 'distributore', 'free', 'studio'])

function jsonResponse(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

type Body = {
  profilo_id?: string
  nome_completo?: string | null
  email?: string | null
  telefono?: string | null
  societa?: string | null
  area_geografica?: string | null
  ruolo?: string | null
  registrazione_approvata?: boolean | null
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

  const profiloId = String(body.profilo_id ?? '').trim()
  if (!profiloId) {
    return jsonResponse(false, 'profilo_id obbligatorio', 400)
  }

  if (profiloId === user.id) {
    return jsonResponse(false, 'Non puoi modificare il tuo stesso profilo da questo modulo', 400)
  }

  const patch: Record<string, unknown> = {}

  if (body.nome_completo !== undefined) {
    patch.nome_completo = body.nome_completo === null ? null : String(body.nome_completo).trim() || null
  }
  if (body.email !== undefined) {
    patch.email = body.email === null ? null : String(body.email).trim() || null
  }
  if (body.telefono !== undefined) {
    patch.telefono = body.telefono === null ? null : String(body.telefono).trim() || null
  }
  if (body.societa !== undefined) {
    patch.societa = body.societa === null ? null : String(body.societa).trim() || null
  }
  if (body.area_geografica !== undefined) {
    const a = body.area_geografica === null ? null : String(body.area_geografica).trim()
    patch.area_geografica = a === '' ? null : a
  }
  if (body.ruolo !== undefined && body.ruolo !== null) {
    const r = String(body.ruolo).trim()
    if (!RUOLI_OK.has(r)) {
      return jsonResponse(false, 'Ruolo non valido', 400)
    }
    patch.ruolo = r
  }
  if (body.registrazione_approvata !== undefined && body.registrazione_approvata !== null) {
    patch.registrazione_approvata = Boolean(body.registrazione_approvata)
  }

  if (Object.keys(patch).length === 0) {
    return jsonResponse(false, 'Nessun campo da aggiornare', 400)
  }

  const { error } = await supabase.from('profili').update(patch).eq('id', profiloId)

  if (error) {
    console.error('admin profili update', error)
    return jsonResponse(false, error.message.includes('check') ? 'Dati non validi (vincoli DB)' : error.message, 500)
  }

  return jsonResponse(true, 'Profilo aggiornato', 200)
}
