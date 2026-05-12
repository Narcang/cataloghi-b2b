'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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

  if (!nome || !cognome || !societa || !email || !password || !telefono) {
    redirect('/registrazione?message=' + encodeURIComponent('Compila tutti i campi obbligatori.'))
  }

  if (password.length < 8) {
    redirect('/registrazione?message=' + encodeURIComponent('La password deve avere almeno 8 caratteri.'))
  }

  const supabase = await createClient()
  const nomeCompleto = `${nome} ${cognome}`.trim()

  const { error } = await supabase.auth.signUp({
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
      },
    },
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
