import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { getAdminDataSupabase } from '@/lib/mercatoServer'
import { loadProfiloSpecializzazioneOpzioni } from '@/lib/loadProfiloSpecializzazioneOpzioni'
import {
  opzioniToAllowedSet,
  isValoreSelectConsentito,
} from '@/lib/profiloSpecializzazioneOpzioni'
import { profiloSezioneCampiModificati } from '@/lib/profiloSpecializzazioneDate'
import { normalizeQuantita, normalizeDataTesto } from '@/lib/profiloQuantita'
import {
  costruisciVociSezione,
  SEZIONE_AGGIORNATO_IL,
  type SezioneStorico,
} from '@/lib/profiloSpecializzazioneStorico'
import {
  AGENZIA_RIVENDITORE_PATCH_KEY_SET,
  readRivenditoreCampiFromBody,
} from '@/lib/rivenditoreProfiloOptions'
import { agenziaCanEditRivenditoreSpecializzazione, agenteCanEditRivenditoreSpecializzazione } from '@/lib/agenziaRivenditoreAccess'

const ESPOSITORI_FIELDS = [
  'espositore_1',
  'espositore_2',
  'espositore_1_qta',
  'espositore_2_qta',
  'espositore_1_data',
  'espositore_2_data',
] as const
const BOX_FIELDS = [
  'box_show_room_1',
  'box_show_room_2',
  'box_show_room_3',
  'box_show_room_4',
  'box_show_room_1_qta',
  'box_show_room_2_qta',
  'box_show_room_3_qta',
  'box_show_room_4_qta',
  'box_show_room_1_data',
  'box_show_room_2_data',
  'box_show_room_3_data',
  'box_show_room_4_data',
] as const
const CAMPIONI_FIELDS = [
  'agenzia_campione_1',
  'agenzia_campione_2',
  'agenzia_campione_1_qta',
  'agenzia_campione_2_qta',
  'agenzia_campione_1_data',
  'agenzia_campione_2_data',
] as const
const CATALOGHI_FIELDS = [
  'agenzia_catalogo_1',
  'agenzia_catalogo_2',
  'agenzia_catalogo_3',
  'agenzia_catalogo_4',
  'agenzia_catalogo_1_qta',
  'agenzia_catalogo_2_qta',
  'agenzia_catalogo_3_qta',
  'agenzia_catalogo_4_qta',
  'agenzia_catalogo_1_data',
  'agenzia_catalogo_2_data',
  'agenzia_catalogo_3_data',
  'agenzia_catalogo_4_data',
] as const

const ESPOSITORE_QTA_FIELDS = ['espositore_1_qta', 'espositore_2_qta'] as const
const BOX_QTA_FIELDS = [
  'box_show_room_1_qta',
  'box_show_room_2_qta',
  'box_show_room_3_qta',
  'box_show_room_4_qta',
] as const
const CAMPIONE_QTA_FIELDS = ['agenzia_campione_1_qta', 'agenzia_campione_2_qta'] as const
const CATALOGO_QTA_FIELDS = [
  'agenzia_catalogo_1_qta',
  'agenzia_catalogo_2_qta',
  'agenzia_catalogo_3_qta',
  'agenzia_catalogo_4_qta',
] as const

const ESPOSITORE_DATA_FIELDS = ['espositore_1_data', 'espositore_2_data'] as const
const BOX_DATA_FIELDS = [
  'box_show_room_1_data',
  'box_show_room_2_data',
  'box_show_room_3_data',
  'box_show_room_4_data',
] as const
const CAMPIONE_DATA_FIELDS = ['agenzia_campione_1_data', 'agenzia_campione_2_data'] as const
const CATALOGO_DATA_FIELDS = [
  'agenzia_catalogo_1_data',
  'agenzia_catalogo_2_data',
  'agenzia_catalogo_3_data',
  'agenzia_catalogo_4_data',
] as const

/** Campi che un manager può aggiornare (solo specializzazione agenzia/rivenditore). */
const MANAGER_PATCH_KEYS = new Set<string>([
  ...CAMPIONI_FIELDS,
  ...CATALOGHI_FIELDS,
  ...ESPOSITORI_FIELDS,
  ...BOX_FIELDS,
  'agenzia_campioni_aggiornato_il',
  'agenzia_cataloghi_aggiornato_il',
  'espositori_aggiornato_il',
  'box_aggiornato_il',
])

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
  agenzia_campione_1?: string | null
  agenzia_campione_2?: string | null
  agenzia_catalogo_1?: string | null
  agenzia_catalogo_2?: string | null
  agenzia_catalogo_3?: string | null
  agenzia_catalogo_4?: string | null
  espositore_1_qta?: number | string | null
  espositore_2_qta?: number | string | null
  box_show_room_1_qta?: number | string | null
  box_show_room_2_qta?: number | string | null
  box_show_room_3_qta?: number | string | null
  box_show_room_4_qta?: number | string | null
  agenzia_campione_1_qta?: number | string | null
  agenzia_campione_2_qta?: number | string | null
  agenzia_catalogo_1_qta?: number | string | null
  agenzia_catalogo_2_qta?: number | string | null
  espositore_1_data?: string | null
  espositore_2_data?: string | null
  box_show_room_1_data?: string | null
  box_show_room_2_data?: string | null
  box_show_room_3_data?: string | null
  box_show_room_4_data?: string | null
  agenzia_campione_1_data?: string | null
  agenzia_campione_2_data?: string | null
  agenzia_catalogo_1_data?: string | null
  agenzia_catalogo_2_data?: string | null
  agenzia_catalogo_3_qta?: number | string | null
  agenzia_catalogo_4_qta?: number | string | null
  agenzia_catalogo_3_data?: string | null
  agenzia_catalogo_4_data?: string | null
}

function applySelectPatch(
  patch: Record<string, unknown>,
  body: Body,
  field: string,
  allowed: Set<string>,
  existing?: Record<string, unknown> | null,
): string | null {
  if (!(field in body)) return null
  const raw = body[field as keyof Body]
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
  const existingValue = existing?.[field]
  if (!isValoreSelectConsentito(trimmed, allowed, existingValue as string | null | undefined)) {
    return `Valore non valido per ${field}`
  }
  patch[field] = trimmed
  return null
}

function applyQtaPatch(patch: Record<string, unknown>, body: Body, field: string) {
  if (!(field in body)) return
  patch[field] = normalizeQuantita(body[field as keyof Body]) ?? null
}

function applyDataPatch(patch: Record<string, unknown>, body: Body, field: string) {
  if (!(field in body)) return
  patch[field] = normalizeDataTesto(body[field as keyof Body])
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
  const callerRuolo = profiloUtente?.ruolo ?? ''
  const isAdmin = callerRuolo === 'admin'
  const isManager = callerRuolo === 'manager'
  const isAgenzia = callerRuolo === 'agenzia'
  const isAgente = callerRuolo === 'agente'

  if (!isAdmin && !isManager && !isAgenzia && !isAgente) {
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

  const adminData = isAdmin ? await getAdminDataSupabase() : null
  const db = adminData?.client ?? supabase
  const svc = isAdmin ? adminData!.client : createServiceRoleSupabase()

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

  const { data: profiloEsistente } = await db
    .from('profili')
    .select(
      'ruolo, espositore_1, espositore_2, box_show_room_1, box_show_room_2, box_show_room_3, box_show_room_4, agenzia_campione_1, agenzia_campione_2, agenzia_catalogo_1, agenzia_catalogo_2, espositore_1_qta, espositore_2_qta, box_show_room_1_qta, box_show_room_2_qta, box_show_room_3_qta, box_show_room_4_qta, agenzia_campione_1_qta, agenzia_campione_2_qta, agenzia_catalogo_1_qta, agenzia_catalogo_2_qta, espositore_1_data, espositore_2_data, box_show_room_1_data, box_show_room_2_data, box_show_room_3_data, box_show_room_4_data, agenzia_campione_1_data, agenzia_campione_2_data, agenzia_catalogo_1_data, agenzia_catalogo_2_data, agenzia_catalogo_3, agenzia_catalogo_4, agenzia_catalogo_3_qta, agenzia_catalogo_4_qta, agenzia_catalogo_3_data, agenzia_catalogo_4_data, agenzia_campioni_aggiornato_il, agenzia_cataloghi_aggiornato_il, espositori_aggiornato_il, box_aggiornato_il',
    )
    .eq('id', profiloId)
    .maybeSingle()

  const ruoloEffettivo =
    typeof patch.ruolo === 'string' ? patch.ruolo : (profiloEsistente?.ruolo ?? null)

  const opzioniClient = svc ?? supabase
  const opzioniSpecializzazione = await loadProfiloSpecializzazioneOpzioni(opzioniClient)
  const allowedSelect = {
    campioni: opzioniToAllowedSet(opzioniSpecializzazione.campioni),
    cataloghi: opzioniToAllowedSet(opzioniSpecializzazione.cataloghi),
    espositori: opzioniToAllowedSet(opzioniSpecializzazione.espositori),
    box: opzioniToAllowedSet(opzioniSpecializzazione.box),
  }

  if (ruoloEffettivo === 'rivenditore') {
    const rivenditoreCampi = readRivenditoreCampiFromBody(body as Record<string, unknown>)
    if ('seguito_da' in rivenditoreCampi) {
      patch.seguito_da = rivenditoreCampi.seguito_da ?? null
    }
    for (const field of ['espositore_1', 'espositore_2'] as const) {
      const err = applySelectPatch(
        patch,
        body,
        field,
        allowedSelect.espositori,
        profiloEsistente,
      )
      if (err) return jsonResponse(false, err, 400)
    }
    for (const field of [
      'box_show_room_1',
      'box_show_room_2',
      'box_show_room_3',
      'box_show_room_4',
    ] as const) {
      const err = applySelectPatch(patch, body, field, allowedSelect.box, profiloEsistente)
      if (err) return jsonResponse(false, err, 400)
    }
    for (const field of [...ESPOSITORE_QTA_FIELDS, ...BOX_QTA_FIELDS]) {
      applyQtaPatch(patch, body, field)
    }
    for (const field of [...ESPOSITORE_DATA_FIELDS, ...BOX_DATA_FIELDS]) {
      applyDataPatch(patch, body, field)
    }
  }

  if (ruoloEffettivo === 'agenzia') {
    for (const field of ['agenzia_campione_1', 'agenzia_campione_2'] as const) {
      const err = applySelectPatch(
        patch,
        body,
        field,
        allowedSelect.campioni,
        profiloEsistente,
      )
      if (err) return jsonResponse(false, err, 400)
    }
    for (const field of ['agenzia_catalogo_1', 'agenzia_catalogo_2', 'agenzia_catalogo_3', 'agenzia_catalogo_4'] as const) {
      const err = applySelectPatch(
        patch,
        body,
        field,
        allowedSelect.cataloghi,
        profiloEsistente,
      )
      if (err) return jsonResponse(false, err, 400)
    }
    for (const field of [...CAMPIONE_QTA_FIELDS, ...CATALOGO_QTA_FIELDS]) {
      applyQtaPatch(patch, body, field)
    }
    for (const field of [...CAMPIONE_DATA_FIELDS, ...CATALOGO_DATA_FIELDS]) {
      applyDataPatch(patch, body, field)
    }
  }

  const now = new Date().toISOString()
  const sezioniModificate: SezioneStorico[] = []
  if (ruoloEffettivo === 'rivenditore') {
    if (profiloSezioneCampiModificati(ESPOSITORI_FIELDS, patch, profiloEsistente)) {
      patch.espositori_aggiornato_il = now
      sezioniModificate.push('espositori')
    }
    if (profiloSezioneCampiModificati(BOX_FIELDS, patch, profiloEsistente)) {
      patch.box_aggiornato_il = now
      sezioniModificate.push('box')
    }
  }
  if (ruoloEffettivo === 'agenzia') {
    if (profiloSezioneCampiModificati(CAMPIONI_FIELDS, patch, profiloEsistente)) {
      patch.agenzia_campioni_aggiornato_il = now
      sezioniModificate.push('campioni')
    }
    if (profiloSezioneCampiModificati(CATALOGHI_FIELDS, patch, profiloEsistente)) {
      patch.agenzia_cataloghi_aggiornato_il = now
      sezioniModificate.push('cataloghi')
    }
  }

  if (isManager && !isAdmin) {
    if (ruoloEffettivo !== 'agenzia' && ruoloEffettivo !== 'rivenditore') {
      return jsonResponse(false, 'Il manager può modificare solo agenzie e rivenditori', 403)
    }
    for (const key of Object.keys(patch)) {
      if (!MANAGER_PATCH_KEYS.has(key)) {
        delete patch[key]
      }
    }
  }

  if (isAgenzia && !isAdmin && !isManager) {
    if (ruoloEffettivo !== 'rivenditore') {
      return jsonResponse(false, 'L\'agenzia può modificare solo i rivenditori associati', 403)
    }
    const authClient = svc ?? supabase
    const allowed = await agenziaCanEditRivenditoreSpecializzazione(authClient, user.id, profiloId)
    if (!allowed) {
      return jsonResponse(false, 'Rivenditore non associato alla tua agenzia', 403)
    }
    for (const key of Object.keys(patch)) {
      if (!AGENZIA_RIVENDITORE_PATCH_KEY_SET.has(key)) {
        delete patch[key]
      }
    }
  }

  if (isAgente && !isAdmin && !isManager && !isAgenzia) {
    if (ruoloEffettivo !== 'rivenditore') {
      return jsonResponse(false, 'L\'agente può modificare solo i rivenditori associati', 403)
    }
    const authClient = svc ?? supabase
    const allowed = await agenteCanEditRivenditoreSpecializzazione(authClient, user.id, profiloId)
    if (!allowed) {
      return jsonResponse(false, 'Rivenditore non associato al tuo profilo agente', 403)
    }
    for (const key of Object.keys(patch)) {
      if (!AGENZIA_RIVENDITORE_PATCH_KEY_SET.has(key)) {
        delete patch[key]
      }
    }
  }

  if (Object.keys(patch).length === 0) {
    return jsonResponse(false, 'Nessun campo da aggiornare', 400)
  }

  // UPDATE con sessione admin (RLS), non service role: spesso manca GRANT UPDATE al service_role.
  const { data: updatedRows, error } = await db
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

  // Archivia lo stato PRECEDENTE delle sezioni modificate (se aveva contenuto).
  const storicoClient = svc ?? supabase
  if (sezioniModificate.length > 0 && profiloEsistente) {
    const record = profiloEsistente as Record<string, unknown>
    const snapshots = sezioniModificate
      .map((sezione) => {
        const voci = costruisciVociSezione(record, sezione)
        if (voci.length === 0) return null
        const aggPrec = record[SEZIONE_AGGIORNATO_IL[sezione]]
        return {
          profilo_id: profiloId,
          sezione,
          voci,
          aggiornato_il_precedente: aggPrec ? String(aggPrec) : null,
          creato_da: user.id,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)

    if (snapshots.length > 0) {
      const { error: storicoErr } = await storicoClient
        .from('profili_specializzazione_storico')
        .insert(snapshots)
      if (storicoErr) {
        console.error('admin profili update: storico insert', storicoErr)
      }
    }
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
