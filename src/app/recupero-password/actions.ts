'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

async function getOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : undefined
}

export async function recuperoPassword(formData: FormData) {
  const supabase = await createClient()

  // Cast veloce: in prod userei Zod per validare input.
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const message = email
    ? `Ti abbiamo inviato un'email di recupero password all'indirizzo ${email}.`
    : "Ti abbiamo inviato un'email di recupero password al tuo indirizzo email."

  if (!email) {
    redirect(`/recupero-password?message=${encodeURIComponent(message)}`)
  }

  try {
    const siteBase = process.env.NEXT_PUBLIC_APP_URL
    const baseUrl = siteBase ?? (await getOrigin()) ?? 'http://localhost:3000'
    const redirectTo = new URL('/reset-password', baseUrl).href

    await supabase.auth.resetPasswordForEmail(email, {
      // Supabase richiede una URL assoluta.
      redirectTo,
    })
  } catch {
    // Volutamente ignoriamo l’errore: mostriamo sempre lo stesso messaggio.
  }

  redirect(`/recupero-password?message=${encodeURIComponent(message)}`)
}

