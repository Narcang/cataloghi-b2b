/** Mercato / versione del portale B2B. */
export type Mercato = 'it' | 'ru'

export const MERCATO_COOKIE = 'admin_mercato'

export const MERCATO_LABEL: Record<Mercato, string> = {
  it: 'Italia',
  ru: 'Russia',
}

export const DEFAULT_MERCATO: Mercato = 'it'

export function isMercato(value: string | null | undefined): value is Mercato {
  return value === 'it' || value === 'ru'
}

/** True se le variabili Supabase per il mercato Russia sono configurate. */
export function isMercatoRuConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL_RU?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY_RU?.trim(),
  )
}

export function mercatoEnvConfig(mercato: Mercato): { url: string | undefined; serviceRoleKey: string | undefined } {
  if (mercato === 'ru') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_RU,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_RU,
    }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}
