import { componiValoreConQuantitaEData } from '@/lib/profiloQuantita'

export type SezioneStorico = 'campioni' | 'cataloghi' | 'espositori' | 'box'

export const SEZIONI_STORICO: readonly SezioneStorico[] = ['campioni', 'cataloghi', 'espositori', 'box']

export const SEZIONE_STORICO_LABEL: Record<SezioneStorico, string> = {
  campioni: 'Strumenti lavoro agente',
  cataloghi: 'Cataloghi',
  espositori: 'Espositori',
  box: 'Box',
}

/** Campi base (senza suffissi _qta/_data) di ogni voce per sezione. */
export const SEZIONE_CAMPI_BASE: Record<SezioneStorico, readonly string[]> = {
  campioni: ['agenzia_campione_1', 'agenzia_campione_2'],
  cataloghi: ['agenzia_catalogo_1', 'agenzia_catalogo_2', 'agenzia_catalogo_3', 'agenzia_catalogo_4'],
  espositori: ['espositore_1', 'espositore_2'],
  box: ['box_show_room_1', 'box_show_room_2', 'box_show_room_3', 'box_show_room_4'],
}

/** Colonna della data automatica (aggiornato_il) associata a ogni sezione. */
export const SEZIONE_AGGIORNATO_IL: Record<SezioneStorico, string> = {
  campioni: 'agenzia_campioni_aggiornato_il',
  cataloghi: 'agenzia_cataloghi_aggiornato_il',
  espositori: 'espositori_aggiornato_il',
  box: 'box_aggiornato_il',
}

export type VoceStorico = {
  valore: string
  quantita: number | null
  data: string | null
}

/** Estrae le voci compilate (valore presente) di una sezione da un record profilo. */
export function costruisciVociSezione(
  record: Record<string, unknown> | null | undefined,
  sezione: SezioneStorico,
): VoceStorico[] {
  if (!record) return []
  const voci: VoceStorico[] = []
  for (const base of SEZIONE_CAMPI_BASE[sezione]) {
    const valore = record[base]
    const testo = valore === null || valore === undefined ? '' : String(valore).trim()
    if (!testo) continue
    const rawQta = record[`${base}_qta`]
    const quantita =
      rawQta === null || rawQta === undefined || rawQta === '' ? null : Number(rawQta)
    const rawData = record[`${base}_data`]
    const data = rawData === null || rawData === undefined ? null : String(rawData).trim() || null
    voci.push({
      valore: testo,
      quantita: Number.isFinite(quantita) ? (quantita as number) : null,
      data,
    })
  }
  return voci
}

/** Etichetta leggibile di una voce (es. "VALIGIA AGENTI ×20 · 27/07/2026"). */
export function formatVoceStorico(voce: VoceStorico): string {
  return componiValoreConQuantitaEData(voce.valore, voce.quantita, voce.data) ?? voce.valore
}
