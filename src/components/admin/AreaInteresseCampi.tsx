'use client'

import { useState } from 'react'
import {
  COLORI_AREA,
  NAZIONI_MENU,
  coloreAreaValido,
  colorePredefinitoRuolo,
  nazioneDi,
  nazioneNelFiltro,
  nomeNazione,
  nomeRegione,
  nazioniValide,
  regioniDellaNazione,
} from '@/lib/areaInteresse'

function nazioneDiPartenza(regioni: string[], nazioniIntere: string[]): string {
  if (nazioniIntere[0]) return nazioniIntere[0]
  for (const id of regioni) {
    const nazione = nazioneDi(id)
    if (nazione) return nazione
  }
  return ''
}

export default function AreaInteresseCampi({
  aree,
  nazioni,
  cittaCoperte,
  colore,
  ruolo,
}: {
  aree?: string[] | null
  nazioni?: string[] | null
  cittaCoperte?: string | null
  colore?: string | null
  ruolo: string
}) {
  const attive = (aree ?? []).filter((id) => nomeRegione(id))
  const nazioniSalvate = nazioniValide(nazioni).filter((iso) => !attive.some((id) => nazioneDi(id) === iso))
  const [nazione, setNazione] = useState(() => nazioneDiPartenza(attive, nazioniSalvate))
  const [nazioniIntere, setNazioniIntere] = useState<string[]>(nazioniSalvate)
  const [filtroNazione, setFiltroNazione] = useState('')
  const [scelte, setScelte] = useState<string[]>(attive)
  const nazioniVisibili = NAZIONI_MENU.filter(
    (voce) => voce.id === nazione || nazioneNelFiltro(voce.id, voce.nome, filtroNazione),
  )
  const regioni = nazione ? regioniDellaNazione(nazione) : []
  const coloreAttivo = coloreAreaValido(colore) ?? colorePredefinitoRuolo(ruolo)

  function scegliNazione(iso: string) {
    setNazione(iso)
    if (!iso) return
    const haRegioni = scelte.some((id) => nazioneDi(id) === iso)
    setNazioniIntere((correnti) => {
      if (haRegioni) return correnti.filter((id) => id !== iso)
      return correnti.includes(iso) ? correnti : [...correnti, iso]
    })
  }

  function alterna(id: string, acceso: boolean) {
    const iso = nazioneDi(id)
    setScelte((correnti) => {
      const prossime = acceso
        ? correnti.includes(id) ? correnti : [...correnti, id]
        : correnti.filter((voce) => voce !== id)
      if (iso) {
        const resta = prossime.some((voce) => nazioneDi(voce) === iso)
        setNazioniIntere((lista) =>
          resta ? lista.filter((voce) => voce !== iso) : lista.includes(iso) ? lista : [...lista, iso],
        )
      }
      return prossime
    })
  }

  return (
    <div className="md:col-span-2 space-y-3 rounded-md border border-black/20 px-3 py-3">
      <input type="hidden" name="aree_interesse_invio" value="1" />
      {scelte.map((id) => (
        <input key={id} type="hidden" name="area_interesse" value={id} />
      ))}
      {nazioniIntere.map((id) => (
        <input key={id} type="hidden" name="nazione_interesse" value={id} />
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
        <p className="mt-1 text-sm normal-case text-zinc-500">
          Senza regioni, la sede copre tutta la nazione. Con le regioni, solo quelle. Se indichi delle città, in mappa restano solo le città.
        </p>
        <p className="mt-1 text-sm text-zinc-700">
          {nazioniIntere.length > 0 || scelte.length > 0 ? (
            <>
              Scelte:{' '}
              {nazioniIntere.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNazione(id)}
                  className="mr-2 underline"
                >
                  Tutta {nomeNazione(id) ?? id}
                </button>
              ))}
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
            'Nessuna zona selezionata'
          )}
        </p>
        <label className="mt-2 block text-xs font-medium uppercase text-zinc-600">
          Nazione
          <input
            type="search"
            value={filtroNazione}
            onChange={(event) => setFiltroNazione(event.target.value)}
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            placeholder="Es. Olanda, Paesi Bassi, Netherlands"
            className="mt-1 h-9 w-full rounded-md border border-black bg-white px-2 text-sm normal-case"
          />
          <select
            value={nazione}
            onChange={(event) => scegliNazione(event.target.value)}
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="mt-1 h-9 w-full rounded-md border border-black bg-white px-2 text-sm normal-case"
          >
            <option value="">Scegli la nazione</option>
            {nazioniVisibili.map((voce) => (
              <option key={voce.id} value={voce.id}>
                {voce.nome}
              </option>
            ))}
          </select>
        </label>
        {regioni.length > 0 ? (
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
        ) : null}
        <label className="mt-3 block text-xs font-medium uppercase text-zinc-600">
          Città coperte
          <input
            name="citta_coperte"
            type="text"
            defaultValue={cittaCoperte ?? ''}
            placeholder="Es. Napoli, Salerno"
            onTouchStart={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="mt-1 h-9 w-full rounded-md border border-black bg-white px-2 text-sm normal-case"
          />
        </label>
      </div>
    </div>
  )
}
