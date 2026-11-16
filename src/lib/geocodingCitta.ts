import type { AreaCitta } from '@/lib/areaInteresse'

/** Coordinate da via, CAP e città. Nominatim (OpenStreetMap), senza chiave. */
export async function coordinateDaIndirizzo(parti: {
  indirizzo?: string | null
  cap?: string | null
  citta?: string | null
}): Promise<{ lat: number; lng: number } | null> {
  const via = parti.indirizzo?.trim() ?? ''
  const cap = parti.cap?.trim() ?? ''
  const citta = parti.citta?.trim() ?? ''
  const completo = [via, cap, citta].filter(Boolean).join(', ')
  if (!completo) return null
  const preciso = await cerca(completo)
  if (preciso) return preciso
  const soloCitta = [cap, citta].filter(Boolean).join(', ')
  if (soloCitta && soloCitta !== completo) return cerca(soloCitta)
  return null
}

/** Olanda, Paesi Bassi e Netherlands sono lo stesso paese. "Netherland" da solo finisce in Nuova Zelanda. */
function queryPaese(query: string): { testo: string; countrycodes?: string } {
  const olanda = /\b(olanda|paesi\s+bassi|the\s+netherlands|netherlands|netherland|holland)\b/i
  if (!olanda.test(query)) return { testo: query }
  return {
    testo: query.replace(new RegExp(olanda.source, 'gi'), 'Netherlands'),
    countrycodes: 'nl',
  }
}

type HitNominatim = { lat?: string; lon?: string; geojson?: { type?: string; coordinates?: unknown } }

async function cerca(query: string, conArea = false): Promise<{ lat: number; lng: number; area: AreaCitta | null } | null> {
  const paese = queryPaese(query)
  const countrycodes = paese.countrycodes ? `&countrycodes=${paese.countrycodes}` : ''
  const poligono = conArea ? '&polygon_geojson=1&polygon_threshold=0.002' : ''
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(paese.testo)}${countrycodes}${poligono}`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'it',
        'User-Agent': 'LadivaCeramicaCataloghi/1.0 (mappa sedi)',
      },
    })
    if (!res.ok) return null
    const data = (await res.json()) as HitNominatim[]
    const hit = data[0]
    const lat = Number(hit?.lat)
    const lng = Number(hit?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng, area: conArea ? areaDaGeojson(hit?.geojson) : null }
  } catch {
    return null
  }
}

function riduciAnello(anello: number[][]): number[][] | null {
  const pulito: number[][] = []
  for (const punto of anello) {
    if (!Array.isArray(punto) || punto.length < 2) continue
    const lng = Math.round(Number(punto[0]) * 1000) / 1000
    const lat = Math.round(Number(punto[1]) * 1000) / 1000
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
    const ultimo = pulito[pulito.length - 1]
    if (ultimo && ultimo[0] === lng && ultimo[1] === lat) continue
    pulito.push([lng, lat])
  }
  if (pulito.length < 4) return null
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  for (const [x, y] of pulito) {
    if (x < minLng) minLng = x
    if (y < minLat) minLat = y
    if (x > maxLng) maxLng = x
    if (y > maxLat) maxLat = y
  }
  if (maxLng - minLng > 1.5 || maxLat - minLat > 1.5) return null
  if (pulito.length <= 48) return pulito
  const passo = Math.ceil((pulito.length - 1) / 47)
  const radi: number[][] = []
  for (let i = 0; i < pulito.length - 1; i += passo) radi.push(pulito[i])
  radi.push(pulito[pulito.length - 1])
  return radi.length >= 4 ? radi : null
}

function areaDaGeojson(geo: HitNominatim['geojson']): AreaCitta | null {
  if (!geo || !Array.isArray(geo.coordinates)) return null
  if (geo.type === 'Polygon') {
    const anello = riduciAnello(geo.coordinates[0] as number[][])
    return anello ? { type: 'Polygon', coordinates: [anello] } : null
  }
  if (geo.type === 'MultiPolygon') {
    const poligoni: number[][][][] = []
    for (const poligono of geo.coordinates as number[][][][]) {
      const anello = riduciAnello(poligono?.[0] as number[][])
      if (anello) poligoni.push([anello])
      if (poligoni.length >= 4) break
    }
    return poligoni.length ? { type: 'MultiPolygon', coordinates: poligoni } : null
  }
  return null
}

/** Punto della città coperta e, se Nominatim lo conosce, il suo territorio. I comuni italiani usano i confini ISTAT. */
export async function coordinateCittaCoperta(
  query: string,
): Promise<{ lat: number; lng: number; area: AreaCitta | null } | null> {
  const testo = query.trim()
  if (!testo) return null
  return cerca(testo, true)
}
