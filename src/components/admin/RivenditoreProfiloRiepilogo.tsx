import {
  hasRivenditoreBoxShowRoom,
  hasRivenditoreEspositori,
  pickRivenditoreProfiloCampi,
  type RivenditoreProfiloCampi,
} from '@/lib/rivenditoreProfiloOptions'

type Props = {
  profilo: Partial<RivenditoreProfiloCampi>
  className?: string
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
}: {
  label: string
  compilato: boolean
  valori: string[]
}) {
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
    </div>
  )
}

export default function RivenditoreProfiloRiepilogo({ profilo, className = '' }: Props) {
  const campi = pickRivenditoreProfiloCampi(profilo)
  const espositori = [campi.espositore_1, campi.espositore_2].filter((v): v is string => Boolean(v?.trim()))
  const box = [
    campi.box_show_room_1,
    campi.box_show_room_2,
    campi.box_show_room_3,
    campi.box_show_room_4,
  ].filter((v): v is string => Boolean(v?.trim()))

  return (
    <div className={`grid grid-cols-2 gap-x-6 ${className}`.trim()}>
      <CampoColonna label="Espositori" compilato={hasRivenditoreEspositori(campi)} valori={espositori} />
      <CampoColonna label="Box" compilato={hasRivenditoreBoxShowRoom(campi)} valori={box} />
    </div>
  )
}
