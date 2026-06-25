import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Download, BookOpen, FileText, Presentation, ChevronRight } from 'lucide-react'
import Header from '@/components/Header'
import { createClient } from '@/utils/supabase/server'
import {
  categoryToSlug,
  PORTALE_TILES_PER_RUOLO,
  type CatalogCategory,
  type PortaleTile,
} from '@/lib/catalogCategories'
import { CATALOG_RETURN_TO_PARAM, catalogPdfHref } from '@/lib/catalogNavigation'

/** Categorie che aprono direttamente il PDF (nessuna lista intermedia). */
const DIRECT_OPEN_CATEGORIES = new Set<string>(['Scontistiche', 'Listini', 'Power Point'])

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Area Riservata · Ladiva Ceramica',
}

function tileIcon(categoria: CatalogCategory) {
  if (categoria === 'File 2D' || categoria === 'File 3D' || categoria === 'Studio') {
    return <Download size={28} strokeWidth={1.5} />
  }
  if (categoria === 'Power Point') {
    return <Presentation size={28} strokeWidth={1.5} />
  }
  if (categoria === 'Partner' || categoria === 'Listini Netti') {
    return <BookOpen size={28} strokeWidth={1.5} />
  }
  return <FileText size={28} strokeWidth={1.5} />
}

function tileAccentColor(categoria: CatalogCategory): string {
  if (categoria === 'File 2D' || categoria === 'File 3D' || categoria === 'Studio') return 'bg-[#060d41]'
  if (categoria === 'Power Point') return 'bg-zinc-700'
  if (categoria === 'Partner') return 'bg-slate-700'
  if (categoria === 'Listini Netti') return 'bg-slate-600'
  return 'bg-zinc-700'
}

export default async function PortalePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo, nome_completo, registrazione_approvata')
    .eq('id', user.id)
    .single()

  const ruolo = profilo?.ruolo ?? 'free'

  if (profilo?.registrazione_approvata === false) {
    redirect('/dashboard')
  }

  const tiles: PortaleTile[] = PORTALE_TILES_PER_RUOLO[ruolo] ?? []

  if (tiles.length === 0) {
    redirect('/dashboard')
  }

  // Recupera il conteggio dei cataloghi attivi e gli ID per le categorie direct-open
  const categorie = tiles.map((t) => t.categoria)
  const { data: catalogRows } = await supabase
    .from('cataloghi')
    .select('id, categoria')
    .in('categoria', categorie)
    .eq('stato_pubblicazione', 'attivo')
    .order('creato_il', { ascending: false })

  const countPerCategoria: Record<string, number> = {}
  const directOpenIdPerCategoria: Record<string, string> = {}
  for (const row of catalogRows ?? []) {
    const cat = row.categoria as string
    countPerCategoria[cat] = (countPerCategoria[cat] ?? 0) + 1
    // Tieni solo il primo (più recente) per le categorie direct-open
    if (DIRECT_OPEN_CATEGORIES.has(cat) && !directOpenIdPerCategoria[cat]) {
      directOpenIdPerCategoria[cat] = row.id as string
    }
  }

  const nomeUtente = profilo?.nome_completo?.split(' ')[0] ?? ''

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="w-full max-w-[1200px] mx-auto px-6 py-10 md:py-14 flex-1">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-sans uppercase tracking-tight text-zinc-900">
            {nomeUtente ? `Benvenuto, ${nomeUtente}` : 'Area Riservata'}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 uppercase tracking-wide">
            Seleziona la sezione che vuoi consultare
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
          {tiles.map((tile) => {
            const count = countPerCategoria[tile.categoria] ?? 0
            const slug = categoryToSlug(tile.categoria)
            const directId = directOpenIdPerCategoria[tile.categoria]
            const categoryHref = directId
              ? catalogPdfHref(directId, '/portale')
              : `/cataloghi/categoria/${slug}?${CATALOG_RETURN_TO_PARAM}=${encodeURIComponent('/portale')}`
            return (
              <li key={tile.categoria}>
                <Link
                  href={categoryHref}
                  className="group flex flex-col h-full min-h-[200px] rounded-2xl overflow-hidden border border-black/10 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
                >
                  {/* Barra colore in cima */}
                  <div className={`h-2 w-full ${tileAccentColor(tile.categoria)}`} />

                  {/* Corpo tile */}
                  <div className="flex flex-col flex-1 justify-between p-6 bg-white group-hover:bg-zinc-50 transition-colors">
                    <div>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-white ${tileAccentColor(tile.categoria)}`}>
                        {tileIcon(tile.categoria)}
                      </div>
                      <h2 className="text-xl font-semibold uppercase tracking-wide text-zinc-900 font-[family-name:var(--font-sans)]">
                        {tile.label}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500 font-[family-name:var(--font-sans)]">
                        {tile.descrizione}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${tileAccentColor(tile.categoria)}`}>
                        {count} {count === 1 ? 'file' : 'file'}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-700 transition-colors uppercase tracking-wide">
                        Apri <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>

      <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip">
        <div className="ladiva-home-footer-inner">
          <p className="text-sm max-w-3xl mx-auto text-center">
            © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
            {' · '}
            <Link href="/" className="ladiva-footer-link whitespace-nowrap">
              ← Home
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
