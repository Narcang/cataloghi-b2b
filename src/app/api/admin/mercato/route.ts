import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import {
  DEFAULT_MERCATO,
  isMercato,
  isMercatoRuConfigured,
  MERCATO_COOKIE,
  MERCATO_LABEL,
  type Mercato,
} from '@/lib/mercato'
import { getAdminMercato } from '@/lib/mercatoServer'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function json(ok: boolean, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

/** GET: mercato attivo + disponibilità versione RU. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return json(false, 'Non autenticato', 401)

  const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  if (profilo?.ruolo !== 'admin') return json(false, 'Operazione non consentita', 403)

  const mercato = await getAdminMercato()
  return json(true, 'OK', 200, {
    mercato,
    label: MERCATO_LABEL[mercato],
    ruConfigured: isMercatoRuConfigured(),
  })
}

/** POST: imposta mercato da monitorare (solo admin). Body: { mercato: "it" | "ru" } */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return json(false, 'Non autenticato', 401)

  const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  if (profilo?.ruolo !== 'admin') return json(false, 'Operazione non consentita', 403)

  const body = (await request.json().catch(() => null)) as { mercato?: string } | null
  const nextMercato: Mercato = isMercato(body?.mercato) ? body.mercato : DEFAULT_MERCATO

  if (nextMercato === 'ru' && !isMercatoRuConfigured()) {
    return json(false, 'Versione Russia non configurata (env Supabase RU mancanti)', 400)
  }

  const cookieStore = await cookies()
  cookieStore.set(MERCATO_COOKIE, nextMercato, {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  return json(true, 'Mercato aggiornato', 200, {
    mercato: nextMercato,
    label: MERCATO_LABEL[nextMercato],
  })
}
