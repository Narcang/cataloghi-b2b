'use client'

import { useEffect, useRef } from 'react'

export type PuntoMappa = {
  id: string
  nome: string
  ruolo: string
  ruoloLabel: string
  citta: string
  lat: number
  lng: number
}

const COLORE_RUOLO: Record<string, string> = {
  agenzia: '#3b82f6',
  rivenditore: '#22c55e',
  studio: '#f97316',
}

type LeafletMap = {
  remove: () => void
  setView: (center: [number, number], zoom: number) => LeafletMap
  fitBounds: (bounds: unknown, options: object) => void
}

type LeafletLib = {
  map: (el: HTMLElement, options: object) => LeafletMap
  tileLayer: (url: string, options: object) => { addTo: (map: LeafletMap) => void }
  circleMarker: (
    latlng: [number, number],
    options: object,
  ) => { addTo: (map: LeafletMap) => { bindPopup: (html: string) => void } }
  latLngBounds: (latlngs: [number, number][]) => unknown
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

export default function MappaAziende({ punti }: { punti: PuntoMappa[] }) {
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
        const map = L.map(nodo.current, { worldCopyJump: true, scrollWheelZoom: true }).setView([30, 12], 2)
        mappa = map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map)

        const gruppi = new Map<string, PuntoMappa[]>()
        for (const punto of punti) {
          const chiave = `${punto.lat.toFixed(2)},${punto.lng.toFixed(2)}`
          const lista = gruppi.get(chiave) ?? []
          lista.push(punto)
          gruppi.set(chiave, lista)
        }
        for (const lista of gruppi.values()) {
          lista.forEach((punto, indice) => {
            const angolo = (indice / lista.length) * Math.PI * 2
            const scarto = lista.length > 1 ? 0.12 : 0
            const colore = COLORE_RUOLO[punto.ruolo] ?? '#ef4444'
            const marker = L.circleMarker(
              [punto.lat + Math.sin(angolo) * scarto, punto.lng + Math.cos(angolo) * scarto],
              { radius: 8, color: '#111', weight: 1, fillColor: colore, fillOpacity: 0.95 },
            ).addTo(map)
            marker.bindPopup(
              `<strong>${testoSicuro(punto.nome)}</strong><br>${testoSicuro(punto.ruoloLabel)}<br>${testoSicuro(punto.citta)}`,
            )
          })
        }
        if (punti.length > 0) {
          map.fitBounds(
            L.latLngBounds(punti.map((punto) => [punto.lat, punto.lng])),
            { padding: [36, 36], maxZoom: 6 },
          )
        }
      })
      .catch(() => {
        if (el) el.dataset.errore = '1'
      })

    return () => {
      annullato = true
      mappa?.remove()
    }
  }, [punti])

  return (
    <>
      <style>{`
        .leaflet-container img { max-width: none !important; }
        .leaflet-container { background: #111; font: inherit; }
      `}</style>
      <div ref={nodo} className="h-[70vh] min-h-[420px] w-full rounded-xl border border-white/15" />
    </>
  )
}
