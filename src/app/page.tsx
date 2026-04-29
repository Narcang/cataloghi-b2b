import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { CATALOG_CATEGORIES, CATEGORY_TILE_IMAGE, categoryToDomId } from '@/lib/catalogCategories'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      {/* Allineato a .ladiva-header-inner: max-width 1200px, padding orizzontale 1.5rem (logo / menu) */}
      <main className="w-full max-w-[1200px] mx-auto px-6 py-10 md:py-14 shrink-0">
        <h1 className="sr-only">Catalogo Ladiva Ceramica</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-10 gap-y-14 list-none p-0 m-0">
          {CATALOG_CATEGORIES.map((cat) => (
            <li key={cat}>
              <Link
                href={`/dashboard#${categoryToDomId(cat)}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41] focus-visible:ring-offset-2 rounded-sm"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-100 shadow-sm">
                  <Image
                    src={CATEGORY_TILE_IMAGE[cat]}
                    alt={cat}
                    fill
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    priority={cat === 'Family 15' || cat === 'Family 20'}
                  />
                </div>
                <div className="mt-3 flex w-full justify-end">
                  <p className="ladiva-catalog-caption ladiva-catalog-caption--home inline-block text-right text-base sm:text-lg md:text-xl lg:text-2xl uppercase leading-snug">
                    {cat}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <div className="ladiva-root ladiva-root--auto ladiva-root-home-lower">
        <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip">
          <div className="ladiva-home-footer-inner">
            <p className="text-sm max-w-3xl mx-auto text-center">
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
