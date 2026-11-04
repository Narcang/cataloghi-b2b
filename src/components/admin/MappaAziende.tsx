'use client'

import { useMemo, useState } from 'react'
import { MONDO_PATH } from '@/components/admin/mondoMappaPath'

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

function posizione(lng: number, lat: number) {
  return { x: lng + 180, y: 90 - lat }
}

export default function MappaAziende({ punti }: { punti: PuntoMappa[] }) {
  const [scelto, setScelto] = useState<string | null>(null)
  const attivi = useMemo(() => {
    const gruppi = new Map<string, PuntoMappa[]>()
    for (const punto of punti) {
      const chiave = `${punto.lat.toFixed(1)},${punto.lng.toFixed(1)}`
      const lista = gruppi.get(chiave) ?? []
      lista.push(punto)
      gruppi.set(chiave, lista)
    }
    const messi: { punto: PuntoMappa; x: number; y: number }[] = []
    for (const lista of gruppi.values()) {
      lista.forEach((punto, indice) => {
        const angolo = (indice / lista.length) * Math.PI * 2
        const scarto = lista.length > 1 ? 1.4 : 0
        const pos = posizione(punto.lng + Math.cos(angolo) * scarto, punto.lat + Math.sin(angolo) * scarto)
        messi.push({ punto, x: pos.x, y: pos.y })
      })
    }
    return messi
  }, [punti])
  const dettaglio = attivi.find((item) => item.punto.id === scelto) ?? null

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 360 180"
        role="img"
        aria-label="Mappa mondiale delle sedi"
        className="w-full h-auto rounded-xl border border-white/15 bg-[#0c1924]"
        onClick={() => setScelto(null)}
      >
        <rect width="360" height="180" fill="#0c1924" />
        {[30, 60, 90, 120, 150].map((y) => (
          <line key={`y-${y}`} x1="0" y1={y} x2="360" y2={y} stroke="#ffffff" strokeOpacity="0.06" />
        ))}
        {[60, 120, 180, 240, 300].map((x) => (
          <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="180" stroke="#ffffff" strokeOpacity="0.06" />
        ))}
        <path d={MONDO_PATH} fill="#314556" stroke="#6d8798" strokeWidth="0.15" />
        {attivi.map(({ punto, x, y }) => {
          const colore = COLORE_RUOLO[punto.ruolo] ?? '#ef4444'
          const aperto = scelto === punto.id
          return (
            <g key={punto.id} onClick={(event) => { event.stopPropagation(); setScelto(punto.id) }}>
              <circle cx={x} cy={y} r={aperto ? 2.4 : 1.7} fill={colore} stroke="#111" strokeWidth="0.25" className="cursor-pointer" />
            </g>
          )
        })}
      </svg>
      {dettaglio ? (
        <div
          className="absolute z-10 max-w-[220px] rounded-lg border border-white/20 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-lg"
          style={{
            left: `${(dettaglio.x / 360) * 100}%`,
            top: `${(dettaglio.y / 180) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          <p className="font-semibold">{dettaglio.punto.nome}</p>
          <p className="text-zinc-400">{dettaglio.punto.ruoloLabel}</p>
          <p>{dettaglio.punto.citta}</p>
        </div>
      ) : null}
    </div>
  )
}
