import {
  hasRivenditoreBoxShowRoom,
  hasRivenditoreEspositori,
  pickRivenditoreProfiloCampi,
  type RivenditoreProfiloCampi,
} from '@/lib/rivenditoreProfiloOptions'
import { componiValoreConQuantitaEData } from '@/lib/profiloQuantita'
import ProfiloColonneRiepilogo, {
  ProfiloSpecializzazioneColonna,
} from '@/components/admin/ProfiloColonneRiepilogo'

type Props = {
  profilo: Partial<RivenditoreProfiloCampi>
  className?: string
  mostraDateAggiornamento?: boolean
}

function useRivenditoreColonne(profilo: Partial<RivenditoreProfiloCampi>) {
  const campi = pickRivenditoreProfiloCampi(profilo)
  const espositori = [
    componiValoreConQuantitaEData(campi.espositore_1, campi.espositore_1_qta, campi.espositore_1_data),
    componiValoreConQuantitaEData(campi.espositore_2, campi.espositore_2_qta, campi.espositore_2_data),
  ].filter((v): v is string => Boolean(v))
  const box = [
    componiValoreConQuantitaEData(campi.box_show_room_1, campi.box_show_room_1_qta, campi.box_show_room_1_data),
    componiValoreConQuantitaEData(campi.box_show_room_2, campi.box_show_room_2_qta, campi.box_show_room_2_data),
    componiValoreConQuantitaEData(campi.box_show_room_3, campi.box_show_room_3_qta, campi.box_show_room_3_data),
    componiValoreConQuantitaEData(campi.box_show_room_4, campi.box_show_room_4_qta, campi.box_show_room_4_data),
  ].filter((v): v is string => Boolean(v))
  return { campi, espositori, box }
}

export function RivenditoreEspositoriColonna({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const { campi, espositori } = useRivenditoreColonne(profilo)
  return (
    <ProfiloSpecializzazioneColonna
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      label="Espositori"
      compilato={hasRivenditoreEspositori(campi)}
      valori={espositori}
      aggiornatoIl={campi.espositori_aggiornato_il}
    />
  )
}

export function RivenditoreBoxColonna({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const { campi, box } = useRivenditoreColonne(profilo)
  return (
    <ProfiloSpecializzazioneColonna
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      label="Box"
      compilato={hasRivenditoreBoxShowRoom(campi)}
      valori={box}
      aggiornatoIl={campi.box_aggiornato_il}
    />
  )
}

export default function RivenditoreProfiloRiepilogo({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const { campi, espositori, box } = useRivenditoreColonne(profilo)

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
