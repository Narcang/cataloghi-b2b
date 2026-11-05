'use client'

import { useState } from 'react'
import {
  COLORI_AREA,
  NAZIONI,
  coloreAreaValido,
  colorePredefinitoRuolo,
  nazioneDi,
  nazioneIniziale,
  nomeRegione,
  regioniDellaNazione,
} from '@/lib/areaInteresse'

export default function AreaInteresseCampi({
  aree,
  colore,
  ruolo,
}: {
  aree?: string[] | null
  colore?: string | null
  ruolo: string
}) {
  const attive = (aree ?? []).filter((id) => nomeRegione(id))
  const [nazione, setNazione] = useState(() => nazioneIniziale(attive))
  const [scelte, setScelte] = useState<string[]>(attive)
  const regioni = regioniDellaNazione(nazione)
  const coloreAttivo = coloreAreaValido(colore) ?? colorePredefinitoRuolo(ruolo)

  function alterna(id: string, acceso: boolean) {
    setScelte((correnti) => {
      if (acceso) return correnti.includes(id) ? correnti : [...correnti, id]
      return correnti.filter((voce) => voce !== id)
    })
  }

  return (
    <div className="md:col-span-2 space-y-3 rounded-md border border-black/20 px-3 py-3">
      <input type="hidden" name="aree_interesse_invio" value="1" />
      {scelte.map((id) => (
        <input key={id} type="hidden" name="area_interesse" value={id} />
      ))}
      <div>
        <p className="text-xs font-medium uppercase text-zinc-600">Colore zona</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {COLORI_AREA.map((voce) => (
            <label key={voce.id} className="inline-flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="radio"
                name="colore_area"
                value={voce.id}
                defaultChecked={voce.id === coloreAttivo}
                className="rounded-full border-black"
              />
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/40"
                style={{ backgroundColor: voce.hex }}
              />
              {voce.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-zinc-600">Area di interesse</p>
        <p className="mt-1 text-sm text-zinc-700">
          {scelte.length > 0 ? (
            <>
              Scelte:{' '}
              {scelte.map((id, indice) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNazione(nazioneDi(id) ?? nazione)}
                  className="underline"
                >
                  {nomeRegione(id)}
                  {indice < scelte.length - 1 ? ', ' : ''}
                </button>
              ))}
            </>
          ) : (
            'Nessuna regione selezionata'
          )}
        </p>
        <label className="mt-2 block text-xs font-medium uppercase text-zinc-600">
          Nazione
          <select
            value={nazione}
            onChange={(event) => setNazione(event.target.value)}
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="mt-1 h-9 w-full rounded-md border border-black bg-white px-2 text-sm normal-case"
          >
            {NAZIONI.map((voce) => (
              <option key={voce.id} value={voce.id}>
                {voce.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
          {regioni.map((regione) => (
            <label key={regione.id} className="inline-flex items-center gap-2 text-sm normal-case text-zinc-800">
              <input
                type="checkbox"
                checked={scelte.includes(regione.id)}
                onChange={(event) => alterna(regione.id, event.target.checked)}
                className="rounded border-black"
              />
              {regione.nome}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
