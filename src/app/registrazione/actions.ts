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

  if (!nome || !cognome || !societa || !email || !password || !telefono) {
    redirect('/registrazione?message=' + encodeURIComponent('Compila tutti i campi obbligatori.'))
  }

  if (password.length < 8) {
    redirect('/registrazione?message=' + encodeURIComponent('La password deve avere almeno 8 caratteri.'))
  }

  // Valida il token di invito tramite service role (bypassa RLS)
  let invitoRuolo: string | null = null
  let invitoDa: string | null = null

  if (invitoToken) {
    const svc = createServiceRoleSupabase()
    if (svc) {
      const { data: invito } = await svc
        .from('inviti')
        .select('id, ruolo_invitato, creato_da, usato')
        .eq('token', invitoToken)
        .single()

      if (invito && !invito.usato) {
        invitoRuolo = invito.ruolo_invitato
        invitoDa = invito.creato_da
      }
    }
  }

  const supabase = await createClient()
  const nomeCompleto = `${nome} ${cognome}`.trim()

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        registration_flow: 'portale_self',
        nome,
        cognome,
        societa,
        telefono,
        nome_completo: nomeCompleto,
        // Passati al trigger handle_new_user() per impostare ruolo e invitato_da
        ...(invitoRuolo ? { invito_ruolo: invitoRuolo } : {}),
        ...(invitoDa ? { invito_da: invitoDa } : {}),
      },
    },
  })

  if (error) {
    const msg =
      error.message.includes('already registered') || error.message.includes('already been registered')
        ? 'Questa email è già registrata. Prova ad accedere o recupera la password.'
        : error.message
    const tokenParam = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
    redirect('/registrazione?message=' + encodeURIComponent(msg) + tokenParam)
  }

  const newUserId = signUpData?.user?.id ?? null

  // Marca il token come usato se la registrazione è andata a buon fine
  if (invitoToken && newUserId) {
    const svc = createServiceRoleSupabase()
    if (svc) {
      await svc
        .from('inviti')
        .update({ usato: true, usato_da: newUserId, usato_il: new Date().toISOString() })
        .eq('token', invitoToken)
        .eq('usato', false)

      // Approva automaticamente: nessuna attesa di approvazione admin
      await svc
        .from('profili')
        .update({ registrazione_approvata: true })
        .eq('id', newUserId)

      // Conferma l'email in modo che il login funzioni subito
      await svc.auth.admin.updateUserById(newUserId, { email_confirm: true })

      // Crea la connessione con l'invitante (stessa logica del route admin/profili/update)
      if (invitoDa && invitoRuolo) {
        const RUOLI_CONNESSIONE = new Set(['agente', 'distributore', 'studio', 'partner_dipendente'])
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

  revalidatePath('/', 'layout')
  redirect('/registrazione?ok=1')
}
