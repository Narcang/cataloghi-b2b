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
}

export default function AgenziaProfiloRiepilogo({ profilo, className = '' }: Props) {
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
      colonne={[
        { label: 'Campioni', compilato: hasAgenziaCampioni(campi), valori: campioni },
        { label: 'Cataloghi', compilato: hasAgenziaCataloghi(campi), valori: cataloghi },
      ]}
    />
  )
}
