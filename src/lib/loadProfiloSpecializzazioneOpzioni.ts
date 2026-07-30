import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildOpzioniSpecializzazioneMap,
  type OpzioneDbRow,
  type OpzioniSpecializzazioneMap,
} from '@/lib/profiloSpecializzazioneOpzioni'

export async function loadProfiloSpecializzazioneOpzioni(
  client: SupabaseClient,
): Promise<OpzioniSpecializzazioneMap> {
  const rows = await loadProfiloSpecializzazioneOpzioniRows(client)
  return buildOpzioniSpecializzazioneMap(rows)
}

export async function loadProfiloSpecializzazioneOpzioniRows(
  client: SupabaseClient,
): Promise<OpzioneDbRow[]> {
  const { data, error } = await client
    .from('profili_specializzazione_opzioni')
    .select('categoria, etichetta, tipo')

  if (error) {
    console.error('loadProfiloSpecializzazioneOpzioniRows', error)
    return []
  }

  return (data ?? []) as OpzioneDbRow[]
}
