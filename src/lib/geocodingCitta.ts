/** Coordinate di una città. Open-Meteo, senza chiave: basta per un puntino su una cartina globale. */
export async function coordinateDaCitta(
  citta: string,
): Promise<{ lat: number; lng: number } | null> {
  const nome = citta.trim()
  if (!nome) return null
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=it&format=json`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: { latitude?: number; longitude?: number }[]
    }
    const hit = data.results?.[0]
    if (typeof hit?.latitude !== 'number' || typeof hit.longitude !== 'number') return null
    if (!Number.isFinite(hit.latitude) || !Number.isFinite(hit.longitude)) return null
    return { lat: hit.latitude, lng: hit.longitude }
  } catch {
    return null
  }
}
