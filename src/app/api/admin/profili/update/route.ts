import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import {
  BOX_SHOW_ROOM_OPTIONS,
  ESPOSITORE_OPTIONS,
  readRivenditoreCampiFromBody,
  RIVENDITORE_PROFILO_CAMPI_KEYS,
} from '@/lib/rivenditoreProfiloOptions'

const RUOLI_OK = new Set(['admin', 'manager', 'agenzia', 'agente', 'fornitore', 'rivenditore', 'distributore', 'free', 'studio', 'partner_dipendente'])

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
  seguito_da?: string | null
  espositore_1?: string | null
  espositore_2?: string | null
  box_show_room_1?: string | null
  box_show_room_2?: string | null
  box_show_room_3?: string | null
  box_show_room_4?: string | null
}

const ESPOSITORE_SET = new Set<string>(ESPOSITORE_OPTIONS)
const SHOW_ROOM_SET = new Set<string>(BOX_SHOW_ROOM_OPTIONS)

function applyRivenditoreSelectPatch(
  patch: Record<string, unknown>,
  body: Body,
  field: (typeof RIVENDITORE_PROFILO_CAMPI_KEYS)[number],
  allowed: Set<string>,
): string | null {
  if (!(field in body)) return null
  const raw = body[field]
  if (raw === undefined) return null
  if (raw === null) {
    patch[field] = null
    return null
  }
  const trimmed = String(raw).trim()
  if (trimmed === '') {
    patch[field] = null
    return null
  }
  if (!allowed.has(trimmed)) {
    return `Valore non valido per ${field.replaceAll('_', ' ')}`
  }
  patch[field] = trimmed
  return null
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

  const svc = createServiceRoleSupabase()

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
  if (typeof body.registrazione_approvata === 'boolean') {
    patch.registrazione_approvata = body.registrazione_approvata
  }

  const { data: profiloEsistente } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', profiloId)
    .maybeSingle()

  const ruoloEffettivo =
    typeof patch.ruolo === 'string' ? patch.ruolo : (profiloEsistente?.ruolo ?? null)

  if (ruoloEffettivo === 'rivenditore') {
    const rivenditoreCampi = readRivenditoreCampiFromBody(body as Record<string, unknown>)
    if ('seguito_da' in rivenditoreCampi) {
      patch.seguito_da = rivenditoreCampi.seguito_da ?? null
    }
    for (const field of ['espositore_1', 'espositore_2'] as const) {
      const err = applyRivenditoreSelectPatch(patch, body, field, ESPOSITORE_SET)
      if (err) return jsonResponse(false, err, 400)
    }
    for (const field of [
      'box_show_room_1',
      'box_show_room_2',
      'box_show_room_3',
      'box_show_room_4',
    ] as const) {
      const err = applyRivenditoreSelectPatch(patch, body, field, SHOW_ROOM_SET)
      if (err) return jsonResponse(false, err, 400)
    }
  }

  if (Object.keys(patch).length === 0) {
    return jsonResponse(false, 'Nessun campo da aggiornare', 400)
  }

  // UPDATE con sessione admin (RLS), non service role: spesso manca GRANT UPDATE al service_role.
  const { data: updatedRows, error } = await supabase
    .from('profili')
    .update(patch)
    .eq('id', profiloId)
    .select('id')

  if (error) {
    console.error('admin profili update', error)
    let msg = error.message.includes('check') ? 'Dati non validi (vincoli DB)' : error.message
    if (msg.includes('permission denied') && msg.includes('profili')) {
      msg +=
        ' Esegui su Supabase: supabase_alter_profili_rls_admin_fix.sql e supabase_alter_admin_grants_profili_connessioni.sql'
    }
    return jsonResponse(false, msg, 500)
  }

  if (!updatedRows || updatedRows.length === 0) {
    return jsonResponse(
      false,
      'Nessuna riga aggiornata: verifica ID profilo ed esegui su Supabase supabase_alter_profili_rls_admin_fix.sql (policy admin).',
      409,
    )
  }

  if (patch.registrazione_approvata === true) {
    if (svc) {
      const { error: authErr } = await svc.auth.admin.updateUserById(profiloId, { email_confirm: true })
      if (authErr) {
        console.error('admin profili update: auth.admin.updateUserById', authErr)
      }

      // Se l'utente è stato invitato, crea la connessione bidirezionale con l'invitante
      const { data: profiloApprovato } = await svc
        .from('profili')
        .select('invitato_da, ruolo')
        .eq('id', profiloId)
        .single()

      const invitantId = profiloApprovato?.invitato_da
      const ruoloNuovoUtente = profiloApprovato?.ruolo

      const RUOLI_CONNESSIONE = new Set(['agenzia', 'agente', 'rivenditore', 'distributore', 'studio', 'partner_dipendente'])

      if (invitantId && RUOLI_CONNESSIONE.has(ruoloNuovoUtente)) {
        const { data: profiloInvitante } = await svc
          .from('profili')
          .select('ruolo')
          .eq('id', invitantId)
          .single()

        if (profiloInvitante && RUOLI_CONNESSIONE.has(profiloInvitante.ruolo)) {
          // Connessione bidirezionale: entrambi si vedono in rubrica
          await svc.from('connessioni_utente_operatore').upsert([
            { utente_id: invitantId,  operatore_id: profiloId },
            { utente_id: profiloId,   operatore_id: invitantId },
          ], { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true })
        } else {
          // L'invitante è admin/manager: solo l'utente invitato vede l'invitante in rubrica (se ha ruolo connessione)
          await svc.from('connessioni_utente_operatore').upsert(
            { utente_id: invitantId, operatore_id: profiloId },
            { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true }
          )
        }
      }
    }
  }

  const abilitato = patch.registrazione_approvata === true
  return jsonResponse(
    true,
    abilitato ? 'Utente abilitato: registrazione approvata e accesso ai cataloghi attivo.' : 'Profilo aggiornato.',
    200
  )
}
