import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  CATALOG_CATEGORIES,
  CATEGORY_TILE_IMAGE,
  FOTO_CATEGORY_MAP,
  categoryToSlug,
  type CatalogCategory,
} from '@/lib/catalogCategories'
import { createClient } from '@/utils/supabase/server'

const HIDDEN_HOME_CATEGORIES = new Set([
  'Metal',
  'Studio',
  'Partner',
  'Agenti',
  'Scontistiche',
  'Family 15 Fotografico',
  'Family 20 Fotografico',
  'Capsule Collection Fotografico',
  'Family Gres Fotografico',
  'Bricks Fotografico',
])

/** Ordine esplicito dei tile nella homepage (6 categorie + blocco fotografico). */
const HOMEPAGE_CATEGORIES_ORDER: CatalogCategory[] = [
  'Family 15',
  'Family 20',
  'Capsule Collection',
  'Family Gres',
  'Bricks',
]

/** Categorie mostrate nel blocco "Catalogo Fotografico" (5 pulsanti sovrapposti). */
const CATALOGO_FOTO_CATEGORIES: CatalogCategory[] = ['Family 15', 'Family 20', 'Capsule Collection', 'Family Gres', 'Bricks']

/** Etichetta visiva della categoria (es. "Capsule Collection 20" per display, slug rimane invariato). */
function categoryDisplayName(cat: CatalogCategory): string {
  if (cat === 'Capsule Collection') return 'Capsule Collection 20'
  return cat
}

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

  // Fetch il singolo catalogo fotografico attivo per ogni categoria
  const supabase = await createClient()
  const fotoCategorie = Object.values(FOTO_CATEGORY_MAP) as CatalogCategory[]
  const { data: fotoCataloghi } = await supabase
    .from('cataloghi')
    .select('id, categoria')
    .in('categoria', fotoCategorie)
    .eq('stato_pubblicazione', 'attivo')
    .order('creato_il', { ascending: false })
    .limit(10)

  // Mappa categoria fotografico → id catalogo (primo attivo trovato)
  const fotoCatalogoIdMap: Partial<Record<CatalogCategory, string>> = {}
  for (const row of fotoCataloghi ?? []) {
    if (!fotoCatalogoIdMap[row.categoria as CatalogCategory]) {
      fotoCatalogoIdMap[row.categoria as CatalogCategory] = row.id
    }
  }

  // Restituisce l'href diretto al PDF se esiste (accesso RLS verificato lato server),
  // altrimenti rimanda al login senza mostrare la pagina categoria intermedia.
  function fotoHref(baseCat: CatalogCategory): string {
    const fotoCat = FOTO_CATEGORY_MAP[baseCat]
    const catalogoId = fotoCat ? fotoCatalogoIdMap[fotoCat] : undefined
    if (catalogoId) return `/cataloghi/${catalogoId}?returnTo=/`
    return '/login'
  }

  const homepageCategories = HOMEPAGE_CATEGORIES_ORDER

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
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12 list-none p-0 m-0">
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
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={cat === 'Family 15' || cat === 'Family 20'}
                  />
                </div>
                <div className="mt-2 flex w-full items-baseline justify-between gap-2">
                  <p className="ladiva-catalog-caption ladiva-catalog-caption--home inline-block text-left text-sm sm:text-base lg:text-lg xl:text-xl uppercase leading-snug">
                    {categoryDisplayName(cat)}
                  </p>
                  <p className="shrink-0 text-sm sm:text-base lg:text-lg xl:text-xl uppercase leading-snug text-red-600" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
                    Cataloghi Tecnici
                  </p>
                </div>
              </Link>
            </li>
          ))}

          {/* Blocco 3 pulsanti "Catalogo Fotografico" – occupa lo stesso spazio di un quadrato */}
          <li>
            <div className="aspect-square flex flex-col gap-1">
              {CATALOGO_FOTO_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={fotoHref(cat)}
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
                  <div
                    className="flex flex-1 flex-col justify-center bg-black px-4 py-3 transition-colors duration-200 group-hover:bg-neutral-900"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    <p className="text-white font-normal uppercase tracking-wider text-sm sm:text-base md:text-lg leading-tight">
                      {categoryDisplayName(cat)}
                    </p>
                    <p className="mt-0.5 text-red-600 font-normal uppercase tracking-widest text-xs md:text-sm leading-snug">
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
            <p className="text-sm max-w-3xl mx-auto text-center mb-1">
              <Link href="/privacy" className="underline hover:text-zinc-800 transition-colors whitespace-nowrap">Privacy Policy</Link>
              {' · '}
              <Link href="/termini" className="underline hover:text-zinc-800 transition-colors whitespace-nowrap">Termini e Condizioni</Link>
              {' · '}
              <Link href="/cookie" className="underline hover:text-zinc-800 transition-colors whitespace-nowrap">Cookie Policy</Link>
            </p>
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
