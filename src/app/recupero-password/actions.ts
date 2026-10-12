'use server'

import { messaggioErroreRecupero } from '@/lib/recuperoPasswordMessaggio'
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
  if (!email) {
    redirect(`/recupero-password?message=${encodeURIComponent('Inserisci un indirizzo email.')}`)
  }

  const siteBase = process.env.NEXT_PUBLIC_APP_URL
  const baseUrl = siteBase ?? (await getOrigin()) ?? 'http://localhost:3000'
  const redirectTo = new URL('/reset-password', baseUrl).href

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  const message = error
    ? messaggioErroreRecupero(error.message)
    : `Email di recupero inviata a ${email}. Controlla anche la posta indesiderata.`

  redirect(`/recupero-password?message=${encodeURIComponent(message)}`)
}

