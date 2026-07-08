import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CatalogoPermessoDbRow = {
  id: string
  titolo: string | null
  categoria: string | null
  ruoli_visibili: string[] | null
}

/** Service role se disponibile, altrimenti sessione utente (admin/manager via RLS). */
export async function getCatalogPermessiDb(): Promise<SupabaseClient | null> {
  const svc = createServiceRoleSupabase()
  if (svc) return svc
  return createClient()
}

export async function fetchCataloghiAttivi(): Promise<{
  cataloghi: CatalogoPermessoDbRow[]
  error: string | null
}> {
  const db = await getCatalogPermessiDb()
  if (!db) {
    return { cataloghi: [], error: 'Database non configurato' }
  }

  const { data, error } = await db
    .from('cataloghi')
    .select('id, titolo, categoria, ruoli_visibili')
    .eq('stato_pubblicazione', 'attivo')
    .order('titolo', { ascending: true, nullsFirst: false })

  if (error) return { cataloghi: [], error: error.message }

  return {
    cataloghi: (data ?? []).map(row => ({
      id: row.id,
      titolo: row.titolo,
      categoria: row.categoria,
      ruoli_visibili: row.ruoli_visibili ?? [],
    })),
    error: null,
  }
}

export async function fetchPermessiUtente(utenteId: string): Promise<{
  catalogo_ids: string[]
  error: string | null
}> {
  const db = await getCatalogPermessiDb()
  if (!db) return { catalogo_ids: [], error: 'Database non configurato' }

  const { data, error } = await db
    .from('catalogo_permessi_utente')
    .select('catalogo_id')
    .eq('utente_id', utenteId)

  if (error) return { catalogo_ids: [], error: error.message }
  return { catalogo_ids: (data ?? []).map(r => r.catalogo_id), error: null }
}

export async function savePermessiUtente(
  utenteId: string,
  catalogoIds: string[],
  creatoDa: string,
): Promise<{ error: string | null }> {
  const db = await getCatalogPermessiDb()
  if (!db) return { error: 'Database non configurato' }

  const { error: delError } = await db.from('catalogo_permessi_utente').delete().eq('utente_id', utenteId)
  if (delError) return { error: delError.message }

  if (catalogoIds.length === 0) return { error: null }

  const rows = catalogoIds.map(catalogo_id => ({
    utente_id: utenteId,
    catalogo_id,
    creato_da: creatoDa,
  }))

  const { error: insError } = await db.from('catalogo_permessi_utente').insert(rows)
  if (insError) return { error: insError.message }
  return { error: null }
}
