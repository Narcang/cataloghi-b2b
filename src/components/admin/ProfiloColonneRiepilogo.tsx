import { formatProfiloAggiornatoIl } from '@/lib/profiloSpecializzazioneDate'

export type ColonnaRiepilogo = {
  label: string
  compilato: boolean
  valori: string[]
  aggiornatoIl?: string | null
}

type ColonnaProps = ColonnaRiepilogo & {
  className?: string
  mostraDateAggiornamento?: boolean
}

function CampoStatusQuadrato({ compilato }: { compilato: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-none ${
        compilato ? 'bg-green-500' : 'bg-red-500'
      }`}
      aria-hidden
    />
  )
}

export function ProfiloSpecializzazioneColonna({
  label,
  compilato,
  valori,
  aggiornatoIl,
  className = '',
  mostraDateAggiornamento = false,
}: ColonnaProps) {
  const dataLabel = formatProfiloAggiornatoIl(aggiornatoIl)

  return (
    <div className={`min-w-0 text-left ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700 flex items-center gap-1.5">
        <CampoStatusQuadrato compilato={compilato} />
        {label}
      </p>
      {valori.length > 0 ? (
        <div className="mt-1 space-y-0.5">
          {valori.map((value, index) => (
            <p
              key={`${label}-${index}-${value}`}
              className="text-xs text-zinc-500 leading-snug max-w-[10rem]"
            >
              {value}
            </p>
          ))}
        </div>
      ) : null}
      {mostraDateAggiornamento && dataLabel ? (
        <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">Agg. {dataLabel}</p>
      ) : null}
    </div>
  )
}

type Props = {
  colonne: ColonnaRiepilogo[]
  className?: string
  mostraDateAggiornamento?: boolean
}

/** Due colonne affiancate (legacy); in gerarchia usare ProfiloSpecializzazioneColonna singole. */
export default function ProfiloColonneRiepilogo({
  colonne,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  return (
    <div className={`grid grid-cols-2 gap-x-6 ${className}`.trim()}>
      {colonne.map((colonna) => (
        <ProfiloSpecializzazioneColonna
          key={colonna.label}
          {...colonna}
          mostraDateAggiornamento={mostraDateAggiornamento}
        />
      ))}
    </div>
  )
}
