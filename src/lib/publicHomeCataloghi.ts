import { isPublicHomeCatalogCategory, PUBLIC_CATALOG_CATEGORIES } from '@/lib/catalogCategories'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

/** Cataloghi della homepage pubblicati, anche se manca il ruolo «free» in ruoli_visibili. */
export async function fetchPublishedHomeCatalogRows<T extends Record<string, unknown>>(
  columns: string,
  filters?: { categoria?: string; lingue?: readonly string[] },
): Promise<T[] | null> {
  const svc = createServiceRoleSupabase()
  if (!svc) return null
  let query = svc
    .from('cataloghi')
    .select(columns)
    .in('categoria', filters?.categoria ? [filters.categoria] : [...PUBLIC_CATALOG_CATEGORIES])
    .eq('stato_pubblicazione', 'attivo')
  if (filters?.lingue && filters.lingue.length > 0) {
    query = query.in('lingua', [...filters.lingue])
  }
  const { data, error } = await query
  if (error) {
    console.error('fetchPublishedHomeCatalogRows', error.message)
    return null
  }
  return (data ?? []) as unknown as T[]
}

export async function fetchPublishedHomeCatalogo(id: string) {
  const svc = createServiceRoleSupabase()
  if (!svc) return null
  const { data, error } = await svc
    .from('cataloghi')
    .select('*')
    .eq('id', id)
    .eq('stato_pubblicazione', 'attivo')
    .maybeSingle()
  if (error) {
    console.error('fetchPublishedHomeCatalogo', error.message)
    return null
  }
  if (!data || !isPublicHomeCatalogCategory(data.categoria)) return null
  return data
}
