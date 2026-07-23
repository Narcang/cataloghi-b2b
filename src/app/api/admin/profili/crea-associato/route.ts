import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

function jsonResponse(ok: boolean, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...data }, { status })
}

type Body = {
  parent_id?: string
  ruolo_nuovo?: string
  nome_completo?: string | null
  email?: string | null
  telefono?: string | null
  societa?: string | null
  area_geografica?: string | null
}

/** Ruoli creabili manualmente e ruolo dell'entità genitore richiesta. */
const RUOLO_GENITORE: Record<string, string> = {
  agente: 'agenzia',
  distributore: 'rivenditore',
}

function pulisci(value: unknown): string {
  return String(value ?? '').trim()
}

/** Email tecnica interna per profili inseriti a mano senza indirizzo reale. */
function generaEmailInterna(ruolo: string): string {
  return `${ruolo}-${crypto.randomUUID()}@manuale.ladiva.local`
}

/** Verifica che il chiamante possa creare il ruolo indicato sotto il genitore indicato. */
function callerPuoCreare(
  callerRuolo: string,
  callerId: string,
  ruoloNuovo: string,
  parentId: string,
): boolean {
  if (callerRuolo === 'admin') return true
  if (callerRuolo === 'manager') return ruoloNuovo === 'agente' || ruoloNuovo === 'distributore'
  if (callerRuolo === 'agenzia') return ruoloNuovo === 'agente' && parentId === callerId
  if (callerRuolo === 'rivenditore') return ruoloNuovo === 'distributore' && parentId === callerId
  return false
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

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const parentId = pulisci(body.parent_id)
  const ruoloNuovo = pulisci(body.ruolo_nuovo)
  const nomeCompleto = pulisci(body.nome_completo)
  const emailInput = pulisci(body.email).toLowerCase()
  const telefono = pulisci(body.telefono)
  const societa = pulisci(body.societa)
  const areaGeografica = pulisci(body.area_geografica)

  if (!ruoloNuovo || !(ruoloNuovo in RUOLO_GENITORE)) {
    return jsonResponse(false, 'Ruolo da creare non valido', 400)
  }
  if (!parentId) {
    return jsonResponse(false, 'Entità di appartenenza non specificata', 400)
  }
  if (!nomeCompleto) {
    return jsonResponse(false, 'Il nome è obbligatorio', 400)
  }

  if (!callerPuoCreare(callerRuolo, user.id, ruoloNuovo, parentId)) {
    return jsonResponse(false, 'Operazione non consentita per il tuo ruolo', 403)
  }

  const svc = createServiceRoleSupabase()
  if (!svc) {
    return jsonResponse(false, 'Configurazione server incompleta', 500)
  }

  // Verifica che l'entità genitore esista e abbia il ruolo corretto
  const ruoloGenitoreAtteso = RUOLO_GENITORE[ruoloNuovo]
  const { data: genitore } = await svc
    .from('profili')
    .select('id, ruolo')
    .eq('id', parentId)
    .maybeSingle()

  if (!genitore || genitore.ruolo !== ruoloGenitoreAtteso) {
    return jsonResponse(false, 'Entità di appartenenza non trovata o ruolo non valido', 404)
  }

  const emailReale = Boolean(emailInput)
  const email = emailReale ? emailInput : generaEmailInterna(ruoloNuovo)
  const password = crypto.randomUUID() + crypto.randomUUID()

  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      registration_flow: 'portale_self',
      nome_completo: nomeCompleto,
      societa: societa || undefined,
      telefono: telefono || undefined,
      invito_ruolo: ruoloNuovo,
      invito_da: parentId,
      inserito_manualmente: true,
    },
  })

  if (createErr) {
    const alreadyExists =
      createErr.message.includes('already registered') ||
      createErr.message.includes('already exists') ||
      createErr.message.includes('already been registered')
    const msg = alreadyExists
      ? 'Questa email è già associata a un account esistente.'
      : createErr.message
    console.error('crea-associato createUser', createErr)
    return jsonResponse(false, msg, alreadyExists ? 409 : 500)
  }

  const nuovoId = created?.user?.id ?? null
  if (!nuovoId) {
    return jsonResponse(false, 'Creazione utente non riuscita', 500)
  }

  // Il trigger crea il profilo (ruolo, invitato_da = genitore, non approvato):
  // completiamo con approvazione e area geografica.
  const patch: Record<string, unknown> = { registrazione_approvata: true }
  if (areaGeografica) patch.area_geografica = areaGeografica
  const { error: updateErr } = await svc.from('profili').update(patch).eq('id', nuovoId)
  if (updateErr) {
    console.error('crea-associato update profilo', updateErr)
  }

  // Connessione bidirezionale genitore <-> nuovo profilo (rubrica reciproca)
  const { error: linkErr } = await svc.from('connessioni_utente_operatore').upsert(
    [
      { utente_id: parentId, operatore_id: nuovoId },
      { utente_id: nuovoId, operatore_id: parentId },
    ],
    { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
  )
  if (linkErr) {
    console.error('crea-associato connessioni', linkErr)
  }

  const etichettaRuolo = ruoloNuovo === 'agente' ? 'Agente' : 'Venditore'
  return jsonResponse(
    true,
    emailReale
      ? `${etichettaRuolo} creato e associato.`
      : `${etichettaRuolo} creato (account tecnico interno) e associato.`,
    200,
    { nuovo_id: nuovoId },
  )
}
