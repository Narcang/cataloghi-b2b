import { createClient } from '@/utils/supabase/server'
import { DEFAULT_MERCATO, type Mercato } from '@/lib/mercato'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Un solo database ufficiale (Italia).
 * Lingua UI e cataloghi: cookie ladiva_locale (IT / RU / EN nel menu).
 * Il progetto Russia resta solo per l'import dei PDF.
 */
export async function getAdminMercato(): Promise<Mercato> {
  return DEFAULT_MERCATO
}

/**
 * Client dati admin: sempre il progetto IT (sessione autenticata / RLS).
 * Evita service_role su IT: su molti progetti manca GRANT su `cataloghi`.
 */
export async function getAdminDataSupabase(): Promise<{
  mercato: Mercato
  client: SupabaseClient
}> {
  const authClient = await createClient()
  return { mercato: DEFAULT_MERCATO, client: authClient }
}
