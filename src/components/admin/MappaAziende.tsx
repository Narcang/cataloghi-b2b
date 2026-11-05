'use client'

import { useEffect, useRef } from 'react'
import regioniItalia from '@/data/regioniItalia.json'
import { nomeRegione } from '@/lib/areaInteresse'

export type PuntoMappa = {
  id: string
  nome: string
  ruolo: string
  ruoloLabel: string
  citta: string
  indirizzo: string
  cap: string
  area: string
  lat: number
  lng: number
}

export type ZonaMappa = {
  id: string
  nome: string
  ruoloLabel: string
  colore: string
  regioni: string[]
}

type FeatureRegione = {
  type: 'Feature'
  properties: { id: string; nome: string }
  geometry: { type: string; coordinates: unknown }
}

const REGIONI_PER_ID = new Map(
  (regioniItalia.features as FeatureRegione[]).map((feature) => [feature.properties.id, feature]),
)

const COLORE_RUOLO: Record<string, string> = {
  agenzia: '#3b82f6',
  rivenditore: '#22c55e',
  studio: '#f97316',
}

type LeafletMap = { remove: () => void; fitBounds: (bounds: unknown, options: object) => void }

type LeafletLib = {
  map: (el: HTMLElement, options: object) => LeafletMap
  tileLayer: (url: string, options: object) => { addTo: (map: LeafletMap) => void }
  circleMarker: (
    latlng: [number, number],
    options: object,
  ) => { addTo: (map: LeafletMap) => { bindPopup: (html: string) => void } }
  geoJSON: (data: object, options: object) => { addTo: (map: LeafletMap) => void }
  latLngBounds: (latlngs: [number, number][]) => unknown
}

function angoliGeometria(coordinates: unknown, out: [number, number][]) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    out.push([Number(coordinates[1]), Number(coordinates[0])])
    return
  }
  for (const child of coordinates) angoliGeometria(child, out)
}

function caricaLeaflet(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as unknown as { L?: unknown }).L) return Promise.resolve()
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  return new Promise((resolve, reject) => {
    const esistente = document.getElementById('leaflet-js') as HTMLScriptElement | null
    if (esistente) {
      esistente.addEventListener('load', () => resolve(), { once: true })
      esistente.addEventListener('error', () => reject(new Error('leaflet')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('leaflet'))
    document.head.appendChild(script)
  })
}

function testoSicuro(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function rigaPopup(etichetta: string, valore: string): string {
  const testo = valore.trim()
  if (!testo) return ''
  return `<br>${etichetta}: ${testoSicuro(testo)}`
}

export default function MappaAziende({ punti, zone }: { punti: PuntoMappa[]; zone: ZonaMappa[] }) {
  const nodo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = nodo.current
    if (!el) return
    let annullato = false
    let mappa: LeafletMap | null = null

    void caricaLeaflet()
      .then(() => {
        if (annullato || !nodo.current) return
        const L = (window as unknown as { L: LeafletLib }).L
        const map = L.map(nodo.current, { worldCopyJump: true, scrollWheelZoom: true })
        mappa = map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map)

        const angoli: [number, number][] = []
        for (const zona of zone) {
          const features = zona.regioni
            .map((id) => REGIONI_PER_ID.get(id))
            .filter((feature): feature is FeatureRegione => Boolean(feature))
          if (!features.length) continue
          for (const feature of features) angoliGeometria(feature.geometry.coordinates, angoli)
          L.geoJSON(
            { type: 'FeatureCollection', features },
            {
              style: {
                color: zona.colore,
                weight: 1.5,
                fillColor: zona.colore,
                fillOpacity: 0.32,
              },
              onEachFeature: (
                feature: { properties?: { id?: string } },
                layer: { bindPopup: (html: string) => void },
              ) => {
                const regione = nomeRegione(feature.properties?.id ?? '') ?? ''
                layer.bindPopup(
                  `<strong>${testoSicuro(zona.nome)}</strong><br>${testoSicuro(zona.ruoloLabel)}<br>${testoSicuro(regione)}`,
                )
              },
            },
          ).addTo(map)
        }

        for (const punto of punti) {
          angoli.push([punto.lat, punto.lng])
          const colore = COLORE_RUOLO[punto.ruolo] ?? '#ef4444'
          const marker = L.circleMarker([punto.lat, punto.lng], {
            radius: 8,
            color: '#111',
            weight: 1,
            fillColor: colore,
            fillOpacity: 0.95,
          }).addTo(map)
          marker.bindPopup(
            `<strong>${testoSicuro(punto.nome)}</strong><br>${testoSicuro(punto.ruoloLabel)}` +
              rigaPopup('Via', punto.indirizzo) +
              rigaPopup('CAP', punto.cap) +
              rigaPopup('Città', punto.citta) +
              rigaPopup('Area', punto.area),
          )
        }

        if (angoli.length === 0) {
          map.fitBounds(L.latLngBounds([[46, 10], [42, 14]]), { padding: [24, 24] })
        } else if (zone.length > 0) {
          map.fitBounds(L.latLngBounds(angoli), { padding: [28, 28], maxZoom: 7 })
        } else if (punti.length === 1) {
          map.fitBounds(L.latLngBounds([[punti[0].lat, punti[0].lng]]), { maxZoom: 16, padding: [48, 48] })
        } else {
          map.fitBounds(L.latLngBounds(angoli), { padding: [36, 36], maxZoom: 12 })
        }
      })
      .catch(() => {
        if (el) el.dataset.errore = '1'
      })

    return () => {
      annullato = true
      mappa?.remove()
    }
  }, [punti, zone])

  return (
    <>
      <style>{`
        .leaflet-container img { max-width: none !important; }
        .leaflet-container { background: #d7e3ef; font: inherit; }
      `}</style>
      <div ref={nodo} className="h-[70vh] min-h-[420px] w-full rounded-xl border border-white/15" />
    </>
  )
}
