import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { canReadRivenditoreSpecializzazioneStorico } from '@/lib/agenziaRivenditoreAccess'
import { SEZIONI_STORICO, type SezioneStorico } from '@/lib/profiloSpecializzazioneStorico'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Non autenticato' }, { status: 401 })
  }

  const { data: profiloUtente } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const ruolo = profiloUtente?.ruolo ?? ''
  const isPrivileged =
    ruolo === 'admin' ||
    ruolo === 'manager' ||
    ruolo === 'agenzia' ||
    ruolo === 'agente'

  if (!isPrivileged) {
    return NextResponse.json({ ok: false, message: 'Operazione non consentita' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const profiloId = String(searchParams.get('profilo_id') ?? '').trim()
  const sezione = String(searchParams.get('sezione') ?? '').trim() as SezioneStorico

  if (!profiloId) {
    return NextResponse.json({ ok: false, message: 'profilo_id obbligatorio' }, { status: 400 })
  }
  if (!SEZIONI_STORICO.includes(sezione)) {
    return NextResponse.json({ ok: false, message: 'Sezione non valida' }, { status: 400 })
  }

  const svc = createServiceRoleSupabase() ?? supabase

  if (ruolo === 'agenzia' || ruolo === 'agente') {
    if (sezione !== 'espositori' && sezione !== 'box') {
      return NextResponse.json({ ok: false, message: 'Sezione non consentita' }, { status: 403 })
    }
    const allowed = await canReadRivenditoreSpecializzazioneStorico(svc, ruolo, user.id, profiloId)
    if (!allowed) {
      return NextResponse.json({ ok: false, message: 'Rivenditore non associato' }, { status: 403 })
    }
  }

  const { data, error } = await svc
    .from('profili_specializzazione_storico')
    .select('id, sezione, voci, aggiornato_il_precedente, creato_il')
    .eq('profilo_id', profiloId)
    .eq('sezione', sezione)
    .order('creato_il', { ascending: false })
    .limit(100)

  if (error) {
    console.error('storico specializzazione GET', error)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, storico: data ?? [] }, { status: 200 })
}
