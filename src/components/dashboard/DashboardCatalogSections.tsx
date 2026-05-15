import Link from 'next/link'
import Image from 'next/image'
import { FileText } from 'lucide-react'
import { categoryToDomId, type CatalogCategory } from '@/lib/catalogCategories'

export type DashboardCatalogo = {
  id: string
  titolo: string | null
  categoria: string | null
  url_immagine: string | null
  stato_pubblicazione: string | null
  area_geografica_target: string[] | string | null
}

type DashboardCatalogSectionsProps = {
  categorie: readonly CatalogCategory[]
  cataloghi: DashboardCatalogo[]
}

export default function DashboardCatalogSections({
  categorie,
  cataloghi,
}: DashboardCatalogSectionsProps) {
  return (
    <div className="space-y-10">
      {categorie.map((categoria) => {
        const items = cataloghi
          .filter((catalogo) => catalogo.categoria === categoria)
          .sort((a, b) => {
            const byTitle = (a.titolo ?? '').localeCompare(b.titolo ?? '', 'it', {
              sensitivity: 'base',
            })
            if (byTitle !== 0) return byTitle
            return a.id.localeCompare(b.id)
          })

        return (
          <section
            key={categoria}
            id={categoryToDomId(categoria)}
            className="scroll-mt-32 space-y-4"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-3xl md:text-4xl text-zinc-100 font-semibold tracking-wide">{categoria}</h3>
              <span className="text-xs rounded-full border border-black px-2 py-0.5 text-zinc-600">
                {items.length} catalogh{items.length === 1 ? 'o' : 'i'}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="text-lg text-zinc-500 py-2">Nessun catalogo in questa categoria.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((catalogo) => (
                  <Link
                    key={catalogo.id}
                    prefetch={false}
                    href={`/cataloghi/${catalogo.id}`}
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
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                              catalogo.stato_pubblicazione === 'attivo'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {catalogo.stato_pubblicazione === 'attivo' ? 'Pubblicato' : 'Bozza / Nascosto'}
                          </span>
                        </div>
                        <p className="text-zinc-600 text-base mb-4">
                          {(catalogo.categoria as string | null) || 'Senza categoria'} /{' '}
                          {Array.isArray(catalogo.area_geografica_target)
                            ? catalogo.area_geografica_target.join(', ')
                            : catalogo.area_geografica_target || 'Globale'}
                        </p>
                        <div className="mt-auto pt-4 border-t border-black/50">
                          <span className="text-sm text-white font-medium tracking-wider uppercase group-hover:opacity-100 transition-opacity">
                            Sfoglia Catalogo →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
