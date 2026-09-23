import type { SupabaseClient } from '@supabase/supabase-js'

export type InvitoValidato = {
  ruolo: string
  associatoA: string | null
  creatoDa: string
  multiUso: boolean
  societa: string | null
}

type InvitoRow = {
  ruolo_invitato: string
  creato_da: string
  usato: boolean | null
  multi_uso: boolean | null
  associato_a?: string | null
}

async function fetchInvitoRow(svc: SupabaseClient, token: string): Promise<InvitoRow | null> {
  const withAssociato = await svc
    .from('inviti')
    .select('ruolo_invitato, creato_da, usato, multi_uso, associato_a')
    .eq('token', token)
    .maybeSingle()

  if (withAssociato.data) return withAssociato.data as InvitoRow

  const fallback = await svc
    .from('inviti')
    .select('ruolo_invitato, creato_da, usato, multi_uso')
    .eq('token', token)
    .maybeSingle()

  return (fallback.data as InvitoRow | null) ?? null
}

function societaDaProfilo(p: { societa?: string | null; nome_completo?: string | null } | null): string | null {
  const societa = p?.societa?.trim()
  if (societa) return societa
  const nome = p?.nome_completo?.trim()
  return nome || null
}

/** Carica un invito valido e, se c’è un’entità collegata, la società da precompilare. */
export async function loadInvitoValidato(
  svc: SupabaseClient,
  token: string,
): Promise<InvitoValidato | null> {
  if (!token || token.length < 10) return null

  const invito = await fetchInvitoRow(svc, token)
  if (!invito || (invito.usato && !invito.multi_uso)) return null

  let associatoA = invito.associato_a ?? null
  if (!associatoA && invito.creato_da) {
    const { data: creatore } = await svc
      .from('profili')
      .select('ruolo')
      .eq('id', invito.creato_da)
      .maybeSingle()
    if (creatore && creatore.ruolo !== 'admin' && creatore.ruolo !== 'manager') {
      associatoA = invito.creato_da
    }
  }

  let societa: string | null = null
  if (associatoA) {
    const { data: parent } = await svc
      .from('profili')
      .select('societa, nome_completo')
      .eq('id', associatoA)
      .maybeSingle()
    societa = societaDaProfilo(parent)
  }

  return {
    ruolo: invito.ruolo_invitato,
    associatoA,
    creatoDa: invito.creato_da,
    multiUso: invito.multi_uso ?? false,
    societa,
  }
}
