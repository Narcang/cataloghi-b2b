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

/** Ruoli che richiedono un genitore con ruolo fisso. */
const RUOLO_GENITORE_OBBLIGATORIO: Record<string, string> = {
  agente: 'agenzia',
  back_office: 'agenzia',
  distributore: 'rivenditore',
  studio_associato: 'studio',
}

/** Ruoli creabili a mano senza genitore (admin/manager). Se c'è un parent, deve avere uno di questi ruoli. */
const PARENT_RUOLI_OPZIONALI: Record<string, string[]> = {
  agenzia: ['manager'],
  rivenditore: ['agenzia', 'agente', 'back_office', 'manager'],
  studio: ['agenzia', 'agente', 'back_office', 'rivenditore', 'manager'],
}

const RUOLI_CREABILI = new Set([
  ...Object.keys(RUOLO_GENITORE_OBBLIGATORIO),
  ...Object.keys(PARENT_RUOLI_OPZIONALI),
])

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
  if (callerRuolo === 'admin') return RUOLI_CREABILI.has(ruoloNuovo)
  if (callerRuolo === 'manager') {
    return (
      ruoloNuovo === 'agente' ||
      ruoloNuovo === 'back_office' ||
      ruoloNuovo === 'distributore' ||
      ruoloNuovo === 'agenzia' ||
      ruoloNuovo === 'rivenditore' ||
      ruoloNuovo === 'studio' ||
      ruoloNuovo === 'studio_associato'
    )
  }
  if (callerRuolo === 'agenzia') return (ruoloNuovo === 'agente' || ruoloNuovo === 'back_office') && parentId === callerId
  if (callerRuolo === 'rivenditore') return ruoloNuovo === 'distributore' && parentId === callerId
  if (callerRuolo === 'studio') return ruoloNuovo === 'studio_associato' && parentId === callerId
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

  if (!ruoloNuovo || !RUOLI_CREABILI.has(ruoloNuovo)) {
    return jsonResponse(false, 'Ruolo da creare non valido', 400)
  }
  const genitoreObbligatorio = RUOLO_GENITORE_OBBLIGATORIO[ruoloNuovo]
  if (genitoreObbligatorio && !parentId) {
    return jsonResponse(false, 'Entità di appartenenza non specificata', 400)
  }
  const prioritaSocieta = ruoloNuovo === 'agenzia' || ruoloNuovo === 'rivenditore' || ruoloNuovo === 'studio'
  if (prioritaSocieta && !societa) {
    return jsonResponse(false, 'La società è obbligatoria', 400)
  }
  if (!prioritaSocieta && !nomeCompleto) {
    return jsonResponse(false, 'Il nome è obbligatorio', 400)
  }

  const nomeDaSalvare = nomeCompleto || societa

  if (!callerPuoCreare(callerRuolo, user.id, ruoloNuovo, parentId)) {
    return jsonResponse(false, 'Operazione non consentita per il tuo ruolo', 403)
  }

  const svc = createServiceRoleSupabase()
  if (!svc) {
    return jsonResponse(false, 'Configurazione server incompleta', 500)
  }

  const collegamentoId = parentId || user.id

  if (parentId) {
    const { data: genitore } = await svc
      .from('profili')
      .select('id, ruolo')
      .eq('id', parentId)
      .maybeSingle()

    if (!genitore) {
      return jsonResponse(false, 'Entità di appartenenza non trovata o ruolo non valido', 404)
    }
    if (genitoreObbligatorio && genitore.ruolo !== genitoreObbligatorio) {
      return jsonResponse(false, 'Entità di appartenenza non trovata o ruolo non valido', 404)
    }
    const parentRuoliOpzionali = PARENT_RUOLI_OPZIONALI[ruoloNuovo]
    if (parentRuoliOpzionali && !parentRuoliOpzionali.includes(genitore.ruolo)) {
      return jsonResponse(false, 'Entità di appartenenza non trovata o ruolo non valido', 404)
    }
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
      nome_completo: nomeDaSalvare,
      societa: societa || undefined,
      telefono: telefono || undefined,
      invito_ruolo: ruoloNuovo,
      invito_da: collegamentoId,
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
      { utente_id: collegamentoId, operatore_id: nuovoId },
      { utente_id: nuovoId, operatore_id: collegamentoId },
    ],
    { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
  )
  if (linkErr) {
    console.error('crea-associato connessioni', linkErr)
  }

  const etichettaRuolo =
    ruoloNuovo === 'agente'
      ? 'Agente'
      : ruoloNuovo === 'back_office'
        ? 'Back-Office'
        : ruoloNuovo === 'agenzia'
          ? 'Agenzia'
          : ruoloNuovo === 'rivenditore'
            ? 'Rivenditore'
            : ruoloNuovo === 'studio'
              ? 'Sede Studio'
              : ruoloNuovo === 'studio_associato'
                ? 'Studio'
                : 'Venditore'
  return jsonResponse(
    true,
    emailReale
      ? `${etichettaRuolo} creato e associato.`
      : `${etichettaRuolo} creato (account tecnico interno) e associato.`,
    200,
    { nuovo_id: nuovoId },
  )
}
