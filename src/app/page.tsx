import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  CATALOG_CATEGORIES,
  CATEGORY_TILE_IMAGE,
  categoryToSlug,
  type CatalogCategory,
} from '@/lib/catalogCategories'

const HIDDEN_HOME_CATEGORIES = new Set([
  'Family Gres',
  'Bricks',
  'Metal',
  'Studio',
  'Partner',
  'Agenti',
  'Scontistiche',
])

/** Categorie mostrate nel blocco "Catalogo Fotografico" (3 pulsanti sovrapposti). */
const CATALOGO_FOTO_CATEGORIES: CatalogCategory[] = ['Family 15', 'Family 20', 'Capsule Collection']

function decodeFlashMessage(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export default async function LandingPage(props: { searchParams?: Promise<{ message?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {}
  const flashRaw = searchParams?.message?.trim()
  const flashMessage = flashRaw ? decodeFlashMessage(flashRaw) : null

  const homepageCategories = CATALOG_CATEGORIES.filter((cat) => !HIDDEN_HOME_CATEGORIES.has(cat))

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      {/* Allineato a .ladiva-header-inner: max-width 1200px, padding orizzontale 1.5rem (logo / menu) */}
      <main className="w-full max-w-[1200px] mx-auto px-6 py-10 md:py-14 shrink-0">
        {flashMessage ? (
          <div
            role="status"
            className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900"
          >
            {flashMessage}
          </div>
        ) : null}
        <h1 className="sr-only">Catalogo Ladiva Ceramica</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-10 gap-y-14 list-none p-0 m-0">
          {homepageCategories.map((cat) => (
            <li key={cat}>
              <Link
                href={`/cataloghi/categoria/${categoryToSlug(cat)}`}
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

          {/* Blocco 3 pulsanti "Catalogo Fotografico" – occupa lo stesso spazio di un quadrato */}
          <li>
            <div className="aspect-square flex flex-col gap-2">
              {CATALOGO_FOTO_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/cataloghi/categoria/${categoryToSlug(cat)}`}
                  className="group flex flex-1 min-h-0 overflow-hidden shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
                >
                  {/* Foto a sinistra */}
                  <div className="relative w-2/5 flex-shrink-0 overflow-hidden">
                    <Image
                      src={CATEGORY_TILE_IMAGE[cat]}
                      alt={cat}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 40vw, 20vw"
                    />
                  </div>
                  {/* Testo su sfondo scuro a destra */}
                  <div className="flex flex-1 flex-col justify-center bg-black px-4 py-3 transition-colors duration-200 group-hover:bg-neutral-900">
                    <p className="text-white font-bold uppercase tracking-wider text-sm sm:text-base md:text-lg leading-tight">
                      {cat}
                    </p>
                    <p className="mt-1 text-red-600 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm leading-snug">
                      Catalogo Fotografico
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </li>
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
