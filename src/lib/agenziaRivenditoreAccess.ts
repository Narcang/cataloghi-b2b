import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isRivenditoreManagedByAgenzia,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type OperatoreLink = { utente_id: string; operatore_id: string }

const HIERARCHY_SELECT =
  'id, ruolo, invitato_da, nome_completo, societa, email, area_geografica, registrazione_approvata'

/** Carica profili e link minimi per verificare l'associazione agenzia → rivenditore. */
export async function loadRivenditoreHierarchyContext(
  client: SupabaseClient,
  rivenditoreId: string,
  agenziaId: string,
): Promise<{ profili: ProfiloGerarchiaRow[]; links: OperatoreLink[] } | null> {
  const { data: rivenditore, error: rivErr } = await client
    .from('profili')
    .select(HIERARCHY_SELECT)
    .eq('id', rivenditoreId)
    .maybeSingle()

  if (rivErr || !rivenditore || rivenditore.ruolo !== 'rivenditore') {
    return null
  }

  const { data: linkRows, error: linkErr } = await client
    .from('connessioni_utente_operatore')
    .select('utente_id, operatore_id')
    .or(`utente_id.eq.${rivenditoreId},operatore_id.eq.${rivenditoreId}`)

  if (linkErr) return null

  const links: OperatoreLink[] = linkRows ?? []
  const ids = new Set<string>([rivenditoreId, agenziaId])
  for (const link of links) {
    ids.add(link.utente_id)
    ids.add(link.operatore_id)
  }

  let cursor: string | null | undefined = rivenditore.invitato_da
  const visited = new Set<string>()
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor)
    ids.add(cursor)
    const { data: hop } = await client
      .from('profili')
      .select('id, invitato_da')
      .eq('id', cursor)
      .maybeSingle()
    cursor = hop?.invitato_da
  }

  const { data: profiliRows, error: profErr } = await client
    .from('profili')
    .select(HIERARCHY_SELECT)
    .in('id', [...ids])

  if (profErr || !profiliRows?.length) return null

  return {
    profili: profiliRows as ProfiloGerarchiaRow[],
    links,
  }
}

export async function agenziaCanEditRivenditoreSpecializzazione(
  client: SupabaseClient,
  agenziaId: string,
  rivenditoreId: string,
): Promise<boolean> {
  const ctx = await loadRivenditoreHierarchyContext(client, rivenditoreId, agenziaId)
  if (!ctx) return false

  const rivenditore = ctx.profili.find((p) => p.id === rivenditoreId)
  if (!rivenditore) return false

  return isRivenditoreManagedByAgenzia(agenziaId, rivenditore, ctx.profili, ctx.links)
}
