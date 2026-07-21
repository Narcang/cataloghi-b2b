export const CAMPIONE_OPTIONS = ['VALIGIA AGENTI', 'CAMPIONI SCIOLTI'] as const

export const CATALOGO_AGENZIA_OPTIONS = [
  'CATALOGO GENERALE 2026',
  'LISTINO PUBBLICO 2026',
] as const

export type CampioneOption = (typeof CAMPIONE_OPTIONS)[number]
export type CatalogoAgenziaOption = (typeof CATALOGO_AGENZIA_OPTIONS)[number]

export type AgenziaProfiloCampi = {
  agenzia_campione_1: string | null
  agenzia_campione_2: string | null
  agenzia_catalogo_1: string | null
  agenzia_catalogo_2: string | null
}

export const AGENZIA_PROFILO_CAMPI_KEYS = [
  'agenzia_campione_1',
  'agenzia_campione_2',
  'agenzia_catalogo_1',
  'agenzia_catalogo_2',
] as const satisfies readonly (keyof AgenziaProfiloCampi)[]

const CAMPIONE_SET = new Set<string>(CAMPIONE_OPTIONS)
const CATALOGO_SET = new Set<string>(CATALOGO_AGENZIA_OPTIONS)

function normalizeSelectValue(
  value: unknown,
  allowed: ReadonlySet<string>,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  if (trimmed === '') return null
  if (!allowed.has(trimmed)) return null
  return trimmed
}

export function readAgenziaCampiFromBody(body: Record<string, unknown>): Partial<AgenziaProfiloCampi> {
  const out: Partial<AgenziaProfiloCampi> = {}
  for (const key of ['agenzia_campione_1', 'agenzia_campione_2'] as const) {
    if (key in body) {
      out[key] = normalizeSelectValue(body[key], CAMPIONE_SET)
    }
  }
  for (const key of ['agenzia_catalogo_1', 'agenzia_catalogo_2'] as const) {
    if (key in body) {
      out[key] = normalizeSelectValue(body[key], CATALOGO_SET)
    }
  }
  return out
}

export function readAgenziaCampiFromFormData(fd: FormData): AgenziaProfiloCampi {
  const read = (name: keyof AgenziaProfiloCampi) => {
    const raw = fd.get(name)
    if (raw === null) return null
    return String(raw).trim() || null
  }
  return {
    agenzia_campione_1: read('agenzia_campione_1'),
    agenzia_campione_2: read('agenzia_campione_2'),
    agenzia_catalogo_1: read('agenzia_catalogo_1'),
    agenzia_catalogo_2: read('agenzia_catalogo_2'),
  }
}

export function pickAgenziaProfiloCampi(p: Partial<AgenziaProfiloCampi>): AgenziaProfiloCampi {
  return {
    agenzia_campione_1: p.agenzia_campione_1 ?? null,
    agenzia_campione_2: p.agenzia_campione_2 ?? null,
    agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
    agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
  }
}

export function hasAgenziaCampioni(p: Partial<AgenziaProfiloCampi>): boolean {
  return Boolean(p.agenzia_campione_1?.trim()) || Boolean(p.agenzia_campione_2?.trim())
}

export function hasAgenziaCataloghi(p: Partial<AgenziaProfiloCampi>): boolean {
  return Boolean(p.agenzia_catalogo_1?.trim()) || Boolean(p.agenzia_catalogo_2?.trim())
}
