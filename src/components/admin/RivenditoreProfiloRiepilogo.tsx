import {
  hasRivenditoreBoxShowRoom,
  hasRivenditoreEspositori,
  pickRivenditoreProfiloCampi,
  type RivenditoreProfiloCampi,
} from '@/lib/rivenditoreProfiloOptions'
import ProfiloColonneRiepilogo from '@/components/admin/ProfiloColonneRiepilogo'

type Props = {
  profilo: Partial<RivenditoreProfiloCampi>
  className?: string
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
    <ProfiloColonneRiepilogo
      className={className}
      colonne={[
        { label: 'Espositori', compilato: hasRivenditoreEspositori(campi), valori: espositori },
        { label: 'Box', compilato: hasRivenditoreBoxShowRoom(campi), valori: box },
      ]}
    />
  )
}
