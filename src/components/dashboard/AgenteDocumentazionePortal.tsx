import ReservedCatalogPortal from '@/components/dashboard/ReservedCatalogPortal'

export default function AgenteDocumentazionePortal() {
  return (
    <ReservedCatalogPortal
      sectionId="area-documentazione-agente"
      href="/dashboard/documentazione-agente"
      iconSrc="/dashboard/icona-agenti.png"
      iconAlt="Documentazione riservata Agente"
      caption="Documentazione riservata Agente"
    />
  )
}
