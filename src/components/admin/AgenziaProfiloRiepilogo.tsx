import {
  hasAgenziaCataloghi,
  hasAgenziaCampioni,
  pickAgenziaProfiloCampi,
  type AgenziaProfiloCampi,
} from '@/lib/agenziaProfiloOptions'
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
  const campioni = [campi.agenzia_campione_1, campi.agenzia_campione_2].filter((v): v is string =>
    Boolean(v?.trim()),
  )
  const cataloghi = [campi.agenzia_catalogo_1, campi.agenzia_catalogo_2].filter((v): v is string =>
    Boolean(v?.trim()),
  )
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
