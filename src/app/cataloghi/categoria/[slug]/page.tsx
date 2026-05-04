import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'
import { categoryFromSlug } from '@/lib/catalogCategories'

/** Elenco cataloghi pubblici: sempre dati aggiornati da Supabase. */
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categoria = categoryFromSlug(slug)
  if (!categoria) {
    return { title: 'Categoria · Ladiva Ceramica' }
  }
  return {
    title: `${categoria} · Cataloghi · Ladiva Ceramica`,
    description: `Sfoglia i cataloghi pubblicati Ladiva nella linea ${categoria}.`,
  }
}

export default async function CataloghiPerCategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categoria = categoryFromSlug(slug)
  if (!categoria) notFound()

  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('cataloghi')
    .select('*')
    .eq('categoria', categoria)
    .eq('stato_pubblicazione', 'attivo')

  if (error) {
    return (
      <div className="ladiva-categoria-vetrina flex min-h-screen flex-col bg-black text-zinc-100 antialiased">
        <Header />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
          <p className="text-red-400">Errore nel caricamento dei cataloghi: {error.message}</p>
        </main>
      </div>
    )
  }

  const cataloghi = (rows ?? []).sort((a, b) => {
    const byTitle = (a.titolo ?? '').localeCompare(b.titolo ?? '', 'it', { sensitivity: 'base' })
    if (byTitle !== 0) return byTitle
    return a.id.localeCompare(b.id)
  })

  return (
    <div className="ladiva-categoria-vetrina flex min-h-screen flex-col bg-black text-zinc-100 antialiased">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8 md:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-200 underline-offset-4 hover:text-white hover:underline"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Torna alla homepage
        </Link>

        <header className="mb-10 border-b border-white/15 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Cataloghi pubblicati</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{categoria}</h1>
          <p className="mt-2 max-w-2xl text-zinc-300">
            Seleziona un altro settore dalla homepage. Per cataloghi riservati e strumenti B2B usa l&apos;accesso al portale.
          </p>
        </header>

        {cataloghi.length === 0 ? (
          <p className="text-lg text-zinc-400">Non ci sono cataloghi pubblicati in questa categoria al momento.</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cataloghi.map((catalogo) => (
              <li key={catalogo.id}>
                <Link
                  prefetch={false}
                  href={`/cataloghi/${catalogo.id}`}
                  className="group block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <div className="flex h-full flex-col overflow-hidden border border-white/20 bg-white text-zinc-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a96e] hover:shadow-[0_12px_40px_rgba(201,169,110,0.2)]">
                    <div className="relative aspect-[210/297] w-full overflow-hidden bg-zinc-100">
                      {catalogo.url_immagine ? (
                        <Image
                          src={catalogo.url_immagine}
                          alt={`Copertina ${catalogo.titolo}`}
                          fill
                          unoptimized
                          className="object-contain object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 text-zinc-600">
                          <FileText size={48} className="mb-3 text-[#060d41] opacity-40" />
                          <span className="text-xs font-medium uppercase tracking-widest">Nessuna immagine</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="mb-2 text-xl font-medium uppercase leading-tight tracking-wide text-zinc-900 md:text-2xl">
                        {catalogo.titolo}
                      </h2>
                      <p className="mb-4 text-base text-zinc-600">
                        {Array.isArray(catalogo.area_geografica_target)
                          ? catalogo.area_geografica_target.join(', ')
                          : catalogo.area_geografica_target || '—'}
                      </p>
                      <div className="mt-auto border-t border-black/10 pt-4">
                        <span className="text-sm font-medium uppercase tracking-wider text-[#060d41] group-hover:text-[#0a155a]">
                          Sfoglia catalogo →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="ladiva-root ladiva-root--auto ladiva-root-home-lower mt-auto">
        <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip">
          <div className="ladiva-home-footer-inner">
            <p className="mx-auto max-w-3xl text-center text-sm">
              © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
              {' · '}
              <Link href="/login" className="ladiva-footer-link whitespace-nowrap">
                Accedi al Portale Agenti →
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
