import regioniMondo from '@/data/regioniMondo.json'
import {
  nazioneDi,
  nomeNazione,
  nomeRegione,
  regioniDellaNazione,
  type CittaCoperta,
} from '@/lib/areaInteresse'

type Anello = number[][]

type Paese = {
  anelli: Anello[]
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

const PAESI = new Map<string, Paese>()

function anelliDi(coordinates: unknown, tipo: string): Anello[] {
  if (tipo === 'Polygon') return coordinates as Anello[]
  if (tipo === 'MultiPolygon') {
    const out: Anello[] = []
    for (const poligono of coordinates as Anello[][]) out.push(...poligono)
    return out
  }
  return []
}

for (const feature of (
  regioniMondo as {
    features: { properties: { id: string }; geometry: { type: string; coordinates: unknown } | null }[]
  }
).features) {
  const iso = nazioneDi(feature.properties.id)
  const geometry = feature.geometry
  if (!iso || !geometry) continue
  let paese = PAESI.get(iso)
  if (!paese) {
    paese = { anelli: [], minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity }
    PAESI.set(iso, paese)
  }
  for (const anello of anelliDi(geometry.coordinates, geometry.type)) {
    if (anello.length < 4) continue
    paese.anelli.push(anello)
    for (const punto of anello) {
      const lng = punto[0]
      const lat = punto[1]
      if (lng < paese.minLng) paese.minLng = lng
      if (lat < paese.minLat) paese.minLat = lat
      if (lng > paese.maxLng) paese.maxLng = lng
      if (lat > paese.maxLat) paese.maxLat = lat
    }
  }
}

function dentroAnello(lng: number, lat: number, anello: Anello): boolean {
  let dentro = false
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const xi = anello[i][0]
    const yi = anello[i][1]
    const xj = anello[j][0]
    const yj = anello[j][1]
    const attraversa = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (attraversa) dentro = !dentro
  }
  return dentro
}

const MARGINE = 0.45

function nazioneDelPunto(lat: number, lng: number, candidate: string[]): string | null {
  for (const id of candidate) {
    const paese = PAESI.get(id)
    if (!paese) continue
    if (lng < paese.minLng || lng > paese.maxLng || lat < paese.minLat || lat > paese.maxLat) continue
    if (paese.anelli.some((anello) => dentroAnello(lng, lat, anello))) return id
  }
  let migliore: string | null = null
  let distanza = MARGINE * MARGINE
  for (const id of candidate) {
    const paese = PAESI.get(id)
    if (!paese) continue
    if (
      lng < paese.minLng - MARGINE ||
      lng > paese.maxLng + MARGINE ||
      lat < paese.minLat - MARGINE ||
      lat > paese.maxLat + MARGINE
    ) {
      continue
    }
    for (const anello of paese.anelli) {
      for (const punto of anello) {
        const dx = punto[0] - lng
        const dy = punto[1] - lat
        const d = dx * dx + dy * dy
        if (d < distanza) {
          distanza = d
          migliore = id
        }
      }
    }
  }
  return migliore
}

export function coperturaVisibile(
  aree: string[],
  nazioniIntere: string[],
  citta: CittaCoperta[],
): { regioni: string[]; etichetta: string } {
  const candidate = new Set<string>(nazioniIntere)
  for (const id of aree) {
    const iso = nazioneDi(id)
    if (iso) candidate.add(iso)
  }
  const conCitta = new Set<string>()
  if (citta.length > 0 && candidate.size > 0) {
    const ids = [...candidate]
    for (const punto of citta) {
      const iso = nazioneDelPunto(punto.lat, punto.lng, ids)
      if (iso) conCitta.add(iso)
    }
  }
  const viste = new Set<string>()
  const regioni: string[] = []
  const aggiungi = (id: string) => {
    if (viste.has(id)) return
    viste.add(id)
    regioni.push(id)
  }
  for (const iso of nazioniIntere) {
    if (conCitta.has(iso)) continue
    for (const regione of regioniDellaNazione(iso)) aggiungi(regione.id)
  }
  for (const id of aree) {
    const iso = nazioneDi(id)
    if (iso && conCitta.has(iso)) continue
    aggiungi(id)
  }
  const nomi: string[] = []
  for (const iso of nazioniIntere) {
    if (conCitta.has(iso)) continue
    const nome = nomeNazione(iso)
    if (nome) nomi.push(nome)
  }
  for (const id of aree) {
    const iso = nazioneDi(id)
    if (iso && conCitta.has(iso)) continue
    const nome = nomeRegione(id)
    if (nome) nomi.push(nome)
  }
  for (const punto of citta) nomi.push(punto.nome)
  return { regioni, etichetta: nomi.join(', ') }
}
