'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

function sanitize(s: unknown): string {
  return String(s ?? '').trim()
}

export async function register(formData: FormData) {
  const nome = sanitize(formData.get('nome'))
  const cognome = sanitize(formData.get('cognome'))
  const societa = sanitize(formData.get('societa'))
  const email = sanitize(formData.get('email')).toLowerCase()
  const password = String(formData.get('password') ?? '')
  const telefono = sanitize(formData.get('telefono'))
  const invitoToken = sanitize(formData.get('invito_token'))
  const consenso = formData.get('consenso')

  if (!consenso) {
    const q = invitoToken ? `&token=${invitoToken}` : ''
    redirect('/registrazione?message=' + encodeURIComponent('Devi accettare le policy per procedere.') + q)
  }

  if (!nome || !cognome || !societa || !email || !password || !telefono) {
    redirect('/registrazione?message=' + encodeURIComponent('Compila tutti i campi obbligatori.'))
  }

  if (password.length < 8) {
    redirect('/registrazione?message=' + encodeURIComponent('La password deve avere almeno 8 caratteri.'))
  }

  // Valida il token di invito tramite service role (bypassa RLS)
  let invitoRuolo: string | null = null
  let invitoDa: string | null = null
  let invitoMultiUso = false

  if (invitoToken) {
    const svc = createServiceRoleSupabase()
    if (svc) {
      const { data: invito } = await svc
        .from('inviti')
        .select('id, ruolo_invitato, creato_da, usato, multi_uso')
        .eq('token', invitoToken)
        .single()

      if (invito && (!invito.usato || invito.multi_uso)) {
        invitoRuolo = invito.ruolo_invitato
        invitoDa = invito.creato_da
        invitoMultiUso = invito.multi_uso ?? false

        if (invitoRuolo === 'rivenditore' && invitoDa) {
          const { data: invitante } = await svc
            .from('profili')
            .select('ruolo, invitato_da')
            .eq('id', invitoDa)
            .single()

          if (invitante?.ruolo === 'agente' && invitante.invitato_da) {
            const { data: agenziaParent } = await svc
              .from('profili')
              .select('id, ruolo')
              .eq('id', invitante.invitato_da)
              .single()

            if (agenziaParent?.ruolo === 'agenzia') {
              invitoDa = agenziaParent.id
            }
          }
        }
      }
    }
  }

  const nomeCompleto = `${nome} ${cognome}`.trim()
  const userMetadata = {
    registration_flow: 'portale_self',
    nome,
    cognome,
    societa,
    telefono,
    nome_completo: nomeCompleto,
    ...(invitoRuolo ? { invito_ruolo: invitoRuolo } : {}),
    ...(invitoDa ? { invito_da: invitoDa } : {}),
  }

  let newUserId: string | null = null

  if (invitoRuolo) {
    // Flusso con invito valido: usa l'API admin per creare l'utente senza inviare email di conferma
    const svc = createServiceRoleSupabase()
    if (!svc) {
      const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
      redirect('/registrazione?message=' + encodeURIComponent('Errore di configurazione server.') + q)
    }

    const { data: adminUserData, error: adminError } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    })

    if (adminError) {
      const msg =
        adminError.message.includes('already registered') ||
        adminError.message.includes('already exists') ||
        adminError.message.includes('already been registered')
          ? 'Questa email è già registrata. Prova ad accedere o recupera la password.'
          : adminError.message
      const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
      redirect('/registrazione?message=' + encodeURIComponent(msg) + q)
    }

    newUserId = adminUserData?.user?.id ?? null

    if (newUserId) {
      // Approva automaticamente (email già confermata dall'admin API)
      await svc.from('profili').update({ registrazione_approvata: true }).eq('id', newUserId)

      // Marca il token come usato (solo se monouso)
      if (invitoToken && !invitoMultiUso) {
        await svc
          .from('inviti')
          .update({ usato: true, usato_da: newUserId, usato_il: new Date().toISOString() })
          .eq('token', invitoToken)
          .eq('usato', false)
      }

      // Crea la connessione con l'invitante
      if (invitoDa) {
        const RUOLI_CONNESSIONE = new Set(['agenzia', 'agente', 'rivenditore', 'distributore', 'studio', 'partner_dipendente'])
        if (RUOLI_CONNESSIONE.has(invitoRuolo)) {
          const { data: profiloInvitante } = await svc
            .from('profili')
            .select('ruolo')
            .eq('id', invitoDa)
            .single()

          if (profiloInvitante && RUOLI_CONNESSIONE.has(profiloInvitante.ruolo)) {
            await svc.from('connessioni_utente_operatore').upsert([
              { utente_id: invitoDa,  operatore_id: newUserId },
              { utente_id: newUserId, operatore_id: invitoDa },
            ], { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true })
          } else {
            await svc.from('connessioni_utente_operatore').upsert(
              { utente_id: invitoDa, operatore_id: newUserId },
              { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true }
            )
          }
        }
      }
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=' + encodeURIComponent('Registrazione completata. Puoi accedere subito con le tue credenziali.'))
  }

  // Flusso libero (senza invito valido): usa signUp normale con conferma email
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userMetadata },
  })

  if (error) {
    const msg =
      error.message.includes('already registered') || error.message.includes('already been registered')
        ? 'Questa email è già registrata. Prova ad accedere o recupera la password.'
        : error.message
    redirect('/registrazione?message=' + encodeURIComponent(msg))
  }

  revalidatePath('/', 'layout')
  redirect('/registrazione?ok=1')
}
