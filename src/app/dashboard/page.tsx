import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, MessageCircle, FileText, Users, Mail } from 'lucide-react'
import Header from '@/components/Header'
import DashboardHashScroll from '@/components/DashboardHashScroll'
import { CATALOG_CATEGORIES, categoryToDomId } from '@/lib/catalogCategories'

type Operatore = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  ruolo: 'agente' | 'distributore'
  area_geografica: string | null
}

type Fornitore = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
}

type Partner = {
  id: string
  nome_completo: string | null
  email: string | null
  area_geografica: string | null
}

export default async function Dashboard(props: { searchParams: Promise<{ area?: string; message?: string }> }) {
  const searchParams = await props.searchParams
  const areaFilter = searchParams?.area ?? 'all'
  const actionMessage = searchParams?.message ?? ''
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Recupera i dati del profilo
  const profilo = user
    ? (await supabase
      .from('profili')
      .select('id, nome_completo, ruolo, area_geografica')
      .eq('id', user.id)
      .single()).data
    : null

  const ruoloCorrente = profilo?.ruolo ?? 'free'
  const isManager = ruoloCorrente === 'admin'
  const isPartner = ruoloCorrente === 'distributore'
  const isAgente = ruoloCorrente === 'agente'
  const isFree = !user || ruoloCorrente === 'free'

  // Recupera i cataloghi (RLS attivo)
  let cataloghiQuery = supabase
    .from('cataloghi')
    .select('*')
    .order('creato_il', { ascending: false })

  if (isManager && areaFilter !== 'all') {
    cataloghiQuery = cataloghiQuery.contains('area_geografica_target', [areaFilter])
  }

  // Ospite senza login o profilo ruolo "free": solo cataloghi pubblicati (no bozze)
  if (!user || ruoloCorrente === 'free') {
    cataloghiQuery = cataloghiQuery.eq('stato_pubblicazione', 'attivo')
  }

  const { data: cataloghi, error: cataloghiError } = await cataloghiQuery

  // Per admin: recupera elenco aree disponibili per filtro dashboard
  let areeDisponibili: string[] = []
  if (isManager) {
    const { data: areeProfili } = await supabase
      .from('profili')
      .select('area_geografica')
      .not('area_geografica', 'is', null)

    const { data: areeCataloghi } = await supabase
      .from('cataloghi')
      .select('area_geografica_target')
      .not('area_geografica_target', 'is', null)

    const areeCataloghiFlat =
      areeCataloghi?.flatMap((c) => {
        if (Array.isArray(c.area_geografica_target)) return c.area_geografica_target
        if (typeof c.area_geografica_target === 'string' && c.area_geografica_target.length > 0) {
          return [c.area_geografica_target]
        }
        return []
      }) || []

    areeDisponibili = Array.from(
      new Set([
        ...(areeProfili?.map((p) => p.area_geografica).filter((v): v is string => Boolean(v)) || []),
        ...areeCataloghiFlat,
      ])
    ).sort((a, b) => a.localeCompare(b))
  }

  // Per admin: operatori (agenti/distributori) eventualmente filtrati per area
  let operatoriAdmin: Operatore[] = []
  if (isManager) {
    let operatoriQuery = supabase
      .from('profili')
      .select('id, nome_completo, email, telefono, ruolo, area_geografica')
      .in('ruolo', ['agente', 'distributore'])
      .order('nome_completo', { ascending: true })

    if (areaFilter !== 'all') {
      operatoriQuery = operatoriQuery.eq('area_geografica', areaFilter)
    }

    const { data: operatoriData } = await operatoriQuery
    operatoriAdmin = (operatoriData || []) as Operatore[]
  }

  // Recupera fornitori associati a questo agente (se non è un profilo free)
  let fornitori: Fornitore[] = []
  if (user && ruoloCorrente !== 'free') {
    const { data: fornitoriRaw } = await supabase
      .from('connessioni_agente_fornitore')
      .select(`
        fornitore:profili!fornitore_id (
          id,
          nome_completo,
          telefono,
          email
        )
      `)
      .eq('agente_id', user.id)

    const fornitoriEstratti =
      fornitoriRaw?.flatMap((f) => {
        const fornitore = f.fornitore
        if (!fornitore) return []
        return Array.isArray(fornitore) ? fornitore : [fornitore]
      }) || []

    fornitori = fornitoriEstratti.filter(
      (fornitore): fornitore is Fornitore => Boolean(fornitore)
    )
  }

  // Recupera agenti della stessa zona se l'utente è un distributore
  let agentiZona: Pick<Operatore, 'id' | 'nome_completo' | 'email' | 'telefono'>[] = []
  if (isPartner && profilo?.area_geografica) {
    const { data: agentiData } = await supabase
      .from('profili')
      .select('id, nome_completo, telefono, email')
      .eq('ruolo', 'agente')
      .eq('area_geografica', profilo.area_geografica)
    
    if (agentiData) {
      agentiZona = agentiData
    }
  }

  // Recupera partner della stessa zona se l'utente è un agente
  let partnerZona: Partner[] = []
  if (isAgente && profilo?.area_geografica) {
    const { data: partnerData } = await supabase
      .from('profili')
      .select('id, nome_completo, email, area_geografica')
      .eq('ruolo', 'distributore')
      .eq('area_geografica', profilo.area_geografica)

    partnerZona = (partnerData || []) as Partner[]
  }

  // Contatti diretti pubblici (ospite o profilo ruolo free): rubrica generica, non i fornitori legati all'agente.
  // Ospite anonimo: solo agenti/partner con area geografica (mappa/rubrica territoriale); senza area restano visibili solo dopo login (anche ruolo free).
  let contattiDirettiPubblici: Fornitore[] = []
  if (isFree) {
    let contattiPubbliciQuery = supabase
      .from('profili')
      .select('id, nome_completo, email, telefono')
      .in('ruolo', ['agente', 'distributore'])
      .order('nome_completo', { ascending: true })
      .limit(12)

    if (!user) {
      contattiPubbliciQuery = contattiPubbliciQuery
        .not('area_geografica', 'is', null)
        .neq('area_geografica', '')
    }

    const { data: contattiPubblici } = await contattiPubbliciQuery
    contattiDirettiPubblici = (contattiPubblici || []) as Fornitore[]
  }

  const { data: contattiAziendaliRows, error: contattiAziendaliError } = await supabase
    .from('contatti_aziendali')
    .select('id, etichetta, email, telefono')
    .eq('attivo', true)
    .order('ordine', { ascending: true })

  const contattiAziendali: Fornitore[] = contattiAziendaliError
    ? []
    : (contattiAziendaliRows || []).map((row) => ({
        id: row.id,
        nome_completo: row.etichetta,
        email: row.email,
        telefono: row.telefono,
      }))

  const contattiDiRete = isFree ? contattiDirettiPubblici : fornitori
  const contattiDiretti = [...contattiAziendali, ...contattiDiRete]

  return (
    <div className="ladiva-root ladiva-root-app-dark min-h-screen flex flex-col">
      <Header />
      <DashboardHashScroll />

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 space-y-16">
        
        {/* Welcome Section */}
        <div className="mt-4 mb-12">
          <span className="ladiva-label text-sm">{!user ? 'Accesso pubblico' : 'Dashboard Riservata'}</span>
          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight mt-1 mb-2">
            {!user ? 'Cataloghi e contatti' : 'La tua Area Riservata'}
          </h1>
          <p className="text-zinc-600 max-w-2xl text-lg">
            {!user
              ? 'Sfoglia i cataloghi pubblicati, consulta Dove siamo e i contatti diretti. Per aree riservate agenti/partner accedi al portale.'
              : <>Bentornato {profilo?.nome_completo || user?.email || 'Utente Free'}
                {profilo?.area_geografica ? ` (Area: ${profilo.area_geografica})` : ''} </>
            }
            {user ? (
              <>
                {isManager ? <span className="ml-3 inline-flex items-center rounded-full border border-black/25 px-2.5 py-0.5 text-xs font-semibold bg-[#060d41]/10 text-[#060d41]">Manager</span> : null}
                {isPartner ? <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-[#060d41]">Partner</span> : null}
                {isAgente ? <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-[#060d41]">Agente</span> : null}
                {isFree && !isManager && !isPartner && !isAgente ? <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800">Free</span> : null}
              </>
            ) : null}
          </p>
        </div>

        {actionMessage ? (
          <div className="rounded-xl border border-black bg-white px-4 py-3 text-sm text-[#060d41]">
            {actionMessage}
          </div>
        ) : null}

        {isManager && (
          <section id="crea-catalogo" className="border border-black rounded-2xl bg-white p-6 space-y-5">
            <div>
              <h2 className="text-xl text-zinc-900 font-medium">Nuovo Catalogo</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Carica il PDF del catalogo e definisci area geografica e stato di pubblicazione.
              </p>
            </div>

            <form
              action="/api/admin/cataloghi/create"
              method="POST"
              encType="multipart/form-data"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <label htmlFor="titolo" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                  Titolo Catalogo
                </label>
                <input
                  id="titolo"
                  name="titolo"
                  type="text"
                  required
                  className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoria" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                  Categoria
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  required
                  defaultValue=""
                  className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
                >
                  <option value="" disabled>
                    Seleziona categoria
                  </option>
                  {CATALOG_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="area_geografica_target" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                  Area Geografica
                </label>
                <input
                  id="area_geografica_target"
                  name="area_geografica_target"
                  type="text"
                  required
                  placeholder="Es. Emilia Romagna"
                  className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                <p className="text-xs text-zinc-600">
                  Puoi inserire piu aree separate da virgola (es. Liguria, Lazio oppure Italia, Francia).
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="stato_pubblicazione" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                  Stato
                </label>
                <select
                  id="stato_pubblicazione"
                  name="stato_pubblicazione"
                  defaultValue="bozza"
                  className="w-full h-10 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
                >
                  <option value="bozza">Bozza</option>
                  <option value="attivo">Attivo</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="file_pdf" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                  File PDF
                </label>
                <input
                  id="file_pdf"
                  name="file_pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="file_copertina_nuovo" className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                  Copertina (immagine A4 verticale, opzionale) — 210×297 mm
                </label>
                <input
                  id="file_copertina_nuovo"
                  name="file_copertina"
                  type="file"
                  accept="image/*"
                  className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a]"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="h-10 rounded-md bg-[#060d41] text-white px-5 text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                >
                  Crea Catalogo
                </button>
              </div>
            </form>
          </section>
        )}

        {isManager && (
          <section id="filtro-admin" className="border border-black rounded-2xl bg-white p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-xl text-zinc-900 font-medium">Filtro Manager</h2>
                <p className="text-sm text-zinc-600 mt-1">
                  Seleziona un&apos;area geografica per vedere cataloghi e operatori abilitati.
                </p>
              </div>
              <form className="flex items-center gap-3" method="get">
                <select
                  name="area"
                  defaultValue={areaFilter}
                  className="h-10 rounded-lg border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
                >
                  <option value="all">Tutte le aree</option>
                  {areeDisponibili.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-[#060d41] text-white px-4 text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                >
                  Applica
                </button>
              </form>
            </div>
          </section>
        )}

        {/* SEZIONE CATALOGHI */}
        <section id="cataloghi">
          <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
            <h2 className="text-3xl md:text-4xl font-sans tracking-tight text-zinc-100 flex items-center gap-3">
              <FileText className="text-white" /> I Tuoi Cataloghi
            </h2>
          </div>
          
          {cataloghiError ? (
            <div className="text-red-700 p-4 border border-red-300 bg-red-50 rounded-xl">Errore nel caricamento: {cataloghiError.message}</div>
          ) : (
            <div className="space-y-10">
              {CATALOG_CATEGORIES.map((categoria) => {
                const items = (cataloghi ?? []).filter((catalogo) => catalogo.categoria === categoria)
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
                      <p className="text-lg text-zinc-500 py-2">
                        Nessun catalogo in questa categoria.
                      </p>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((catalogo) => (
                        <div key={catalogo.id} className="space-y-3">
                  <Link prefetch={false} href={`/cataloghi/${catalogo.id}`} className="group block focus:outline-none focus:ring-2 focus:ring-[#060d41] rounded-none">
                    <div className="bg-white border border-black rounded-none overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#060d41] hover:shadow-[0_12px_40px_rgba(6,13,65,0.1)] flex flex-col h-full">
                      
                      {/* Anteprima copertina: formato A4 verticale (ISO 210×297) */}
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
                      
                      {/* Dati Catalogo */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-2xl text-zinc-900 font-medium uppercase tracking-wide leading-tight mb-1">
                          {catalogo.titolo}
                        </h3>
                        <div className="mb-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${catalogo.stato_pubblicazione === 'attivo'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}>
                            {catalogo.stato_pubblicazione === 'attivo' ? 'Pubblicato' : 'Bozza / Nascosto'}
                          </span>
                        </div>
                        {/* Sottotitolo finto o basato su un campo DB (al momento usiamo l'area geografica o un placeholder stile screenshot) */}
                        <p className="text-zinc-600 text-base mb-4">
                          {(catalogo.categoria as string | null) || 'Senza categoria'} / {Array.isArray(catalogo.area_geografica_target) ? catalogo.area_geografica_target.join(', ') : catalogo.area_geografica_target || 'Globale'}
                        </p>
                        
                        <div className="mt-auto pt-4 border-t border-black/50">
                          <span className="text-sm text-white font-medium tracking-wider uppercase group-hover:opacity-100 transition-opacity">Sfoglia Catalogo →</span>
                        </div>
                      </div>

                    </div>
                  </Link>

                  {isManager && (
                    <>
                      <form
                        action="/api/admin/cataloghi/status"
                        method="POST"
                        className="bg-white border border-black rounded-xl p-3 space-y-2"
                      >
                        <input type="hidden" name="catalogo_id" value={catalogo.id} />
                        <label className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                          Stato Visibilita
                        </label>
                        <select
                          name="stato_pubblicazione"
                          defaultValue={catalogo.stato_pubblicazione ?? 'bozza'}
                          className="w-full h-9 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
                        >
                          <option value="bozza">Bozza / Nascosto</option>
                          <option value="attivo">Pubblicato</option>
                        </select>
                        <button
                          type="submit"
                          className="w-full h-9 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                        >
                          Salva Stato
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
                          Aggiorna copertina (A4 verticale, 210×297 mm)
                        </label>
                        <input
                          name="file_copertina"
                          type="file"
                          accept="image/*"
                          className="ladiva-file-input w-full rounded-md border border-black bg-zinc-50 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#060d41] file:px-3 file:py-1.5 file:text-white file:font-semibold hover:file:bg-[#0a155a]"
                        />
                        <label className="flex items-center gap-2 text-xs text-zinc-600">
                          <input type="checkbox" name="rimuovi_copertina" />
                          Rimuovi copertina attuale
                        </label>
                        <button
                          type="submit"
                          className="w-full h-9 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                        >
                          Salva Copertina
                        </button>
                      </form>

                      <form
                        action="/api/admin/cataloghi/areas"
                        method="POST"
                        className="bg-white border border-black rounded-xl p-3 space-y-2"
                      >
                        <input type="hidden" name="catalogo_id" value={catalogo.id} />
                        <label className="block text-xs text-zinc-600 font-medium uppercase tracking-wide">
                          Aree Geografiche
                        </label>
                        <input
                          name="aree_geografiche"
                          type="text"
                          defaultValue={
                            Array.isArray(catalogo.area_geografica_target)
                              ? catalogo.area_geografica_target.join(', ')
                              : catalogo.area_geografica_target || ''
                          }
                          placeholder="Es. Liguria, Lazio oppure Italia, Francia"
                          className="w-full h-9 rounded-md border border-black bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-600"
                        />
                        <button
                          type="submit"
                          className="w-full h-9 rounded-md bg-[#060d41] text-white text-sm font-semibold hover:bg-[#0a155a] transition-colors"
                        >
                          Salva Aree
                        </button>
                      </form>

                      <form
                        action="/api/admin/cataloghi/delete"
                        method="POST"
                        className="bg-white border border-red-400 rounded-xl p-3 space-y-2"
                      >
                        <input type="hidden" name="catalogo_id" value={catalogo.id} />
                        <p className="text-xs text-red-700">
                          Elimina catalogo (azione irreversibile)
                        </p>
                        <button
                          type="submit"
                          className="w-full h-9 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
                        >
                          Elimina Catalogo
                        </button>
                      </form>
                    </>
                  )}
                </div>
                      ))}
                    </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </section>

        {isManager && (
          <section id="operatori-admin">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
              <h2 className="text-3xl md:text-4xl font-sans tracking-tight text-zinc-100 flex items-center gap-3">
                <Users className="text-black" /> Operatori Abilitati (Agenti e Distributori)
              </h2>
            </div>

            {operatoriAdmin.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {operatoriAdmin.map((operatore) => (
                  <div key={operatore.id} className="bg-white border border-black rounded-2xl p-6 pb-8 flex flex-col h-full shadow-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-zinc-900 mb-1">{operatore.nome_completo || 'Operatore Senza Nome'}</h3>
                      <p className="text-zinc-600 text-sm">{operatore.email}</p>
                      <p className="text-zinc-600 text-xs mt-2 uppercase tracking-wide">
                        {operatore.ruolo === 'distributore' ? 'partner' : operatore.ruolo} {operatore.area_geografica ? `• ${operatore.area_geografica}` : ''}
                      </p>
                    </div>
                    <div className="mt-auto flex gap-3 pt-6">
                      {operatore.telefono ? (
                        <>
                          <a href={`tel:${operatore.telefono?.trim()}`} className="flex-1 flex justify-center items-center gap-2 bg-[#060d41] text-white hover:bg-[#0a155a] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <Phone size={16} /> Chiama
                          </a>
                          <a href={`https://wa.me/${operatore.telefono?.replace(/\\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 border border-black bg-zinc-50 hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] text-zinc-900 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                            <MessageCircle size={16} /> WhatsApp
                          </a>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 flex justify-center items-center gap-2 bg-zinc-100 text-zinc-600 opacity-50 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-not-allowed">
                            <Phone size={16} /> Chiama
                          </span>
                          <span className="flex-1 flex justify-center items-center gap-2 border border-black text-zinc-600 opacity-50 bg-zinc-50 py-2.5 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                            <MessageCircle size={16} /> WhatsApp
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center border rounded-2xl border-black bg-white">
                <p className="text-sm text-zinc-600">
                  Nessun operatore trovato per il filtro selezionato.
                </p>
              </div>
            )}
          </section>
        )}

        {/* SEZIONE AGENTI IN ZONA (SOLO DISTRIBUTORE) */}
        {isPartner && (
          <section id="agenti-zona">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
              <h2 className="text-3xl md:text-4xl font-sans tracking-tight text-zinc-100 flex items-center gap-3">
                <Users className="text-black" /> Agenti nella Tua Area ({profilo?.area_geografica})
              </h2>
            </div>
            
            {agentiZona.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentiZona.map((agente) => (
                  <div key={agente.id} className="bg-white border border-black rounded-2xl p-6 pb-8 flex flex-col h-full shadow-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-zinc-900 mb-1">{agente.nome_completo || 'Agente Senza Nome'}</h3>
                      <p className="text-zinc-600 text-sm">{agente.email}</p>
                    </div>
                    <div className="mt-auto flex gap-3 pt-6">
                      {agente.telefono ? (
                        <>
                          <a href={`tel:${agente.telefono?.trim()}`} className="flex-1 flex justify-center items-center gap-2 bg-[#060d41] text-white hover:bg-[#0a155a] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <Phone size={16} /> Chiama
                          </a>
                          <a href={`https://wa.me/${agente.telefono?.replace(/\\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 border border-black bg-zinc-50 hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] text-zinc-900 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                            <MessageCircle size={16} /> WhatsApp
                          </a>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 flex justify-center items-center gap-2 bg-zinc-100 text-zinc-600 opacity-50 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-not-allowed">
                            <Phone size={16} /> Chiama
                          </span>
                          <span className="flex-1 flex justify-center items-center gap-2 border border-black text-zinc-600 opacity-50 bg-zinc-50 py-2.5 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                            <MessageCircle size={16} /> WhatsApp
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center border rounded-2xl border-black bg-white">
                <p className="text-sm text-zinc-600">
                  Non ci sono agenti registrati per la tua area in questo momento.
                </p>
              </div>
            )}
          </section>
        )}

        {/* SEZIONE CONTATTI RAPIDI (FORNITORI / AGENTI) */}
        {isAgente && (
          <section id="scontistiche">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
              <h2 className="text-3xl md:text-4xl tracking-tight text-zinc-100 flex items-center gap-3 font-sans">
                <FileText className="text-white" /> Scontistiche
              </h2>
            </div>
            <div className="border border-black rounded-2xl bg-white p-6">
              <p className="text-lg text-zinc-500">
                Sezione scontistiche agente attiva. In questa fase i valori commerciali vengono gestiti dal Manager: contatta il tuo referente per il listino aggiornato.
              </p>
            </div>
          </section>
        )}

        {isAgente && (
          <section id="partner-zona">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
              <h2 className="text-3xl md:text-4xl tracking-tight text-zinc-100 flex items-center gap-3 font-sans">
                <Users className="text-white" /> Partner nella Tua Area ({profilo?.area_geografica})
              </h2>
            </div>
            {partnerZona.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partnerZona.map((partner) => (
                  <div key={partner.id} className="bg-white border border-black rounded-2xl p-6 pb-8 flex flex-col h-full shadow-lg">
                    <h3 className="text-lg font-medium text-zinc-900 mb-1">{partner.nome_completo || 'Partner Senza Nome'}</h3>
                    <p className="text-zinc-600 text-sm">{partner.email}</p>
                    <p className="text-zinc-600 text-xs mt-2 uppercase tracking-wide">
                      {partner.area_geografica || 'Area non definita'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center border rounded-2xl border-black bg-white">
                <p className="text-lg text-zinc-500">Nessun partner geolocalizzato trovato per la tua area.</p>
              </div>
            )}
          </section>
        )}

        {(isFree || ruoloCorrente !== 'free') && (
          <section id="contatti">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
              <h2 className="text-3xl md:text-4xl tracking-tight text-zinc-100 flex items-center gap-3 font-sans">
                <Phone className="text-white" /> I Tuoi Contatti Diretti
              </h2>
            </div>
            
            {contattiDiretti && contattiDiretti.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contattiDiretti.map((fornitore) => (
                  <div key={fornitore.id} className="bg-white border border-black rounded-2xl p-6 pb-8 flex flex-col h-full shadow-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-zinc-900 mb-1">{fornitore.nome_completo || 'Contatto Senza Nome'}</h3>
                      <p className="text-zinc-600 text-sm">{fornitore.email}</p>
                    </div>
                    <div className="mt-auto flex gap-3 pt-6">
                      {fornitore.telefono ? (
                        <>
                          <a href={`tel:${fornitore.telefono?.trim()}`} className="flex-1 flex justify-center items-center gap-2 bg-[#060d41] text-white hover:bg-[#0a155a] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
                            <Phone size={16} /> Chiama
                          </a>
                          <a href={`https://wa.me/${fornitore.telefono?.replace(/\\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 border border-black bg-zinc-50 hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] text-zinc-900 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                            <MessageCircle size={16} /> WhatsApp
                          </a>
                        </>
                      ) : fornitore.email ? (
                        <a
                          href={`mailto:${fornitore.email.trim()}`}
                          className="flex-1 flex justify-center items-center gap-2 border border-black bg-white text-black hover:bg-zinc-100 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Mail size={16} /> Scrivi
                        </a>
                      ) : (
                        <>
                          <span className="flex-1 flex justify-center items-center gap-2 bg-zinc-100 text-zinc-600 opacity-50 py-2.5 px-4 rounded-lg text-sm font-semibold cursor-not-allowed">
                            <Phone size={16} /> Chiama
                          </span>
                          <span className="flex-1 flex justify-center items-center gap-2 border border-black text-zinc-600 opacity-50 bg-zinc-50 py-2.5 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                            <MessageCircle size={16} /> WhatsApp
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center border rounded-2xl border-black bg-white">
                <p className="text-lg text-zinc-500">
                  Non hai ancora nessun contatto diretto assegnato in rubrica.
                </p>
              </div>
            )}
          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip mt-auto">
        <div className="ladiva-home-footer-inner">
          <p className="text-sm max-w-3xl mx-auto text-center">
            © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
            {' · '}
            <Link href="/" className="ladiva-footer-link whitespace-nowrap">← Torna alla Home Pubblica</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
