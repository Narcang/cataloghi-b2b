import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { mercatoEnvConfig, type Mercato } from '@/lib/mercato'

/** Service role per il mercato indicato (null se env mancanti). */
export function createServiceRoleSupabaseForMercato(mercato: Mercato): SupabaseClient | null {
  if (mercato === 'it') return createServiceRoleSupabase()
  const { url, serviceRoleKey } = mercatoEnvConfig('ru')
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Client dati: service role del mercato, altrimenti fallback (sessione IT). */
export function getDataSupabaseForMercato(
  mercato: Mercato,
  fallback: SupabaseClient,
): SupabaseClient {
  return createServiceRoleSupabaseForMercato(mercato) ?? fallback
}
