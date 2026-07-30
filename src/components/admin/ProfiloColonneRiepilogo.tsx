import StoricoSpecializzazione from '@/components/admin/StoricoSpecializzazione'
import type { SezioneStorico } from '@/lib/profiloSpecializzazioneStorico'

export type ColonnaRiepilogo = {
  label: string
  compilato: boolean
  valori: string[]
}

type ColonnaProps = ColonnaRiepilogo & {
  className?: string
  /** Se true, con profiloId e sezione mostra il pulsante "Storico". */
  mostraDateAggiornamento?: boolean
  /** Admin/manager: X per rimuovere voci errate dallo storico. */
  canEliminareVociStorico?: boolean
  profiloId?: string
  sezione?: SezioneStorico
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
  className = '',
  mostraDateAggiornamento = false,
  canEliminareVociStorico = false,
  profiloId,
  sezione,
}: ColonnaProps) {
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
      {mostraDateAggiornamento && profiloId && sezione ? (
        <StoricoSpecializzazione
          profiloId={profiloId}
          sezione={sezione}
          canEliminareVoci={canEliminareVociStorico}
        />
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
