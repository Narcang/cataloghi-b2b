import confini from '@/data/comuniConfini.json'
import type { AreaCitta } from '@/lib/areaInteresse'

type Anello = number[][]
type Comune = Anello[]

const PER_NOME = confini as Record<string, Comune[]>

function piega(testo: string): string {
  return testo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it')
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

function contiene(comune: Comune, lat: number, lng: number): boolean {
  return comune.some((anello) => dentroAnello(lng, lat, anello))
}

function centro(comune: Comune): { lat: number; lng: number } | null {
  const anello = comune[0]
  if (!anello?.length) return null
  let lat = 0
  let lng = 0
  for (const punto of anello) {
    lng += punto[0]
    lat += punto[1]
  }
  return { lat: lat / anello.length, lng: lng / anello.length }
}

function comeArea(comune: Comune): AreaCitta | null {
  if (comune.length === 1) return { type: 'Polygon', coordinates: comune }
  if (comune.length > 1) return { type: 'MultiPolygon', coordinates: comune.map((anello) => [anello]) }
  return null
}

function trovaComune(nome: string, lat: number, lng: number): Comune | null {
  const lista = PER_NOME[piega(nome)]
  if (!lista?.length) return null
  const interno = lista.find((comune) => contiene(comune, lat, lng))
  if (interno) return interno
  if (lista.length === 1) return lista[0]
  let scelto: Comune | null = null
  let distanza = 0.35 * 0.35
  for (const comune of lista) {
    const punto = centro(comune)
    if (!punto) continue
    const dx = punto.lng - lng
    const dy = punto.lat - lat
    const d = dx * dx + dy * dy
    if (d < distanza) {
      distanza = d
      scelto = comune
    }
  }
  return scelto
}

/** Circa 4 km: un punto appena fuori dal confine semplificato resta dov’è. */
const VICINO = 0.04 * 0.04

function vicinoAlConfine(comune: Comune, lat: number, lng: number): boolean {
  for (const anello of comune) {
    for (const punto of anello) {
      const dx = punto[0] - lng
      const dy = punto[1] - lat
      if (dx * dx + dy * dy <= VICINO) return true
    }
  }
  return false
}

function puntoInterno(comune: Comune): { lat: number; lng: number } | null {
  const anelli = [...comune].sort((a, b) => b.length - a.length)
  for (const anello of anelli) {
    const medio = media(anello)
    if (medio && dentroAnello(medio.lng, medio.lat, anello)) return medio
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const [x, y] of anello) {
      if (x < minLng) minLng = x
      if (y < minLat) minLat = y
      if (x > maxLng) maxLng = x
      if (y > maxLat) maxLat = y
    }
    const passi = 7
    for (let iy = 1; iy < passi; iy++) {
      for (let ix = 1; ix < passi; ix++) {
        const lat = minLat + ((maxLat - minLat) * iy) / passi
        const lng = minLng + ((maxLng - minLng) * ix) / passi
        if (contiene(comune, lat, lng)) return { lat, lng }
      }
    }
  }
  return centro(comune)
}

function media(anello: Anello): { lat: number; lng: number } | null {
  if (!anello.length) return null
  let lat = 0
  let lng = 0
  for (const punto of anello) {
    lng += punto[0]
    lat += punto[1]
  }
  return { lat: lat / anello.length, lng: lng / anello.length }
}

/**
 * Territorio del comune italiano e un punto dentro quel territorio.
 * Se le coordinate salvate cadono fuori (geocoding su un altro paese), il pallino torna nel comune.
 */
export function posizioneComuneItalia(
  nome: string,
  lat: number,
  lng: number,
): { lat: number; lng: number; area: AreaCitta } | null {
  const comune = trovaComune(nome, lat, lng)
  if (!comune) return null
  const area = comeArea(comune)
  if (!area) return null
  if (contiene(comune, lat, lng) || vicinoAlConfine(comune, lat, lng)) return { lat, lng, area }
  const interno = puntoInterno(comune)
  if (!interno) return { lat, lng, area }
  return { lat: interno.lat, lng: interno.lng, area }
}

/** Territorio del comune italiano con questo nome. Confini ISTAT (geojson-italy), semplificati. */
export function areaComuneItalia(nome: string, lat: number, lng: number): AreaCitta | null {
  return posizioneComuneItalia(nome, lat, lng)?.area ?? null
}
