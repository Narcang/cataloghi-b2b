export const ESPOSITORE_OPTIONS = [
  'KIT COLORS',
  'VALIGIA AGENTI',
  'CASSETTA CAMPIONI',
  "RASTRELLIERA D'APPOGGIO",
  'RASTRELLIERA DA PAVIMENTO',
  'RASTRELLIERA DA PAV. + MINI',
] as const

export const BOX_SHOW_ROOM_OPTIONS = [
  'Family 15',
  'Family 20',
  'Family gres',
  'Capsule Collection 20',
  'Brick',
] as const

export type EspositoreOption = (typeof ESPOSITORE_OPTIONS)[number]
export type BoxShowRoomOption = (typeof BOX_SHOW_ROOM_OPTIONS)[number]

export type RivenditoreProfiloCampi = {
  espositore_1: string | null
  espositore_2: string | null
  box_show_room_1: string | null
  box_show_room_2: string | null
  box_show_room_3: string | null
  box_show_room_4: string | null
}

export const RIVENDITORE_PROFILO_CAMPI_KEYS = [
  'espositore_1',
  'espositore_2',
  'box_show_room_1',
  'box_show_room_2',
  'box_show_room_3',
  'box_show_room_4',
] as const satisfies readonly (keyof RivenditoreProfiloCampi)[]

const ESPOSITORE_SET = new Set<string>(ESPOSITORE_OPTIONS)
const SHOW_ROOM_SET = new Set<string>(BOX_SHOW_ROOM_OPTIONS)

export function normalizeRivenditoreSelectValue(
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

export function readRivenditoreCampiFromBody(body: Record<string, unknown>): Partial<RivenditoreProfiloCampi> {
  const out: Partial<RivenditoreProfiloCampi> = {}
  for (const key of ['espositore_1', 'espositore_2'] as const) {
    if (key in body) {
      out[key] = normalizeRivenditoreSelectValue(body[key], ESPOSITORE_SET)
    }
  }
  for (const key of ['box_show_room_1', 'box_show_room_2', 'box_show_room_3', 'box_show_room_4'] as const) {
    if (key in body) {
      out[key] = normalizeRivenditoreSelectValue(body[key], SHOW_ROOM_SET)
    }
  }
  return out
}

export function readRivenditoreCampiFromFormData(fd: FormData): RivenditoreProfiloCampi {
  const read = (name: keyof RivenditoreProfiloCampi) => {
    const raw = fd.get(name)
    if (raw === null) return null
    return String(raw).trim() || null
  }
  return {
    espositore_1: read('espositore_1'),
    espositore_2: read('espositore_2'),
    box_show_room_1: read('box_show_room_1'),
    box_show_room_2: read('box_show_room_2'),
    box_show_room_3: read('box_show_room_3'),
    box_show_room_4: read('box_show_room_4'),
  }
}

export function pickRivenditoreProfiloCampi(
  p: Partial<RivenditoreProfiloCampi>,
): RivenditoreProfiloCampi {
  return {
    espositore_1: p.espositore_1 ?? null,
    espositore_2: p.espositore_2 ?? null,
    box_show_room_1: p.box_show_room_1 ?? null,
    box_show_room_2: p.box_show_room_2 ?? null,
    box_show_room_3: p.box_show_room_3 ?? null,
    box_show_room_4: p.box_show_room_4 ?? null,
  }
}

export function hasRivenditoreProfiloCampi(p: Partial<RivenditoreProfiloCampi>): boolean {
  return RIVENDITORE_PROFILO_CAMPI_KEYS.some((key) => Boolean(p[key]?.trim()))
}
