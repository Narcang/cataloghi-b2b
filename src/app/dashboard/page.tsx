import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, MessageCircle, FileText, Users, Mail } from 'lucide-react'
import Header from '@/components/Header'
import DashboardHashScroll from '@/components/DashboardHashScroll'
import {
  isAgentOnlyCatalogCategory,
  CATALOG_CATEGORIES,
  CATALOG_CATEGORIES_FOR_UPLOAD,
  categoriesVisibleOnDashboard,
  categoryToDomId,
  isCatalogCategoryAllowedForStudioRole,
  isLoginOnlyCatalogCategory,
} from '@/lib/catalogCategories'
import { catalogPdfHref, dashboardCatalogReturnTo } from '@/lib/catalogNavigation'
import { compareCatalogTitoli } from '@/lib/catalogSorting'
import { RUOLI_CATALOGO } from '@/lib/catalogRoles'
import CreateCatalogForm from '@/components/admin/CreateCatalogForm'
import AdminProfiliPanel, { type ProfiloGestioneRow } from '@/components/admin/AdminProfiliPanel'
import AgenteDocumentazionePortal from '@/components/dashboard/AgenteDocumentazionePortal'
import PartnerListiniPortal from '@/components/dashboard/PartnerListiniPortal'
import InvitaUtente from '@/components/InvitaUtente'

type Operatore = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  ruolo: 'agente' | 'distributore' | 'studio'
  area_geografica: string | null
}

type Fornitore = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

function mergeContattiById(first: Fornitore[], second: Fornitore[]): Fornitore[] {
  const seen = new Set<string>()
  const out: Fornitore[] = []
  for (const x of [...first, ...second]) {
    if (seen.has(x.id)) continue
    seen.add(x.id)
    out.push(x)
  }
  return out
}

type Partner = {
  id: string
  nome_completo: string | null
  email: string | null
  area_geografica: string | null
}

export default async function Dashboard(props: {
  searchParams: Promise<{ area?: string; nome?: string; message?: string }>
}) {
  const searchParams = await props.searchParams
  const areaFilter = searchParams?.area ?? 'all'
  const nomeFilter = (searchParams?.nome ?? '').trim()
  const actionMessage = searchParams?.message ?? ''
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Recupera i dati del profilo
  const profilo = user
    ? (await supabase
      .from('profili')
      .select('id, nome_completo, ruolo, area_geografica, societa, registrazione_approvata')
      .eq('id', user.id)
      .single()).data
    : null

  const ruoloCorrente = profilo?.ruolo ?? 'free'
  const isAdmin = ruoloCorrente === 'admin'
  /** isManager è true sia per admin che per manager: entrambi vedono utenti e cataloghi completi. */
  const isManager = isAdmin || ruoloCorrente === 'manager'
  const isPartner = ruoloCorrente === 'distributore'
  const isAgente = ruoloCorrente === 'agente'
  const isStudio = ruoloCorrente === 'studio'
  const isFree = !user || ruoloCorrente === 'free'

  // Recupera i cataloghi (RLS attivo)
  let cataloghiQuery = supabase
    .from('cataloghi')
    .select('*')
    .order('creato_il', { ascending: false })

  if (isManager && nomeFilter.length > 0) {
    cataloghiQuery = cataloghiQuery.ilike('titolo', `%${escapeIlikePattern(nomeFilter)}%`)
  }

  // Ospite, free o studio: solo cataloghi pubblicati (no bozze)
  if (!user || ruoloCorrente === 'free' || ruoloCorrente === 'studio') {
    cataloghiQuery = cataloghiQuery.eq('stato_pubblicazione', 'attivo')
  }

  const { data: cataloghi, error: cataloghiError } = await cataloghiQuery

  const cataloghiPerVista = (cataloghi ?? []).filter((c) => {
    if (!user && isLoginOnlyCatalogCategory(c.categoria as string | null)) return false
    if (isPartner && isAgentOnlyCatalogCategory(c.categoria as string | null)) return false
    if (isStudio && !isCatalogCategoryAllowedForStudioRole(c.categoria as string | null)) return false
    return true
  })

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

  // Per admin: operatori, utenti in attesa, elenco profili, collegamenti operatore–utente
  let operatoriAdmin: Operatore[] = []
  let profiliRegistrazionePendente: ProfiloGestioneRow[] = []
  let profiliGestioneAdmin: ProfiloGestioneRow[] = []
  let connessioniUtenteOperatoreRows: { utente_id: string; operatore_id: string }[] = []

  if (isManager) {
    const profiloSel =
      'id, nome_completo, email, telefono, societa, area_geografica, ruolo, registrazione_approvata, creato_il'

    let operatoriQuery = supabase
      .from('profili')
      .select('id, nome_completo, email, telefono, ruolo, area_geografica')
      .in('ruolo', ['agente', 'distributore', 'studio'])
      .order('nome_completo', { ascending: true })

    if (areaFilter !== 'all') {
      operatoriQuery = operatoriQuery.eq('area_geografica', areaFilter)
    }

    if (nomeFilter.length > 0) {
      operatoriQuery = operatoriQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)
    }

    let listaQuery = supabase
      .from('profili')
      .select(profiloSel)
      .neq('ruolo', 'free')
      .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
      .order('nome_completo', { ascending: true, nullsFirst: false })
      .limit(150)

    if (areaFilter !== 'all') {
      listaQuery = listaQuery.eq('area_geografica', areaFilter)
    }

    if (nomeFilter.length > 0) {
      listaQuery = listaQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)
    }

    const pendQuery = supabase
      .from('profili')
      .select(profiloSel)
      .eq('registrazione_approvata', false)
      .order('nome_completo', { ascending: true, nullsFirst: false })

    const linksQuery = supabase.from('connessioni_utente_operatore').select('utente_id, operatore_id').limit(2000)

    const [opRes, pendRes, listaRes, linksRes] = await Promise.all([
      operatoriQuery,
      pendQuery,
      listaQuery,
      linksQuery,
    ])

    operatoriAdmin = (opRes.data || []) as Operatore[]
    profiliRegistrazionePendente = (pendRes.data || []) as ProfiloGestioneRow[]
    profiliGestioneAdmin = (listaRes.data || []) as ProfiloGestioneRow[]
    connessioniUtenteOperatoreRows = (linksRes.data || []) as { utente_id: string; operatore_id: string }[]
  }

  // Recupera fornitori associati a questo agente (se non è un profilo free)
  let fornitori: Fornitore[] = []
  if (user && ruoloCorrente !== 'free' && ruoloCorrente !== 'studio') {
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

  let operatoriAssegnatiUtente: Fornitore[] = []
  if (user && profilo?.registrazione_approvata !== false) {
    const { data: opLinkRows } = await supabase.from('connessioni_utente_operatore').select(`
        operatore:profili!operatore_id (
          id,
          nome_completo,
          telefono,
          email
        )
      `).eq('utente_id', user.id)

    const estratti =
      opLinkRows?.flatMap((row) => {
        const op = row.operatore
        if (!op) return []
        return Array.isArray(op) ? op : [op]
      }) || []

    operatoriAssegnatiUtente = estratti.filter((o): o is Fornitore => Boolean(o))
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

  const contattiDiRete = isAgente
    ? mergeContattiById(fornitori, operatoriAssegnatiUtente)
    : operatoriAssegnatiUtente.length > 0
      ? operatoriAssegnatiUtente
      : isFree
        ? contattiDirettiPubblici
        : fornitori
  const contattiDiretti = [...contattiAziendali, ...contattiDiRete]

  const categorieDashboard = categoriesVisibleOnDashboard(ruoloCorrente, Boolean(user))

  const inAttesaApprovazione = Boolean(user && profilo && profilo.registrazione_approvata === false)
  const showFullDashboard = !inAttesaApprovazione

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
                {isAdmin ? <span className="ml-3 inline-flex items-center rounded-full border border-black/25 px-2.5 py-0.5 text-xs font-semibold bg-[#060d41]/10 text-[#060d41]">Admin</span> : null}
                {ruoloCorrente === 'manager' ? <span className="ml-3 inline-flex items-center rounded-full border border-black/25 px-2.5 py-0.5 text-xs font-semibold bg-[#060d41]/10 text-[#060d41]">Manager</span> : null}
                {isPartner ? <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-[#060d41]">Partner</span> : null}
                {isAgente ? <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-[#060d41]">Agente</span> : null}
                {isStudio ? <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-violet-50 text-[#060d41]">Studio</span> : null}
                {user && profilo?.registrazione_approvata === false ? (
                  <span className="ml-3 inline-flex items-center rounded-full border border-amber-300 px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-900">
                    In attesa di approvazione
                  </span>
                ) : null}
                {isFree && !isManager && !isPartner && !isAgente && !isStudio && profilo?.registrazione_approvata !== false ? (
                  <span className="ml-3 inline-flex items-center rounded-full border border-black/20 px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800">Free</span>
                ) : null}
              </>
            ) : null}
          </p>
        </div>

        {actionMessage ? (
          <div className="rounded-xl border border-black bg-white px-4 py-3 text-sm text-[#060d41]">
            {actionMessage}
          </div>
        ) : null}

        {/* Invita utenti + Contatti Diretti in cima per ruoli non-admin */}
        {showFullDashboard && !isManager && (isPartner || isAgente) && (
          <section className="border border-black rounded-2xl bg-white p-6">
            <h2 className="text-xl text-zinc-900 font-medium mb-1">Invita utenti</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Genera un link di registrazione per il ruolo scelto. Il nuovo utente sarà collegato al tuo profilo dopo l&apos;approvazione.
            </p>
            <InvitaUtente ruoloCorrente={ruoloCorrente} />
          </section>
        )}

        {showFullDashboard && !isManager && user && !isFree && (
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
                        <a href={`mailto:${fornitore.email.trim()}`} className="ladiva-dashboard-btn-light flex-1 flex justify-center items-center gap-2 border border-black bg-white text-black hover:bg-zinc-100 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
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

        {/* Tile di navigazione per admin/manager */}
        {showFullDashboard && isManager && (
          <section>
            <div className="mb-6 border-b border-black pb-4">
              <h2 className="text-2xl text-zinc-900 font-semibold tracking-tight">Gestione</h2>
              <p className="text-sm text-zinc-600 mt-1">Seleziona la sezione che vuoi gestire.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link
                href="/dashboard/gestione-utenti"
                className="group flex flex-col justify-between rounded-2xl border border-black bg-white p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#060d41] text-white mb-5">
                    <Users size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">Gestione Utenti</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Approva registrazioni, gestisci profili, invita nuovi utenti e consulta gli operatori abilitati.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-white uppercase tracking-wide group-hover:gap-2 transition-all">
                  Apri <span aria-hidden>→</span>
                </div>
              </Link>

              <Link
                href="/dashboard/gestione-cataloghi"
                className="group flex flex-col justify-between rounded-2xl border border-black bg-white p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#060d41] text-white mb-5">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">Gestione Cataloghi</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Carica nuovi PDF, modifica stato e visibilità, aggiorna copertine ed elimina cataloghi.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-white uppercase tracking-wide group-hover:gap-2 transition-all">
                  Apri <span aria-hidden>→</span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {showFullDashboard && isPartner ? <PartnerListiniPortal /> : null}

        {showFullDashboard && isAgente ? <AgenteDocumentazionePortal /> : null}

        {/* Tile "Tutti i cataloghi" per ruoli non-admin */}
        {showFullDashboard && !isManager && user && !isFree && (
          <section>
            <Link
              href="/dashboard/i-miei-cataloghi"
              className="group flex flex-col justify-between rounded-2xl border border-black bg-white p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
            >
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#060d41] text-white mb-5">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">Tutti i Cataloghi</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Consulta l&apos;elenco completo dei cataloghi disponibili per il tuo profilo.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-white uppercase tracking-wide group-hover:gap-2 transition-all">
                Apri <span aria-hidden>→</span>
              </div>
            </Link>
          </section>
        )}

        {showFullDashboard && isManager && (
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

        {/* Contatti diretti per admin/manager (in fondo, come prima) e per utenti free */}
        {(isManager || isFree) && (
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
                        <a href={`mailto:${fornitore.email.trim()}`} className="ladiva-dashboard-btn-light flex-1 flex justify-center items-center gap-2 border border-black bg-white text-black hover:bg-zinc-100 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
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
            <Link href="/" className="ladiva-footer-link whitespace-nowrap">← Torna alla Home Pubblica</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
