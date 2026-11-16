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

/**
 * Territorio del comune italiano con questo nome.
 * Confini ISTAT (geojson-italy), semplificati. Se il nome esiste in più regioni, si tiene il comune che contiene il punto.
 */
export function areaComuneItalia(nome: string, lat: number, lng: number): AreaCitta | null {
  const lista = PER_NOME[piega(nome)]
  if (!lista?.length) return null
  const interno = lista.find((comune) => contiene(comune, lat, lng))
  if (interno) return comeArea(interno)
  if (lista.length === 1) return comeArea(lista[0])
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
  return scelto ? comeArea(scelto) : null
}
