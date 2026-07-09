import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { fetchCataloghiAttivi } from '@/lib/catalogPermessiDb'

const ALLOWED_ROLES = new Set(['admin', 'manager', 'agenzia', 'agente', 'rivenditore', 'distributore'])

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Non autenticato' }, { status: 401 })
  }

  const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  const ruolo = profilo?.ruolo ?? 'free'
  if (!ALLOWED_ROLES.has(ruolo)) {
    return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 403 })
  }

  const { cataloghi, error } = await fetchCataloghiAttivi()
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cataloghi })
}
