import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

function jsonResponse(ok: boolean, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...data }, { status })
}

type Body = {
  agenzia_id?: string
  nome_completo?: string | null
  email?: string | null
  telefono?: string | null
  societa?: string | null
  area_geografica?: string | null
}

function pulisci(value: unknown): string {
  return String(value ?? '').trim()
}

/** Email tecnica interna per agenti inseriti a mano senza indirizzo reale. */
function generaEmailInterna(): string {
  return `agente-${crypto.randomUUID()}@manuale.ladiva.local`
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

  const agenziaId = pulisci(body.agenzia_id)
  const nomeCompleto = pulisci(body.nome_completo)
  const emailInput = pulisci(body.email).toLowerCase()
  const telefono = pulisci(body.telefono)
  const societa = pulisci(body.societa)
  const areaGeografica = pulisci(body.area_geografica)

  if (!agenziaId) {
    return jsonResponse(false, 'Agenzia non specificata', 400)
  }
  if (!nomeCompleto) {
    return jsonResponse(false, 'Il nome dell’agente è obbligatorio', 400)
  }

  const svc = createServiceRoleSupabase()
  if (!svc) {
    return jsonResponse(false, 'Configurazione server incompleta', 500)
  }

  // Verifica che l'agenzia esista e abbia il ruolo corretto
  const { data: agenzia } = await svc
    .from('profili')
    .select('id, ruolo')
    .eq('id', agenziaId)
    .maybeSingle()

  if (!agenzia || agenzia.ruolo !== 'agenzia') {
    return jsonResponse(false, 'Agenzia non trovata o ruolo non valido', 404)
  }

  const emailReale = Boolean(emailInput)
  const email = emailReale ? emailInput : generaEmailInterna()
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
      invito_ruolo: 'agente',
      invito_da: agenziaId,
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
    console.error('crea-agente createUser', createErr)
    return jsonResponse(false, msg, alreadyExists ? 409 : 500)
  }

  const nuovoAgenteId = created?.user?.id ?? null
  if (!nuovoAgenteId) {
    return jsonResponse(false, 'Creazione utente non riuscita', 500)
  }

  // Il trigger crea il profilo (ruolo agente, invitato_da = agenzia, non approvato):
  // completiamo con approvazione e area geografica.
  const patch: Record<string, unknown> = { registrazione_approvata: true }
  if (areaGeografica) patch.area_geografica = areaGeografica
  const { error: updateErr } = await svc.from('profili').update(patch).eq('id', nuovoAgenteId)
  if (updateErr) {
    console.error('crea-agente update profilo', updateErr)
  }

  // Connessione bidirezionale agenzia <-> agente (rubrica reciproca)
  const { error: linkErr } = await svc.from('connessioni_utente_operatore').upsert(
    [
      { utente_id: agenziaId, operatore_id: nuovoAgenteId },
      { utente_id: nuovoAgenteId, operatore_id: agenziaId },
    ],
    { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
  )
  if (linkErr) {
    console.error('crea-agente connessioni', linkErr)
  }

  return jsonResponse(true, emailReale ? 'Agente creato e associato all’agenzia.' : 'Agente creato (account tecnico interno) e associato all’agenzia.', 200, {
    agente_id: nuovoAgenteId,
  })
}
