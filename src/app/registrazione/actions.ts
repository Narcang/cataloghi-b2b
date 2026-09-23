'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { isAgenteLike } from '@/lib/catalogRoles'
import { loadInvitoValidato } from '@/lib/invitoLookup'

function sanitize(s: unknown): string {
  return String(s ?? '').trim()
}

export async function register(formData: FormData) {
  const nome = sanitize(formData.get('nome'))
  const cognome = sanitize(formData.get('cognome'))
  let societa = sanitize(formData.get('societa'))
  const email = sanitize(formData.get('email')).toLowerCase()
  const password = String(formData.get('password') ?? '')
  const telefono = sanitize(formData.get('telefono'))
  const invitoToken = sanitize(formData.get('invito_token'))
  const consenso = formData.get('consenso')

  if (!consenso) {
    const q = invitoToken ? `&token=${invitoToken}` : ''
    redirect('/registrazione?message=' + encodeURIComponent('consenso') + q)
  }

  if (password.length < 8) {
    const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
    redirect('/registrazione?message=' + encodeURIComponent('password') + q)
  }

  let invitoRuolo: string | null = null
  let invitoDa: string | null = null
  let invitoCreatoDa: string | null = null
  let invitoMultiUso = false

  if (invitoToken) {
    const svc = createServiceRoleSupabase()
    if (!svc) {
      redirect(
        '/registrazione?message=' +
          encodeURIComponent('server') +
          `&token=${encodeURIComponent(invitoToken)}`,
      )
    }
    const invito = await loadInvitoValidato(svc, invitoToken)
    if (!invito) {
      redirect(
        '/registrazione?message=' +
          encodeURIComponent('invito') +
          `&token=${encodeURIComponent(invitoToken)}`,
      )
    }
    invitoRuolo = invito.ruolo
    invitoMultiUso = invito.multiUso
    invitoDa = invito.associatoA
    invitoCreatoDa = invito.creatoDa
    if (!invitoRuolo) {
      redirect(
        '/registrazione?message=' +
          encodeURIComponent('invito') +
          `&token=${encodeURIComponent(invitoToken)}`,
      )
    }
    if (!societa && invito.societa) societa = invito.societa

    if (invitoRuolo === 'rivenditore' && invitoDa) {
      const { data: invitante } = await svc
        .from('profili')
        .select('ruolo, invitato_da')
        .eq('id', invitoDa)
        .single()

      if (invitante && isAgenteLike(invitante.ruolo) && invitante.invitato_da) {
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

  if (!nome || !cognome || !societa || !email || !password || !telefono) {
    const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
    redirect('/registrazione?message=' + encodeURIComponent('campi') + q)
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

  if (invitoToken) {
    // Flusso con invito valido: usa l'API admin per creare l'utente senza inviare email di conferma
    const svc = createServiceRoleSupabase()
    if (!svc) {
      const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
      redirect('/registrazione?message=' + encodeURIComponent('server') + q)
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
          ? 'email_exists'
          : adminError.message
      const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
      redirect('/registrazione?message=' + encodeURIComponent(msg) + q)
    }

    newUserId = adminUserData?.user?.id ?? null

    if (newUserId) {
      const profiloPatch = {
        registrazione_approvata: true,
        ruolo: invitoRuolo,
        societa,
        ...(invitoDa ? { invitato_da: invitoDa } : {}),
      }

      let profiloOk = false
      for (let attempt = 0; attempt < 6 && !profiloOk; attempt++) {
        const { data: updated, error: profiloErr } = await svc
          .from('profili')
          .update(profiloPatch)
          .eq('id', newUserId)
          .select('id')

        if (profiloErr) {
          const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
          redirect('/registrazione?message=' + encodeURIComponent(profiloErr.message) + q)
        }
        if (updated && updated.length > 0) {
          profiloOk = true
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      if (!profiloOk) {
        const { error: upsertErr } = await svc.from('profili').upsert(
          {
            id: newUserId,
            email,
            nome_completo: nomeCompleto,
            telefono,
            ...profiloPatch,
          },
          { onConflict: 'id' },
        )
        if (upsertErr) {
          const q = invitoToken ? `&token=${encodeURIComponent(invitoToken)}` : ''
          redirect('/registrazione?message=' + encodeURIComponent(upsertErr.message) + q)
        }
      }

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
        const RUOLI_CONNESSIONE = new Set(['agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'studio', 'studio_associato', 'partner_dipendente'])
        if (invitoRuolo && RUOLI_CONNESSIONE.has(invitoRuolo)) {
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

      if (invitoCreatoDa && invitoCreatoDa !== invitoDa) {
        await svc.from('connessioni_utente_operatore').upsert(
          { utente_id: invitoCreatoDa, operatore_id: newUserId },
          { onConflict: 'utente_id,operatore_id', ignoreDuplicates: true },
        )
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
        ? 'email_exists'
        : error.message
    redirect('/registrazione?message=' + encodeURIComponent(msg))
  }

  revalidatePath('/', 'layout')
  redirect('/registrazione?ok=1')
}
