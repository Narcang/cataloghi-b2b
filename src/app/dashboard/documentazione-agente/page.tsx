import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import Header from '@/components/Header'
import DashboardReservedBackNav from '@/components/dashboard/DashboardReservedBackNav'
import DashboardCatalogSections from '@/components/dashboard/DashboardCatalogSections'
import DashboardHashScroll from '@/components/DashboardHashScroll'
import { createClient } from '@/utils/supabase/server'
import {
  agenteReservedDashboardCategories,
  isAgenteReservedCategory,
} from '@/lib/catalogCategories'

export default async function DocumentazioneAgentePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profilo } = await supabase
    .from('profili')
    .select('nome_completo, ruolo, registrazione_approvata')
    .eq('id', user.id)
    .single()

  if (profilo?.ruolo !== 'agente') {
    redirect('/dashboard')
  }

  if (profilo.registrazione_approvata === false) {
    redirect('/dashboard')
  }

  const { data: cataloghi, error: cataloghiError } = await supabase
    .from('cataloghi')
    .select('id, titolo, categoria, url_immagine, stato_pubblicazione, area_geografica_target')
    .eq('stato_pubblicazione', 'attivo')
    .order('creato_il', { ascending: false })

  const cataloghiAgente = (cataloghi ?? []).filter((c) =>
    isAgenteReservedCategory(c.categoria as string | null),
  )

  const categorie = agenteReservedDashboardCategories()

  return (
    <div className="ladiva-root ladiva-root-app-dark min-h-screen flex flex-col">
      <Header />
      <DashboardHashScroll />

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 space-y-10">
        <div className="mt-4">
          <DashboardReservedBackNav areaLabel="area riservata agente" />
          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight mt-1 mb-2">
            Documentazione riservata Agente
          </h1>
          <p className="text-zinc-600 max-w-2xl text-lg">
            {profilo.nome_completo ? `Bentornato ${profilo.nome_completo}. ` : ''}
            Qui trovi la documentazione riservata al tuo profilo agente.
          </p>
        </div>

        <section id="cataloghi-documentazione-agente">
          <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
            <h2 className="text-3xl md:text-4xl font-sans tracking-tight text-zinc-100 flex items-center gap-3">
              <FileText className="text-white" /> Agenti
            </h2>
          </div>

          {cataloghiError ? (
            <div className="text-red-700 p-4 border border-red-300 bg-red-50 rounded-xl">
              Errore nel caricamento: {cataloghiError.message}
            </div>
          ) : (
            <DashboardCatalogSections categorie={categorie} cataloghi={cataloghiAgente} />
          )}
        </section>
      </main>
    </div>
  )
}
