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
 * Client dati per il mercato scelto dall'admin.
 * Auth sempre sul progetto IT.
 * Italia: sessione admin (RLS). Evita service_role: su molti progetti manca
 * GRANT su `cataloghi` → "permission denied for table cataloghi".
 * Russia: service role del progetto RU (il JWT IT non vale lì).
 */
export async function getAdminDataSupabase(): Promise<{
  mercato: Mercato
  client: SupabaseClient
}> {
  const mercato = await getAdminMercato()
  const authClient = await createClient()
  if (mercato === 'it') {
    return { mercato, client: authClient }
  }
  const svc = createServiceRoleSupabaseForMercato('ru')
  return {
    mercato,
    client: svc ?? getDataSupabaseForMercato('ru', authClient),
  }
}
