import {
  hasAgenziaCataloghi,
  hasAgenziaCampioni,
  pickAgenziaProfiloCampi,
  type AgenziaProfiloCampi,
} from '@/lib/agenziaProfiloOptions'
import { componiValoreConQuantitaEData } from '@/lib/profiloQuantita'
import ProfiloColonneRiepilogo, {
  ProfiloSpecializzazioneColonna,
} from '@/components/admin/ProfiloColonneRiepilogo'

type Props = {
  profilo: Partial<AgenziaProfiloCampi>
  className?: string
  mostraDateAggiornamento?: boolean
  /** Id del profilo: se presente insieme a mostraDateAggiornamento abilita lo storico. */
  profiloId?: string
}

function useAgenziaColonne(profilo: Partial<AgenziaProfiloCampi>) {
  const campi = pickAgenziaProfiloCampi(profilo)
  const campioni = [
    componiValoreConQuantitaEData(campi.agenzia_campione_1, campi.agenzia_campione_1_qta, campi.agenzia_campione_1_data),
    componiValoreConQuantitaEData(campi.agenzia_campione_2, campi.agenzia_campione_2_qta, campi.agenzia_campione_2_data),
  ].filter((v): v is string => Boolean(v))
  const cataloghi = [
    componiValoreConQuantitaEData(campi.agenzia_catalogo_1, campi.agenzia_catalogo_1_qta, campi.agenzia_catalogo_1_data),
    componiValoreConQuantitaEData(campi.agenzia_catalogo_2, campi.agenzia_catalogo_2_qta, campi.agenzia_catalogo_2_data),
  ].filter((v): v is string => Boolean(v))
  return { campi, campioni, cataloghi }
}

export function AgenziaCampioniColonna({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
  profiloId,
}: Props) {
  const { campi, campioni } = useAgenziaColonne(profilo)
  return (
    <ProfiloSpecializzazioneColonna
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      profiloId={profiloId}
      sezione="campioni"
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
  profiloId,
}: Props) {
  const { campi, cataloghi } = useAgenziaColonne(profilo)
  return (
    <ProfiloSpecializzazioneColonna
      className={className}
      mostraDateAggiornamento={mostraDateAggiornamento}
      profiloId={profiloId}
      sezione="cataloghi"
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
