import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import {
  findAuthUserByEmail,
  generatePasswordRecoveryLink,
  recoveryRedirectTo,
} from '@/lib/ultimoAccessoUtenti'

function jsonResponse(ok: boolean, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...data }, { status })
}

function pulisci(value: unknown): string {
  return String(value ?? '').trim()
}

async function trovaAgenziaLadiva(
  svc: NonNullable<ReturnType<typeof createServiceRoleSupabase>>,
) {
  const { data } = await svc
    .from('profili')
    .select('id, societa, nome_completo')
    .eq('ruolo', 'agenzia')
    .limit(500)
  const rows = data ?? []
  const match = rows.find((row) => {
    const label = `${row.societa ?? ''} ${row.nome_completo ?? ''}`
    return /la\s*diva|ladiva/i.test(label)
  })
  return match ?? null
}

async function collegaAGenitore(
  svc: NonNullable<ReturnType<typeof createServiceRoleSupabase>>,
  profiloId: string,
  parentId: string,
) {
  await svc.from('profili').update({ invitato_da: parentId }).eq('id', profiloId)
  await svc.from('connessioni_utente_operatore').upsert(
    [
      { utente_id: parentId, operatore_id: profiloId },
      { utente_id: profiloId, operatore_id: parentId },
    ],
    { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
  )
}

/** Ripristina profilo e accesso per un'email già usata, o crea l'account se manca. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)

  const { data: profiloUtente } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  if (profiloUtente?.ruolo !== 'admin' && profiloUtente?.ruolo !== 'manager') {
    return jsonResponse(false, 'Operazione non consentita', 403)
  }

  let body: { email?: string; nome_completo?: string; societa?: string }
  try {
    body = (await request.json()) as { email?: string; nome_completo?: string; societa?: string }
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const email = pulisci(body.email).toLowerCase()
  const nomeCompleto = pulisci(body.nome_completo)
  const societa = pulisci(body.societa)
  if (!email.includes('@')) return jsonResponse(false, 'Email non valida', 400)
  const nomeDaSalvare = nomeCompleto || email.split('@')[0] || email

  const svc = createServiceRoleSupabase()
  if (!svc) return jsonResponse(false, 'Configurazione server incompleta', 500)

  const agenzia = await trovaAgenziaLadiva(svc)
  if (!agenzia) return jsonResponse(false, 'Agenzia La Diva non trovata', 400)

  const { data: profilo } = await svc
    .from('profili')
    .select('id, ruolo, registrazione_approvata, invitato_da, nome_completo')
    .ilike('email', email)
    .maybeSingle()

  const authUser = await findAuthUserByEmail(svc, email)
  let profiloId = profilo?.id ?? authUser?.id ?? null

  if (authUser && !profilo) {
    const { error: insErr } = await svc.from('profili').upsert(
      {
        id: authUser.id,
        email,
        nome_completo: nomeDaSalvare,
        societa: societa || null,
        ruolo: 'agente',
        registrazione_approvata: true,
        invitato_da: agenzia.id,
      },
      { onConflict: 'id' },
    )
    if (insErr) {
      console.error('ripristina-email insert profilo', insErr)
      return jsonResponse(false, insErr.message, 500)
    }
    profiloId = authUser.id
    await svc.auth.admin.updateUserById(authUser.id, { email_confirm: true })
  }

  const tieneRuolo = Boolean(profilo?.ruolo && profilo.ruolo !== 'free')

  if (profilo) {
    const patch: Record<string, unknown> = {
      registrazione_approvata: true,
      email,
    }
    if (!tieneRuolo) {
      patch.ruolo = 'agente'
      patch.nome_completo = profilo.nome_completo || nomeDaSalvare
      if (societa) patch.societa = societa
    }
    const { error: updErr } = await svc.from('profili').update(patch).eq('id', profilo.id)
    if (updErr) {
      console.error('ripristina-email update profilo', updErr)
      return jsonResponse(false, updErr.message, 500)
    }
    profiloId = profilo.id
    if (authUser) {
      await svc.auth.admin.updateUserById(authUser.id, { email_confirm: true })
    }
  }

  if (!profiloId && !authUser) {
    const password = crypto.randomUUID() + crypto.randomUUID()
    const { data: created, error: createErr } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        registration_flow: 'portale_self',
        nome_completo: nomeDaSalvare,
        societa: societa || undefined,
        invito_ruolo: 'agente',
        invito_da: agenzia.id,
        inserito_manualmente: true,
      },
    })
    if (createErr) {
      console.error('ripristina-email createUser', createErr)
      return jsonResponse(false, createErr.message, 500)
    }
    profiloId = created?.user?.id ?? null
    if (profiloId) {
      await svc
        .from('profili')
        .update({
          ruolo: 'agente',
          registrazione_approvata: true,
          societa: societa || null,
          nome_completo: nomeDaSalvare,
          invitato_da: agenzia.id,
        })
        .eq('id', profiloId)
    }
  }

  if (!profiloId) return jsonResponse(false, 'Impossibile creare o ripristinare il profilo', 500)

  if (!tieneRuolo) {
    await collegaAGenitore(svc, profiloId, agenzia.id)
  }

  const { link: recoveryLink } = await generatePasswordRecoveryLink(
    svc,
    email,
    recoveryRedirectTo(request.headers.get('origin')),
  )

  return jsonResponse(
    true,
    tieneRuolo
      ? 'Link pronto. Ruolo e collegamenti non sono stati modificati: copialo e mandalo all’utente.'
      : 'Accesso agente ripristinato e collegato a La Diva. Copi il link e lo manda all’utente per impostare la password.',
    200,
    {
      profilo_id: profiloId,
      agenzia_id: agenzia.id,
      agenzia_label: agenzia.societa || agenzia.nome_completo,
      recovery_link: recoveryLink,
    },
  )
}
