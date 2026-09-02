import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import CreateCatalogForm from '@/components/admin/CreateCatalogForm'
import {
  CATALOG_CATEGORIES_FOR_UPLOAD,
  categoriesVisibleOnDashboard,
  categoryToDomId,
  type CatalogCategory,
} from '@/lib/catalogCategories'

const CATEGORY_DISPLAY_LABEL: Partial<Record<CatalogCategory, string>> = {
  Scontistiche: 'Merchandising',
}

function categoryDisplayLabel(cat: string): string {
  return CATEGORY_DISPLAY_LABEL[cat as CatalogCategory] ?? cat
}
import { RUOLI_CATALOGO } from '@/lib/catalogRoles'
import { catalogPdfHref, reservedAreaCatalogReturnTo } from '@/lib/catalogNavigation'
import { compareCatalogTitoli } from '@/lib/catalogSorting'
import CatalogLinguaTabs from '@/components/admin/CatalogLinguaTabs'
import { catalogsForAdminLinguaTab, isEnglishFallbackCatalog, parseCatalogLingua } from '@/lib/catalogLingua'
import { LOCALE_LABEL, type AppLocale } from '@/lib/locale'
import { getAppLocale } from '@/lib/localeServer'
import { tAdmin, tCatalogCount, tCatalogRole } from '@/lib/i18nAdmin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gestione Cataloghi · Ladiva Ceramica',
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

const RETURN_BASE = '/dashboard/gestione-cataloghi'

export default async function GestioneCataloghiPage(props: {
  searchParams: Promise<{ nome?: string; message?: string; lingua?: string }>
}) {
  const searchParams = await props.searchParams
  const nomeFilter = (searchParams?.nome ?? '').trim()
  const actionMessage = searchParams?.message ?? ''
  const uiLocale = await getAppLocale()
  const copy = tAdmin(uiLocale)
  const linguaTabRaw = (searchParams?.lingua ?? '').trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profilo } = await supabase
    .from('profili')
    .select('id, ruolo')
    .eq('id', user.id)
    .single()

  const ruoloCorrente = profilo?.ruolo ?? 'free'
  const isAdmin = ruoloCorrente === 'admin'
  const isManager = isAdmin || ruoloCorrente === 'manager'

  if (!isManager) redirect('/dashboard')

  const linguaTab: AppLocale | 'all' =
    linguaTabRaw === 'all' || linguaTabRaw === 'it' || linguaTabRaw === 'ru' || linguaTabRaw === 'en'
      ? linguaTabRaw
      : uiLocale
  const formDefaultLingua: AppLocale =
    linguaTab === 'it' || linguaTab === 'ru' || linguaTab === 'en' ? linguaTab : uiLocale

  // Fetch cataloghi (admin/manager vedono anche le bozze)
  let cataloghiQuery = supabase
    .from('cataloghi')
    .select('*')
    .order('creato_il', { ascending: false })

  if (nomeFilter.length > 0) {
    cataloghiQuery = cataloghiQuery.ilike('titolo', `%${escapeIlikePattern(nomeFilter)}%`)
  }

  const { data: cataloghi, error: cataloghiError } = await cataloghiQuery

  const categorieDashboard = categoriesVisibleOnDashboard(ruoloCorrente, true)

  const cataloghiTutti = cataloghi ?? []
  const cataloghiEnglishVista = catalogsForAdminLinguaTab(cataloghiTutti, 'en')
  const linguaCounts = {
    all: cataloghiTutti.length,
    it: cataloghiTutti.filter((c) => parseCatalogLingua(c.lingua) === 'it').length,
    ru: cataloghiTutti.filter((c) => parseCatalogLingua(c.lingua) === 'ru').length,
    en: cataloghiEnglishVista.length,
  }
  const cataloghiPerVista = catalogsForAdminLinguaTab(cataloghiTutti, linguaTab)
  const categorieVistaSet = new Set<string>(categorieDashboard)
  const cataloghiSenzaCategoriaVista = cataloghiPerVista.filter(
    (c) => !c.categoria || !categorieVistaSet.has(c.categoria as string),
  )

  return (
    <div className="ladiva-root ladiva-root-app-dark min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 space-y-12">

        {/* Back + titolo */}
        <div>
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight mt-3">
            {copy.gestioneCataloghi}
          </h1>
        </div>

        {actionMessage ? (
          <div className="rounded-xl border border-black bg-white px-4 py-3 text-sm text-[#060d41]">
            {actionMessage}
          </div>
        ) : null}

        {/* Filtro per nome catalogo */}
        <section className="border border-black rounded-2xl bg-white p-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-xl text-zinc-900 font-medium">{copy.filtraCataloghi}</h2>
              <p className="text-sm text-zinc-600 mt-1">{copy.filtraCataloghiHelp}</p>
            </div>
            <form className="flex flex-wrap items-center gap-3" method="get">
              <input type="hidden" name="lingua" value={linguaTab} />
              <input
                type="search"
                name="nome"
                defaultValue={nomeFilter}
                placeholder={copy.placeholderCatalogo}
                aria-label={copy.cercaCatalogo}
                className="h-10 min-w-[12rem] flex-1 rounded-lg border border-black bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="h-10 rounded-lg bg-[#060d41] text-white px-4 text-sm font-semibold hover:bg-[#0a155a] transition-colors"
              >
                {copy.cerca}
              </button>
            </form>
          </div>
        </section>

        {/* Nuovo catalogo (solo admin) */}
        {isAdmin && (
          <section id="crea-catalogo" className="border border-black rounded-2xl bg-white p-6 space-y-5">
            <div>
              <h2 className="text-xl text-zinc-900 font-medium">{copy.nuovoCatalogo}</h2>
              <p className="text-sm text-zinc-600 mt-1">
                {copy.nuovoCatalogoHelp}
              </p>
            </div>
            <CreateCatalogForm
              categories={CATALOG_CATEGORIES_FOR_UPLOAD}
              defaultLingua={formDefaultLingua}
            />
          </section>
        )}

        {/* Lista cataloghi per categoria */}
        <section id="cataloghi">
          <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
            <h2 className="text-3xl md:text-4xl font-sans tracking-tight text-zinc-100 flex items-center gap-3">
              <FileText className="text-white" /> {copy.cataloghi}
              <span className="text-base font-sans font-medium tracking-normal text-zinc-400">
                {linguaTab === 'all' ? copy.tutteLingue : LOCALE_LABEL[linguaTab]} · {cataloghiPerVista.length}
              </span>
            </h2>
          </div>

          <div className="mb-8 space-y-3">
            <CatalogLinguaTabs active={linguaTab} counts={linguaCounts} nome={nomeFilter} locale={uiLocale} />
            <p className="text-sm text-zinc-400">
              {copy.enVedeIt}
            </p>
          </div>

          {cataloghiError ? (
            <div className="text-red-700 p-4 border border-red-300 bg-red-50 rounded-xl">
              {copy.erroreCaricamento}: {cataloghiError.message}
            </div>
          ) : cataloghiPerVista.length === 0 ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-10 text-center">
              {linguaTab !== 'all' && cataloghiTutti.length > 0 ? (
                <>
                  <p className="text-lg font-medium text-amber-950">
                    {copy.nessunCatalogoLingua} {LOCALE_LABEL[linguaTab]}.
                  </p>
                  <p className="mt-3 text-sm text-amber-900">
                    {copy.caricaOppureTutte}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-amber-950">
                    {copy.nessunFileArchivio}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {[
                ...categorieDashboard,
                ...Array.from(
                  new Set(
                    cataloghiSenzaCategoriaVista
                      .map((c) => (typeof c.categoria === 'string' ? c.categoria.trim() : ''))
                      .filter((cat) => cat.length > 0),
                  ),
                ),
              ].map((categoria) => {
                const items = cataloghiPerVista
                  .filter((c) => String(c.categoria ?? '').trim() === categoria)
                  .sort((a, b) => {
                    const byTitle = compareCatalogTitoli(a.titolo, b.titolo)
                    if (byTitle !== 0) return byTitle
                    return a.id.localeCompare(b.id)
                  })

                // Con filtro nome attivo, salta le categorie vuote
                if (nomeFilter && items.length === 0) return null

                return (
                  <section
                    key={categoria}
                    id={categoryToDomId(categoria)}
                    className="scroll-mt-32 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl md:text-4xl text-zinc-100 font-semibold tracking-wide">{categoryDisplayLabel(categoria)}</h3>
                      <span className="text-xs rounded-full border border-black px-2 py-0.5 text-zinc-600">
                        {tCatalogCount(uiLocale, items.length)}
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-lg text-zinc-500 py-2">{copy.nessunCatalogoCategoria}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((catalogo) => {
                          const fallbackEn = isEnglishFallbackCatalog(catalogo, linguaTab)
                          return (
                          <div key={catalogo.id} className="space-y-3">
                            <Link
                              prefetch={false}
                              href={catalogPdfHref(
                                catalogo.id,
                                reservedAreaCatalogReturnTo(RETURN_BASE, catalogo.categoria),
                              )}
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
                                      <span className="text-xs font-medium tracking-widest uppercase">{copy.nessunaImmagine}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                  <h3 className="text-2xl text-zinc-900 font-medium uppercase tracking-wide leading-tight mb-1">
                                    {catalogo.titolo}
                                  </h3>
                                  <div className="mb-2 flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
                                      {parseCatalogLingua(catalogo.lingua).toUpperCase()}
                                      {' · '}
                                      {LOCALE_LABEL[parseCatalogLingua(catalogo.lingua)]}
                                    </span>
                                    {fallbackEn ? (
                                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-900">
                                        {copy.usaPdfItaliano}
                                      </span>
                                    ) : null}
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                      catalogo.stato_pubblicazione === 'attivo'
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                        : 'bg-amber-50 text-amber-900 border-amber-200'
                                    }`}>
                                      {catalogo.stato_pubblicazione === 'attivo' ? copy.pubblicato : copy.bozzaNascosto}
                                    </span>
                                  </div>
                                  <p className="text-zinc-600 text-base">
                                    {(catalogo.categoria as string | null) || copy.senzaCategoria}
                                  </p>
                                </div>
                              </div>
                            </Link>

                            {isAdmin && fallbackEn ? (
                              <p className="rounded-xl border border-black bg-white px-3 py-3 text-xs text-zinc-600">
                                {copy.caricaEnDedicata}
                              </p>
                            ) : null}

                            {isAdmin && !fallbackEn && (
                              <>
                                <form
                                  action="/api/admin/cataloghi/status"
                                  method="POST"
                                  className="bg-white border border-black rounded-xl p-3 space-y-2"
                                >
                                  <input type="hidden" name="catalogo_id" value={catalogo.id} />
                                  <label className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                                    {copy.statoVisibilita}
                                  </label>
                                  <select
                                    name="stato_pubblicazione"
                                    defaultValue={catalogo.stato_pubblicazione ?? 'bozza'}
                                    className="w-full h-9 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
                                  >
                                    <option value="bozza">{copy.bozzaNascosto}</option>
                                    <option value="attivo">{copy.pubblicato}</option>
                                  </select>
                                  <button
                                    type="submit"
                                    className="w-full h-9 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                                  >
                                    {copy.salvaStato}
                                  </button>
                                </form>

                                <form
                                  action="/api/admin/cataloghi/cover"
                                  method="POST"
                                  encType="multipart/form-data"
                                  className="bg-white border border-black rounded-xl p-3 space-y-2"
                                >
                                  <input type="hidden" name="catalogo_id" value={catalogo.id} />
                                  <label className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                                    {copy.aggiornaCopertina}
                                  </label>
                                  <input
                                    name="file_copertina"
                                    type="file"
                                    accept="image/*"
                                    className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a]"
                                  />
                                  <label className="flex items-center gap-2 text-xs text-zinc-600">
                                    <input type="checkbox" name="rimuovi_copertina" />
                                    {copy.rimuoviCopertina}
                                  </label>
                                  <button
                                    type="submit"
                                    className="w-full h-9 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                                  >
                                    {copy.salvaCopertina}
                                  </button>
                                </form>

                                <form
                                  action="/api/admin/cataloghi/roles"
                                  method="POST"
                                  className="bg-white border border-black rounded-xl p-3 space-y-2"
                                >
                                  <input type="hidden" name="catalogo_id" value={catalogo.id} />
                                  <p className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                                    {copy.chiPuoVedere}
                                  </p>
                                  <div className="flex flex-col gap-1.5">
                                    {RUOLI_CATALOGO.map((r) => {
                                      const rv = (catalogo as { ruoli_visibili?: string[] | null }).ruoli_visibili ?? []
                                      return (
                                        <label key={r.value} className="flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            name="ruoli_visibili"
                                            value={r.value}
                                            defaultChecked={rv.includes(r.value)}
                                            className="rounded border-black accent-[#060d41]"
                                          />
                                          {tCatalogRole(uiLocale, r.value)}
                                        </label>
                                      )
                                    })}
                                  </div>
                                  <button
                                    type="submit"
                                    className="w-full h-9 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                                  >
                                    {copy.salvaVisibilita}
                                  </button>
                                </form>

                                <form
                                  action="/api/admin/cataloghi/delete"
                                  method="POST"
                                  className="bg-white border border-red-400 rounded-xl p-3 space-y-2"
                                >
                                  <input type="hidden" name="catalogo_id" value={catalogo.id} />
                                  <p className="text-xs text-red-700">{copy.eliminaCatalogo}</p>
                                  <button
                                    type="submit"
                                    className="w-full h-9 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
                                  >
                                    {copy.eliminaCatalogoBtn}
                                  </button>
                                </form>
                              </>
                            )}
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </section>

      </main>

      <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip mt-auto">
        <div className="ladiva-home-footer-inner">
          <p className="text-sm max-w-3xl mx-auto text-center">
            © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
            {' · '}
            <Link href="/dashboard" className="ladiva-footer-link whitespace-nowrap">← Dashboard</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
