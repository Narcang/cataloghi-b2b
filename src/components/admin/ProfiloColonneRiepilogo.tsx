import { formatProfiloAggiornatoIl } from '@/lib/profiloSpecializzazioneDate'

export type ColonnaRiepilogo = {
  label: string
  compilato: boolean
  valori: string[]
  aggiornatoIl?: string | null
}

type Props = {
  colonne: ColonnaRiepilogo[]
  className?: string
  mostraDateAggiornamento?: boolean
}

function CampoStatusDot({ compilato }: { compilato: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        compilato ? 'bg-green-500' : 'bg-red-500'
      }`}
      aria-hidden
    />
  )
}

function CampoColonna({
  label,
  compilato,
  valori,
  aggiornatoIl,
  mostraDateAggiornamento,
}: ColonnaRiepilogo & { mostraDateAggiornamento: boolean }) {
  const dataLabel = formatProfiloAggiornatoIl(aggiornatoIl)

  return (
    <div className="min-w-0 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700 flex items-center gap-1.5">
        <CampoStatusDot compilato={compilato} />
        {label}
      </p>
      {valori.length > 0 ? (
        <div className="mt-1 space-y-0.5">
          {valori.map((value, index) => (
            <p
              key={`${label}-${index}-${value}`}
              className="text-xs text-zinc-500 leading-snug max-w-[9.5rem]"
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

export default function ProfiloColonneRiepilogo({
  colonne,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  return (
    <div className={`grid grid-cols-2 gap-x-6 ${className}`.trim()}>
      {colonne.map((colonna) => (
        <CampoColonna
          key={colonna.label}
          {...colonna}
          mostraDateAggiornamento={mostraDateAggiornamento}
        />
      ))}
    </div>
  )
}
