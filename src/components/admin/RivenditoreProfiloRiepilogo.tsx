import {
  hasRivenditoreProfiloCampi,
  pickRivenditoreProfiloCampi,
  type RivenditoreProfiloCampi,
} from '@/lib/rivenditoreProfiloOptions'

type Props = {
  profilo: Partial<RivenditoreProfiloCampi>
  className?: string
}

export default function RivenditoreProfiloRiepilogo({ profilo, className = '' }: Props) {
  const campi = pickRivenditoreProfiloCampi(profilo)
  if (!hasRivenditoreProfiloCampi(campi)) return null

  const rows: [string | null, string | null][] = [
    [campi.espositore_1, campi.espositore_2],
    [campi.box_show_room_1, campi.box_show_room_2],
    [campi.box_show_room_3, campi.box_show_room_4],
  ]

  return (
    <div className={`text-center ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
        Espositori e Box
      </p>
      <div className="mt-1.5 inline-grid grid-cols-2 gap-x-4 gap-y-0.5 text-left">
        {rows.map((row, rowIndex) =>
          row.map((value, colIndex) =>
            value ? (
              <p
                key={`${rowIndex}-${colIndex}`}
                className="text-xs text-zinc-500 leading-snug max-w-[9.5rem]"
              >
                {value}
              </p>
            ) : (
              <span key={`${rowIndex}-${colIndex}`} className="block min-h-[1rem]" aria-hidden />
            ),
          ),
        )}
      </div>
    </div>
  )
}
