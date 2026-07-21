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
  mostraDateAggiornamento?: boolean
}

export default function RivenditoreProfiloRiepilogo({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
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
      mostraDateAggiornamento={mostraDateAggiornamento}
      colonne={[
        {
          label: 'Espositori',
          compilato: hasRivenditoreEspositori(campi),
          valori: espositori,
          aggiornatoIl: campi.espositori_aggiornato_il,
        },
        {
          label: 'Box',
          compilato: hasRivenditoreBoxShowRoom(campi),
          valori: box,
          aggiornatoIl: campi.box_aggiornato_il,
        },
      ]}
    />
  )
}
