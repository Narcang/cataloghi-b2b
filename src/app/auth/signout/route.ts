import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Controllo sessione attiva
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut({ scope: 'global' })
  }

  revalidatePath('/', 'layout')
  // Dopo logout l'utente torna alla vista pubblica (come ospite / free), non al login
  return NextResponse.redirect(new URL('/dashboard', req.url), {
    status: 302,
  })
}
