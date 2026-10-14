import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { fetchUltimoAccessoMap, ultimoAccessoMapToRecord } from '@/lib/ultimoAccessoUtenti'

export const dynamic = 'force-dynamic'

const RUOLI_ULTIMO_ACCESSO = new Set([
  'admin',
  'manager',
  'agenzia',
  'agente',
  'back_office',
  'distributore',
  'rivenditore',
  'studio',
])

/** Ultimo accesso letto dopo il render, così la pagina non resta in attesa di Auth Admin. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })

  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  if (!RUOLI_ULTIMO_ACCESSO.has(profilo?.ruolo ?? '')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const svc = createServiceRoleSupabase()
  if (!svc) return NextResponse.json({ ultimoAccessoByProfiloId: {} })

  const { map, completo } = await fetchUltimoAccessoMap(svc, 12000)
  return NextResponse.json({
    ultimoAccessoByProfiloId: ultimoAccessoMapToRecord(map),
    completo,
  })
}
