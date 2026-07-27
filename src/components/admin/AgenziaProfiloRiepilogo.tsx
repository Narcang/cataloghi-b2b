import {
  hasAgenziaCataloghi,
  hasAgenziaCampioni,
  pickAgenziaProfiloCampi,
  type AgenziaProfiloCampi,
} from '@/lib/agenziaProfiloOptions'
import { componiValoreConQuantita } from '@/lib/profiloQuantita'
import ProfiloColonneRiepilogo, {
  ProfiloSpecializzazioneColonna,
} from '@/components/admin/ProfiloColonneRiepilogo'

type Props = {
  profilo: Partial<AgenziaProfiloCampi>
  className?: string
  mostraDateAggiornamento?: boolean
}

function useAgenziaColonne(profilo: Partial<AgenziaProfiloCampi>) {
  const campi = pickAgenziaProfiloCampi(profilo)
  const campioni = [
    componiValoreConQuantita(campi.agenzia_campione_1, campi.agenzia_campione_1_qta),
    componiValoreConQuantita(campi.agenzia_campione_2, campi.agenzia_campione_2_qta),
  ].filter((v): v is string => Boolean(v))
  const cataloghi = [
    componiValoreConQuantita(campi.agenzia_catalogo_1, campi.agenzia_catalogo_1_qta),
    componiValoreConQuantita(campi.agenzia_catalogo_2, campi.agenzia_catalogo_2_qta),
  ].filter((v): v is string => Boolean(v))
  return { campi, campioni, cataloghi }
}

export function AgenziaCampioniColonna({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const { campi, campioni } = useAgenziaColonne(profilo)
  return (
    <ProfiloSpecializzazioneColonna
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      label="Campioni"
      compilato={hasAgenziaCampioni(campi)}
      valori={campioni}
      aggiornatoIl={campi.agenzia_campioni_aggiornato_il}
    />
  )
}

export function AgenziaCataloghiColonna({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const { campi, cataloghi } = useAgenziaColonne(profilo)
  return (
    <ProfiloSpecializzazioneColonna
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      label="Cataloghi"
      compilato={hasAgenziaCataloghi(campi)}
      valori={cataloghi}
      aggiornatoIl={campi.agenzia_cataloghi_aggiornato_il}
    />
  )
}

export default function AgenziaProfiloRiepilogo({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const { campi, campioni, cataloghi } = useAgenziaColonne(profilo)

  return (
    <ProfiloColonneRiepilogo
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      colonne={[
        {
          label: 'Campioni',
          compilato: hasAgenziaCampioni(campi),
          valori: campioni,
          aggiornatoIl: campi.agenzia_campioni_aggiornato_il,
        },
        {
          label: 'Cataloghi',
          compilato: hasAgenziaCataloghi(campi),
          valori: cataloghi,
          aggiornatoIl: campi.agenzia_cataloghi_aggiornato_il,
        },
      ]}
    />
  )
}
