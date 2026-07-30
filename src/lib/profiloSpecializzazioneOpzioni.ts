import {
  CAMPIONE_OPTIONS,
  CATALOGO_AGENZIA_OPTIONS,
} from '@/lib/agenziaProfiloOptions'
import {
  BOX_SHOW_ROOM_OPTIONS,
  ESPOSITORE_OPTIONS,
} from '@/lib/rivenditoreProfiloOptions'

export type OpzioneCategoria = 'campioni' | 'cataloghi' | 'espositori' | 'box'

export const OPZIONE_CATEGORIE: readonly OpzioneCategoria[] = [
  'campioni',
  'cataloghi',
  'espositori',
  'box',
]

export const OPZIONE_CATEGORIA_LABEL: Record<OpzioneCategoria, string> = {
  campioni: 'Strumenti lavoro agente',
  cataloghi: 'Cataloghi',
  espositori: 'Espositori',
  box: 'Box show room',
}

export const OPZIONE_CATEGORIA_BASE: Record<OpzioneCategoria, readonly string[]> = {
  campioni: CAMPIONE_OPTIONS,
  cataloghi: CATALOGO_AGENZIA_OPTIONS,
  espositori: ESPOSITORE_OPTIONS,
  box: BOX_SHOW_ROOM_OPTIONS,
}

export type OpzioneDbRow = {
  categoria: string
  etichetta: string
  tipo: 'extra' | 'nascosta'
}

export type OpzioniSpecializzazioneMap = Record<OpzioneCategoria, string[]>

export function isOpzioneCategoria(value: string): value is OpzioneCategoria {
  return (OPZIONE_CATEGORIE as readonly string[]).includes(value)
}

export function normalizeOpzioneEtichetta(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

/** Unisce voci di base (meno nascoste) con extra da DB. */
export function mergeOpzioniVisibili(
  categoria: OpzioneCategoria,
  rows: OpzioneDbRow[],
): string[] {
  const base = OPZIONE_CATEGORIA_BASE[categoria]
  const nascoste = new Set(
    rows
      .filter((row) => row.categoria === categoria && row.tipo === 'nascosta')
      .map((row) => row.etichetta),
  )
  const extra = rows
    .filter((row) => row.categoria === categoria && row.tipo === 'extra')
    .map((row) => row.etichetta)

  const merged = [...base.filter((option) => !nascoste.has(option)), ...extra]
  return [...new Set(merged)].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
}

export function buildOpzioniSpecializzazioneMap(rows: OpzioneDbRow[]): OpzioniSpecializzazioneMap {
  return {
    campioni: mergeOpzioniVisibili('campioni', rows),
    cataloghi: mergeOpzioniVisibili('cataloghi', rows),
    espositori: mergeOpzioniVisibili('espositori', rows),
    box: mergeOpzioniVisibili('box', rows),
  }
}

export function opzioniToAllowedSet(list: readonly string[]): Set<string> {
  return new Set(list)
}

/** Opzioni per il select: include il valore già salvato se non più in elenco. */
export function opzioniPerSelect(
  options: readonly string[],
  currentValue: string | null | undefined,
): string[] {
  const value = currentValue?.trim()
  if (!value) return [...options]
  if (options.includes(value)) return [...options]
  return [value, ...options]
}

export function isValoreSelectConsentito(
  value: string,
  allowed: ReadonlySet<string>,
  existingValue?: string | null,
): boolean {
  if (allowed.has(value)) return true
  const prev = existingValue?.trim()
  return Boolean(prev && prev === value)
}
