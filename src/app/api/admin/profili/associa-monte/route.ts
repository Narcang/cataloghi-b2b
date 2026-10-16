import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { diffAssociazioneMonte } from '@/lib/associazioneMonte'
import { propagaAssociazioneSede } from '@/lib/propagaSeguitoSede'
import type { ProfiloGerarchiaRow } from '@/lib/userHierarchy'
import type { SupabaseClient } from '@supabase/supabase-js'

function jsonResponse(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

async function scollega(db: SupabaseClient, a: string, b: string) {
  const { error: uno } = await db.from('connessioni_utente_operatore').delete().eq('utente_id', a).eq('operatore_id', b)
  if (uno) return uno
  const { error: due } = await db.from('connessioni_utente_operatore').delete().eq('utente_id', b).eq('operatore_id', a)
  return due
}

async function collega(db: SupabaseClient, a: string, b: string) {
  const { error } = await db.from('connessioni_utente_operatore').upsert(
    [
      { utente_id: a, operatore_id: b },
      { utente_id: b, operatore_id: a },
    ],
    { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
  )
  return error
}

type Body = {
  profilo_id?: string
  sede_id?: string | null
  persona_id?: string | null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)

  const { data: profiloUtente } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  const callerRuolo = profiloUtente?.ruolo ?? ''
  if (callerRuolo !== 'admin' && callerRuolo !== 'manager') {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  const serviceRole = callerRuolo === 'manager' ? createServiceRoleSupabase() : null
  if (callerRuolo === 'manager' && !serviceRole) {
    return jsonResponse(false, 'Configurazione server incompleta', 500)
  }
  const db = serviceRole ?? supabase

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const profiloId = String(body.profilo_id ?? '').trim()
  const sedeId = String(body.sede_id ?? '').trim() || null
  const personaId = String(body.persona_id ?? '').trim() || null
  if (!profiloId) return jsonResponse(false, 'Profilo mancante', 400)

  const [{ data: profili }, { data: links }] = await Promise.all([
    db
      .from('profili')
      .select('id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata, seguito_da')
      .neq('ruolo', 'free')
      .limit(2000),
    db.from('connessioni_utente_operatore').select('utente_id, operatore_id').limit(2000),
  ])

  const rows = (profili ?? []) as ProfiloGerarchiaRow[]
  const linkRows = (links ?? []) as { utente_id: string; operatore_id: string }[]
  const profilo = rows.find((p) => p.id === profiloId)
  if (!profilo) return jsonResponse(false, 'Profilo non trovato', 404)

  const piano = diffAssociazioneMonte(profilo, rows, linkRows, sedeId, personaId)
  if (!piano.ok) return jsonResponse(false, piano.message, 400)
  const diff = piano.diff
  const vuoto =
    diff.rimuoviSedi.length === 0 &&
    diff.rimuoviPersone.length === 0 &&
    !diff.aggiungiSede &&
    !diff.aggiungiPersona &&
    diff.invitatoDa === undefined &&
    diff.seguitoDa === undefined
  if (vuoto) return jsonResponse(true, 'Associazione invariata', 200)

  const byId = new Map(rows.map((p) => [p.id, p]))

  for (const id of diff.rimuoviPersone) {
    const err = await scollega(db, profilo.id, id)
    if (err) return jsonResponse(false, err.message, 500)
    if (diff.propagaRemoveIds.includes(id)) {
      const persona = byId.get(id)
      if (persona) {
        await propagaAssociazioneSede(db, { id: profilo.id, ruolo: profilo.ruolo }, { id: persona.id, ruolo: persona.ruolo }, 'remove')
      }
    }
  }
  for (const id of diff.rimuoviSedi) {
    const err = await scollega(db, profilo.id, id)
    if (err) return jsonResponse(false, err.message, 500)
  }
  if (diff.aggiungiSede) {
    const err = await collega(db, profilo.id, diff.aggiungiSede)
    if (err) return jsonResponse(false, err.message, 500)
  }
  if (diff.aggiungiPersona) {
    const err = await collega(db, profilo.id, diff.aggiungiPersona)
    if (err) return jsonResponse(false, err.message, 500)
    if (diff.propagaAddId) {
      const persona = byId.get(diff.propagaAddId)
      if (persona) {
        await propagaAssociazioneSede(db, { id: profilo.id, ruolo: profilo.ruolo }, { id: persona.id, ruolo: persona.ruolo }, 'add')
      }
    }
  }

  if (diff.invitatoDa !== undefined) {
    const { error } = await db.from('profili').update({ invitato_da: diff.invitatoDa }).eq('id', profilo.id)
    if (error) return jsonResponse(false, error.message, 500)
  }
  if (diff.seguitoDa !== undefined) {
    const { error } = await db.from('profili').update({ seguito_da: diff.seguitoDa }).eq('id', profilo.id)
    if (error) return jsonResponse(false, error.message, 500)
  }

  return jsonResponse(true, 'Associazione aggiornata', 200)
}
