import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { loadProfiloSpecializzazioneOpzioniRows } from '@/lib/loadProfiloSpecializzazioneOpzioni'
import {
  buildOpzioniSpecializzazioneMap,
  isOpzioneCategoria,
  normalizeOpzioneEtichetta,
  OPZIONE_CATEGORIA_BASE,
  type OpzioneCategoria,
} from '@/lib/profiloSpecializzazioneOpzioni'

function jsonResponse(ok: boolean, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

export async function GET() {
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
  if (!['admin', 'manager', 'agenzia', 'agente'].includes(ruolo)) {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  const svc = createServiceRoleSupabase() ?? supabase
  const rows = await loadProfiloSpecializzazioneOpzioniRows(svc)
  const opzioni = buildOpzioniSpecializzazioneMap(rows)

  return NextResponse.json({ ok: true, opzioni }, { status: 200 })
}

type Body = {
  categoria?: string
  etichetta?: string
  azione?: 'aggiungi' | 'rimuovi'
}

export async function POST(request: NextRequest) {
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

  if (profiloUtente?.ruolo !== 'admin') {
    return jsonResponse(false, 'Operazione riservata agli admin', 403)
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const categoria = String(body.categoria ?? '').trim()
  const etichetta = normalizeOpzioneEtichetta(body.etichetta)
  const azione = body.azione

  if (!isOpzioneCategoria(categoria)) {
    return jsonResponse(false, 'Categoria non valida', 400)
  }
  if (!etichetta) {
    return jsonResponse(false, 'Etichetta obbligatoria', 400)
  }
  if (azione !== 'aggiungi' && azione !== 'rimuovi') {
    return jsonResponse(false, 'Azione non valida', 400)
  }

  const svc = createServiceRoleSupabase() ?? supabase
  const baseSet = new Set(OPZIONE_CATEGORIA_BASE[categoria as OpzioneCategoria])

  if (azione === 'aggiungi') {
    const { data: existing } = await svc
      .from('profili_specializzazione_opzioni')
      .select('tipo')
      .eq('categoria', categoria)
      .eq('etichetta', etichetta)
      .maybeSingle()

    if (existing?.tipo === 'nascosta') {
      const { error } = await svc
        .from('profili_specializzazione_opzioni')
        .delete()
        .eq('categoria', categoria)
        .eq('etichetta', etichetta)
      if (error) {
        console.error('opzioni POST ripristina base', error)
        return jsonResponse(false, error.message, 500)
      }
    } else if (existing?.tipo === 'extra') {
      return jsonResponse(false, 'Voce già presente', 409)
    } else if (baseSet.has(etichetta)) {
      return jsonResponse(false, 'Voce già presente nell\'elenco predefinito', 409)
    } else {
      const { error } = await svc.from('profili_specializzazione_opzioni').insert({
        categoria,
        etichetta,
        tipo: 'extra',
        creato_da: user.id,
      })
      if (error) {
        console.error('opzioni POST aggiungi', error)
        return jsonResponse(false, error.message, 500)
      }
    }
  } else {
    const { data: existing } = await svc
      .from('profili_specializzazione_opzioni')
      .select('tipo')
      .eq('categoria', categoria)
      .eq('etichetta', etichetta)
      .maybeSingle()

    if (existing?.tipo === 'extra') {
      const { error } = await svc
        .from('profili_specializzazione_opzioni')
        .delete()
        .eq('categoria', categoria)
        .eq('etichetta', etichetta)
      if (error) {
        console.error('opzioni POST rimuovi extra', error)
        return jsonResponse(false, error.message, 500)
      }
    } else if (baseSet.has(etichetta)) {
      if (existing?.tipo === 'nascosta') {
        return jsonResponse(true, 'Voce già rimossa', 200)
      }
      const { error } = await svc.from('profili_specializzazione_opzioni').insert({
        categoria,
        etichetta,
        tipo: 'nascosta',
        creato_da: user.id,
      })
      if (error) {
        console.error('opzioni POST nascondi base', error)
        return jsonResponse(false, error.message, 500)
      }
    } else {
      return jsonResponse(false, 'Voce non trovata', 404)
    }
  }

  const rows = await loadProfiloSpecializzazioneOpzioniRows(svc)
  const opzioni = buildOpzioniSpecializzazioneMap(rows)
  return jsonResponse(true, azione === 'aggiungi' ? 'Voce aggiunta' : 'Voce rimossa', 200, { opzioni })
}
