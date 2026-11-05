import {
  COLORI_AREA,
  REGIONI_ITALIA,
  coloreAreaValido,
  colorePredefinitoRuolo,
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
  const scelte = new Set(aree ?? [])
  const coloreAttivo = coloreAreaValido(colore) ?? colorePredefinitoRuolo(ruolo)

  return (
    <div className="md:col-span-2 space-y-3 rounded-md border border-black/20 px-3 py-3">
      <input type="hidden" name="aree_interesse_invio" value="1" />
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
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
          {REGIONI_ITALIA.map((regione) => (
            <label key={regione.id} className="inline-flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                name="area_interesse"
                value={regione.id}
                defaultChecked={scelte.has(regione.id)}
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
