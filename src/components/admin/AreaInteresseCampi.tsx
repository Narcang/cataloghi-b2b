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
  const suggerimenti = filtroNazione.trim()
    ? NAZIONI_MENU.filter((voce) => nazioneNelFiltro(voce.id, voce.nome, filtroNazione)).slice(0, 8)
    : []
  const regioni = nazione ? regioniDellaNazione(nazione) : []
  const nazioniAperte = (() => {
    const viste = new Set<string>()
    const lista: string[] = []
    for (const id of nazioniIntere) {
      if (viste.has(id)) continue
      viste.add(id)
      lista.push(id)
    }
    for (const id of scelte) {
      const iso = nazioneDi(id)
      if (!iso || viste.has(iso)) continue
      viste.add(iso)
      lista.push(iso)
    }
    return lista
  })()
  const coloreAttivo = coloreAreaValido(colore) ?? colorePredefinitoRuolo(ruolo)

  function scegliNazione(iso: string) {
    setNazione(iso)
    setFiltroNazione('')
    if (!iso) return
    const haRegioni = scelte.some((id) => nazioneDi(id) === iso)
    setNazioniIntere((correnti) => {
      if (haRegioni) return correnti.filter((id) => id !== iso)
      return correnti.includes(iso) ? correnti : [...correnti, iso]
    })
  }

  function confermaNazioneScritta() {
    const testo = filtroNazione.trim().toLocaleLowerCase('it')
    if (!testo) return
    const esatta = NAZIONI_MENU.find((voce) => voce.nome.toLocaleLowerCase('it') === testo)
    const unica = suggerimenti.length === 1 ? suggerimenti[0] : null
    const scelta = esatta ?? unica
    if (scelta) scegliNazione(scelta.id)
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
        <div className="relative mt-2">
          <label className="block text-xs font-medium uppercase text-zinc-600">
            Nazioni
            <input
              type="text"
              value={filtroNazione}
              onChange={(event) => setFiltroNazione(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                confermaNazioneScritta()
              }}
              onBlur={() => confermaNazioneScritta()}
              onTouchStart={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              placeholder="Scrivi e conferma: Francia, Olanda, Spagna"
              className="mt-1 h-9 w-full rounded-md border border-black bg-white px-2 text-sm normal-case"
            />
          </label>
          {suggerimenti.length > 0 ? (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-black bg-white">
              {suggerimenti.map((voce) => (
                <button
                  key={voce.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    scegliNazione(voce.id)
                  }}
                  className="block w-full px-2 py-1.5 text-left text-sm normal-case text-zinc-800 hover:bg-zinc-100"
                >
                  {voce.nome}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {nazioniAperte.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {nazioniAperte.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setNazione(id)}
                className={`rounded-full border px-2 py-1 text-sm normal-case ${id === nazione ? 'border-white bg-white/15' : 'border-black/20'}`}
              >
                {nomeNazione(id) ?? id}
              </button>
            ))}
          </div>
        ) : null}
        {regioni.length > 0 ? (
          <>
            <p className="mt-3 text-xs font-medium uppercase text-zinc-600">Regioni</p>
            <div className="mt-2 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
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
          </>
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
