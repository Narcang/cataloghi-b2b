import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { canReadRivenditoreSpecializzazioneStorico } from '@/lib/agenziaRivenditoreAccess'
import { SEZIONI_STORICO, type SezioneStorico, type VoceStorico } from '@/lib/profiloSpecializzazioneStorico'

function jsonResponse(ok: boolean, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

function parseVociStorico(value: unknown): VoceStorico[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is VoceStorico =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as VoceStorico).valore === 'string',
  )
}

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

/** Rimuove una voce da uno snapshot storico (admin/manager). */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse(false, 'Non autenticato', 401)
  }

  const { data: profiloUtente } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const ruolo = profiloUtente?.ruolo ?? ''
  if (ruolo !== 'admin' && ruolo !== 'manager') {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  const { searchParams } = new URL(request.url)
  const storicoId = String(searchParams.get('storico_id') ?? '').trim()
  const voceIndexRaw = searchParams.get('voce_index')
  const voceIndex = Number(voceIndexRaw)

  if (!storicoId) {
    return jsonResponse(false, 'storico_id obbligatorio', 400)
  }
  if (!Number.isInteger(voceIndex) || voceIndex < 0) {
    return jsonResponse(false, 'voce_index non valido', 400)
  }

  const svc = createServiceRoleSupabase() ?? supabase

  const { data: row, error: fetchErr } = await svc
    .from('profili_specializzazione_storico')
    .select('id, voci')
    .eq('id', storicoId)
    .maybeSingle()

  if (fetchErr) {
    console.error('storico specializzazione DELETE fetch', fetchErr)
    return jsonResponse(false, fetchErr.message, 500)
  }
  if (!row) {
    return jsonResponse(false, 'Voce storico non trovata', 404)
  }

  const voci = parseVociStorico(row.voci)
  if (voceIndex >= voci.length) {
    return jsonResponse(false, 'Indice voce non valido', 400)
  }

  const vociAggiornate = voci.filter((_, index) => index !== voceIndex)

  if (vociAggiornate.length === 0) {
    const { error: deleteErr } = await svc
      .from('profili_specializzazione_storico')
      .delete()
      .eq('id', storicoId)
    if (deleteErr) {
      console.error('storico specializzazione DELETE row', deleteErr)
      return jsonResponse(false, deleteErr.message, 500)
    }
    return jsonResponse(true, 'Voce eliminata', 200, { rimossaRiga: true })
  }

  const { error: updateErr } = await svc
    .from('profili_specializzazione_storico')
    .update({ voci: vociAggiornate })
    .eq('id', storicoId)

  if (updateErr) {
    console.error('storico specializzazione DELETE update', updateErr)
    return jsonResponse(false, updateErr.message, 500)
  }

  return jsonResponse(true, 'Voce eliminata', 200, { rimossaRiga: false })
}
