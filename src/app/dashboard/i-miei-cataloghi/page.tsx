import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import {
  categoriesVisibleOnDashboard,
  categoryToDomId,
  isAgentOnlyCatalogCategory,
  isCatalogCategoryAllowedForStudioRole,
  isLoginOnlyCatalogCategory,
} from '@/lib/catalogCategories'
import { catalogPdfHref, dashboardCatalogReturnTo } from '@/lib/catalogNavigation'
import { compareCatalogTitoli } from '@/lib/catalogSorting'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'I Miei Cataloghi · Ladiva Ceramica',
}

export default async function IMieiCataloghiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo, registrazione_approvata')
    .eq('id', user.id)
    .single()

  const ruoloCorrente = profilo?.ruolo ?? 'free'
  const isAdmin = ruoloCorrente === 'admin'
  const isManager = isAdmin || ruoloCorrente === 'manager'
  const isPartner = ruoloCorrente === 'distributore'
  const isStudio = ruoloCorrente === 'studio'

  if (isManager) {
    redirect('/dashboard/gestione-cataloghi')
  }

  const inAttesaApprovazione = Boolean(profilo && profilo.registrazione_approvata === false)

  let cataloghi: {
    id: string
    titolo: string | null
    categoria: string | null
    url_immagine: string | null
    stato_pubblicazione: string | null
  }[] = []
  let cataloghiError: { message: string } | null = null

  if (!inAttesaApprovazione) {
    let query = supabase
      .from('cataloghi')
      .select('id, titolo, categoria, url_immagine, stato_pubblicazione')
      .eq('stato_pubblicazione', 'attivo')
      .order('creato_il', { ascending: false })

    const { data, error } = await query
    cataloghi = data ?? []
    cataloghiError = error
  }

  const cataloghiPerVista = cataloghi.filter((c) => {
    if (isLoginOnlyCatalogCategory(c.categoria)) return false
    if (isPartner && isAgentOnlyCatalogCategory(c.categoria)) return false
    if (isStudio && !isCatalogCategoryAllowedForStudioRole(c.categoria)) return false
    return true
  })

  const categorieDashboard = categoriesVisibleOnDashboard(ruoloCorrente, true)

  return (
    <div className="ladiva-root ladiva-root-app-dark min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 space-y-12">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Area Riservata
          </Link>
        </div>

        <div className="border-b border-black pb-6">
          <h1 className="text-4xl md:text-5xl font-sans tracking-tight text-zinc-100">
            Tutti i Cataloghi
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Cataloghi disponibili per il tuo profilo.
          </p>
        </div>

        {inAttesaApprovazione ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-zinc-900">
            <p className="text-lg text-zinc-800">
              I cataloghi saranno disponibili dopo l&apos;approvazione dell&apos;account da parte di Ladiva.
            </p>
          </div>
        ) : cataloghiError ? (
          <div className="text-red-700 p-4 border border-red-300 bg-red-50 rounded-xl">
            Errore nel caricamento: {cataloghiError.message}
          </div>
        ) : (
          <div className="space-y-12">
            {categorieDashboard.map((categoria) => {
              const items = cataloghiPerVista
                .filter((c) => c.categoria === categoria)
                .sort((a, b) => {
                  const byTitle = compareCatalogTitoli(a.titolo, b.titolo)
                  if (byTitle !== 0) return byTitle
                  return a.id.localeCompare(b.id)
                })
              if (items.length === 0) return null
              return (
                <section
                  key={categoria}
                  id={categoryToDomId(categoria)}
                  className="scroll-mt-32 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl text-zinc-100 font-semibold tracking-wide">
                      {categoria}
                    </h2>
                    <span className="text-xs rounded-full border border-black px-2 py-0.5 text-zinc-500">
                      {items.length} catalogh{items.length === 1 ? 'o' : 'i'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((catalogo) => (
                      <Link
                        key={catalogo.id}
                        prefetch={false}
                        href={catalogPdfHref(catalogo.id, dashboardCatalogReturnTo(catalogo.categoria))}
                        className="group block focus:outline-none focus:ring-2 focus:ring-[#060d41] rounded-none"
                      >
                        <div className="bg-white border border-black rounded-none overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#060d41] hover:shadow-[0_12px_40px_rgba(6,13,65,0.1)] flex flex-col h-full">
                          <div className="relative w-full aspect-[210/297] bg-zinc-100 overflow-hidden">
                            {catalogo.url_immagine ? (
                              <Image
                                src={catalogo.url_immagine}
                                alt={`Copertina ${catalogo.titolo}`}
                                fill
                                unoptimized
                                className="object-contain object-top transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-zinc-50/50">
                                <FileText size={48} className="mb-3 text-[#060d41] opacity-40" />
                                <span className="text-xs font-medium tracking-widest uppercase">Nessuna Immagine</span>
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-2xl text-zinc-900 font-medium uppercase tracking-wide leading-tight mb-1">
                              {catalogo.titolo}
                            </h3>
                            <p className="text-zinc-600 text-base">
                              {catalogo.categoria ?? 'Senza categoria'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
            {categorieDashboard.every(
              (cat) => cataloghiPerVista.filter((c) => c.categoria === cat).length === 0
            ) && (
              <p className="text-zinc-400 text-center py-12">
                Nessun catalogo disponibile al momento.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
