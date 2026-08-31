import { parseAppLocale, type AppLocale } from '@/lib/locale'

export function parseCatalogLingua(value: unknown): AppLocale {
  return parseAppLocale(typeof value === 'string' ? value : null)
}
