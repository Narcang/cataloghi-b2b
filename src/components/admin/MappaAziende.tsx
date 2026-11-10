'use client'

import { useEffect, useRef } from 'react'
import regioniMondo from '@/data/regioniMondo.json'
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
  citta: { nome: string; lat: number; lng: number }[]
}

type FeatureRegione = {
  type: 'Feature'
  properties: { id: string; nome: string }
  geometry: { type: string; coordinates: unknown }
}

const REGIONI_PER_ID = new Map(
  (regioniMondo.features as FeatureRegione[]).map((feature) => [feature.properties.id, feature]),
)

const COLORE_RUOLO: Record<string, string> = {
  agenzia: '#3b82f6',
  rivenditore: '#22c55e',
  studio: '#f97316',
}

type LeafletMap = {
  remove: () => void
  fitBounds: (bounds: unknown, options: object) => void
  invalidateSize: () => void
}

type MarkerMappa = {
  addTo: (map: LeafletMap) => MarkerMappa
  bindPopup: (html: string) => void
  bindTooltip: (html: string, options: object) => void
}

type LeafletLib = {
  map: (el: HTMLElement, options: object) => LeafletMap
  tileLayer: (url: string, options: object) => { addTo: (map: LeafletMap) => void }
  circleMarker: (latlng: [number, number], options: object) => MarkerMappa
  geoJSON: (data: object, options: object) => { addTo: (map: LeafletMap) => { getBounds: () => unknown } }
  latLngBounds: (latlngs: [number, number][]) => { extend: (bounds: unknown) => unknown }
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

        const riquadri: { extend: (bounds: unknown) => { extend: (bounds: unknown) => unknown } }[] = []
        for (const zona of zone) {
          if (zona.citta.length > 0) {
            for (const citta of zona.citta) {
              const marker = L.circleMarker([citta.lat, citta.lng], {
                pane: 'markerPane',
                radius: 8,
                color: '#ffffff',
                weight: 2,
                fillColor: zona.colore,
                fillOpacity: 0.95,
              }).addTo(map)
              marker.bindPopup(
                `<strong>${testoSicuro(zona.nome)}</strong><br>${testoSicuro(zona.ruoloLabel)}<br>${testoSicuro(citta.nome)}`,
              )
              marker.bindTooltip(`${testoSicuro(zona.nome)} · ${testoSicuro(citta.nome)}`, {
                permanent: true,
                direction: 'top',
                offset: [0, -10],
                className: 'ladiva-mappa-etichetta',
                opacity: 1,
              })
              riquadri.push(
                L.latLngBounds([[citta.lat, citta.lng]]) as {
                  extend: (bounds: unknown) => { extend: (bounds: unknown) => unknown }
                },
              )
            }
          }
          const features = zona.regioni
            .map((id) => REGIONI_PER_ID.get(id))
            .filter((feature): feature is FeatureRegione => Boolean(feature?.geometry))
          if (!features.length) continue
          const piccoli: { nome: string; lat: number; lng: number }[] = []
          const livello = L.geoJSON(
            { type: 'FeatureCollection', features },
            {
              style: {
                color: zona.colore,
                weight: 1.5,
                fillColor: zona.colore,
                fillOpacity: 0.35,
              },
              onEachFeature: (
                feature: { properties?: { id?: string } },
                layer: {
                  bindPopup: (html: string) => void
                  getBounds?: () => {
                    getCenter: () => { lat: number; lng: number }
                    getSouthWest: () => { lat: number; lng: number }
                    getNorthEast: () => { lat: number; lng: number }
                  }
                },
              ) => {
                const regione = nomeRegione(feature.properties?.id ?? '') ?? ''
                layer.bindPopup(
                  `<strong>${testoSicuro(zona.nome)}</strong><br>${testoSicuro(zona.ruoloLabel)}<br>${testoSicuro(regione)}`,
                )
                const bounds = layer.getBounds?.()
                if (!bounds) return
                const sw = bounds.getSouthWest()
                const ne = bounds.getNorthEast()
                if (Math.abs(ne.lng - sw.lng) >= 0.12 || Math.abs(ne.lat - sw.lat) >= 0.12) return
                const centro = bounds.getCenter()
                piccoli.push({ nome: regione, lat: centro.lat, lng: centro.lng })
              },
            },
          ).addTo(map)
          riquadri.push(livello.getBounds() as { extend: (bounds: unknown) => { extend: (bounds: unknown) => unknown } })
          if (piccoli.length > 0 && piccoli.length <= 12) {
            for (const punto of piccoli) {
              const marker = L.circleMarker([punto.lat, punto.lng], {
                pane: 'markerPane',
                radius: 7,
                color: '#ffffff',
                weight: 2,
                fillColor: zona.colore,
                fillOpacity: 0.95,
              }).addTo(map)
              marker.bindPopup(
                `<strong>${testoSicuro(zona.nome)}</strong><br>${testoSicuro(zona.ruoloLabel)}<br>${testoSicuro(punto.nome)}`,
              )
              marker.bindTooltip(`${testoSicuro(zona.nome)} · ${testoSicuro(punto.nome)}`, {
                permanent: true,
                direction: 'top',
                offset: [0, -8],
                className: 'ladiva-mappa-etichetta',
                opacity: 1,
              })
            }
          }
        }

        for (const punto of punti) {
          const colore = COLORE_RUOLO[punto.ruolo] ?? '#ef4444'
          const marker = L.circleMarker([punto.lat, punto.lng], {
            pane: 'markerPane',
            radius: 9,
            color: '#ffffff',
            weight: 2,
            fillColor: colore,
            fillOpacity: 1,
          }).addTo(map)
          const scheda =
            `<strong>${testoSicuro(punto.nome)}</strong><br>${testoSicuro(punto.ruoloLabel)}` +
            rigaPopup('Via', punto.indirizzo) +
            rigaPopup('CAP', punto.cap) +
            rigaPopup('Città', punto.citta) +
            rigaPopup('Area', punto.area)
          marker.bindPopup(scheda)
          marker.bindTooltip(testoSicuro(punto.nome), {
            permanent: true,
            direction: 'top',
            offset: [0, -10],
            className: 'ladiva-mappa-etichetta',
            opacity: 1,
          })
          riquadri.push(
            L.latLngBounds([[punto.lat, punto.lng]]) as {
              extend: (bounds: unknown) => { extend: (bounds: unknown) => unknown }
            },
          )
        }

        if (riquadri.length === 0) {
          map.fitBounds(L.latLngBounds([[46, 10], [42, 14]]), { padding: [24, 24] })
        } else {
          let tutto = riquadri[0]
          for (const riquadro of riquadri.slice(1)) tutto = tutto.extend(riquadro) as typeof tutto
          const limiti = tutto as typeof tutto & {
            getEast?: () => number
            getWest?: () => number
            getNorth?: () => number
            getSouth?: () => number
          }
          const zonaPiccola = Boolean(
            limiti.getEast &&
              limiti.getWest &&
              limiti.getNorth &&
              limiti.getSouth &&
              Math.abs(limiti.getEast() - limiti.getWest()) < 3 &&
              Math.abs(limiti.getNorth() - limiti.getSouth()) < 3,
          )
          const unaSede = punti.length === 1 && zone.length === 0
          const soloCitta =
            zone.length > 0 && zone.every((zona) => zona.citta.length > 0 && zona.regioni.length === 0)
          map.fitBounds(tutto, {
            padding: [36, 36],
            maxZoom: unaSede ? 16 : soloCitta ? 11 : zone.length > 0 ? (zonaPiccola ? 12 : 7) : 12,
          })
        }
        requestAnimationFrame(() => {
          if (!annullato) map.invalidateSize()
        })
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
        .ladiva-mappa.leaflet-container {
          background: #d7e3ef;
          color: #111;
          font: 12px/1.4 Arial, Helvetica, sans-serif;
        }
        .ladiva-mappa .leaflet-tile,
        .ladiva-mappa .leaflet-container img,
        .ladiva-mappa.leaflet-container img {
          max-width: none !important;
          max-height: none !important;
        }
        .ladiva-mappa .leaflet-overlay-pane svg,
        .ladiva-mappa .leaflet-marker-pane svg {
          max-width: none !important;
          max-height: none !important;
        }
        .ladiva-mappa .leaflet-popup-content-wrapper,
        .ladiva-mappa .leaflet-popup-content,
        .ladiva-mappa .leaflet-tooltip,
        .ladiva-mappa .leaflet-tooltip.ladiva-mappa-etichetta {
          color: #111 !important;
          background: #fff !important;
        }
        .ladiva-mappa .leaflet-tooltip.ladiva-mappa-etichetta {
          border: 1px solid rgba(0, 0, 0, 0.35) !important;
          border-radius: 6px;
          box-shadow: none;
          font-weight: 650;
          padding: 2px 7px;
        }
      `}</style>
      <div ref={nodo} className="ladiva-mappa h-[70vh] min-h-[420px] w-full rounded-xl border border-white/15" />
    </>
  )
}
