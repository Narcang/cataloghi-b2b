import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import {
  DEFAULT_MERCATO,
  isMercato,
  isMercatoRuConfigured,
  MERCATO_COOKIE,
  type Mercato,
} from '@/lib/mercato'
import {
  createServiceRoleSupabaseForMercato,
  getDataSupabaseForMercato,
} from '@/utils/supabase/market'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Mercato attivo scelto dall'admin (cookie). Default: Italia. */
export async function getAdminMercato(): Promise<Mercato> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(MERCATO_COOKIE)?.value
  if (raw === 'ru' && isMercatoRuConfigured()) return 'ru'
  if (isMercato(raw)) return raw
  return DEFAULT_MERCATO
}

/**
 * Client Supabase per i dati del mercato selezionato (service role se disponibile).
 * L'autenticazione dell'admin resta sempre sul progetto IT.
 */
export async function getAdminDataSupabase(): Promise<{
  mercato: Mercato
  client: SupabaseClient
}> {
  const mercato = await getAdminMercato()
  const authClient = await createClient()
  const svc = createServiceRoleSupabaseForMercato(mercato)
  return {
    mercato,
    client: svc ?? getDataSupabaseForMercato(mercato, authClient),
  }
}
