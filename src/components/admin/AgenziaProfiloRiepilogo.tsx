import {
  hasAgenziaCataloghi,
  hasAgenziaCampioni,
  pickAgenziaProfiloCampi,
  type AgenziaProfiloCampi,
} from '@/lib/agenziaProfiloOptions'
import ProfiloColonneRiepilogo from '@/components/admin/ProfiloColonneRiepilogo'

type Props = {
  profilo: Partial<AgenziaProfiloCampi>
  className?: string
  mostraDateAggiornamento?: boolean
}

export default function AgenziaProfiloRiepilogo({
  profilo,
  className = '',
  mostraDateAggiornamento = false,
}: Props) {
  const campi = pickAgenziaProfiloCampi(profilo)
  const campioni = [campi.agenzia_campione_1, campi.agenzia_campione_2].filter((v): v is string =>
    Boolean(v?.trim()),
  )
  const cataloghi = [campi.agenzia_catalogo_1, campi.agenzia_catalogo_2].filter((v): v is string =>
    Boolean(v?.trim()),
  )

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
