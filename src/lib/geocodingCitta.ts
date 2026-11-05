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

async function cerca(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
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
    const data = (await res.json()) as { lat?: string; lon?: string }[]
    const hit = data[0]
    const lat = Number(hit?.lat)
    const lng = Number(hit?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}
