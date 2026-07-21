import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, FileText, Users } from 'lucide-react'
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
import { RUOLI_CATALOGO, isVenditoreLike } from '@/lib/catalogRoles'
import { isStudioLike } from '@/lib/catalogAccess'
import CreateCatalogForm from '@/components/admin/CreateCatalogForm'
import InvitaUtente from '@/components/InvitaUtente'
import ContattoDirettoCard from '@/components/dashboard/ContattoDirettoCard'
import GerarchiaUtentiTree from '@/components/admin/GerarchiaUtentiTree'
import AssociatiPiattiPanel from '@/components/dashboard/AssociatiPiattiPanel'
import {
  profiloToGerarchiaRow,
  filterProfiliInHierarchySubtree,
  resolveAgenziaParentForAgent,
  resolveFlatListOwnerProfile,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

const ASSISTENZA_LADIVA_TELEFONO = '+39 0536 185 6217'
const ASSISTENZA_LADIVA_EMAIL = 'info@ladiva-fpd.com'

function isAssistenzaLadivaContatto(row: { etichetta: string; email: string }): boolean {
  return (
    row.etichetta === 'Assistenza cataloghi' ||
    row.etichetta === 'Assistenza Ladiva' ||
    row.email === ASSISTENZA_LADIVA_EMAIL
  )
}

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
  ruolo?: string | null
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

export const dynamic = 'force-dynamic'

export default async function Dashboard(props: {
  searchParams: Promise<{ area?: string; nome?: string; message?: string }>
}) {
  const searchParams = await props.searchParams
  const nomeFilter = (searchParams?.nome ?? '').trim()
  const actionMessage = searchParams?.message ?? ''
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Recupera i dati del profilo
  const profilo = user
    ? (await supabase
      .from('profili')
      .select('id, nome_completo, ruolo, area_geografica, societa, registrazione_approvata, invitato_da')
      .eq('id', user.id)
      .single()).data
    : null

  const ruoloCorrente = profilo?.ruolo ?? 'free'
  const isAdmin = ruoloCorrente === 'admin'
  /** isManager è true sia per admin che per manager: entrambi vedono utenti e cataloghi completi. */
  const isManager = isAdmin || ruoloCorrente === 'manager'
  const isVenditoreLikeRole = isVenditoreLike(ruoloCorrente)
  const isPartner = ruoloCorrente === 'distributore'
  const isRivenditore = ruoloCorrente === 'rivenditore'
  const isAgente = ruoloCorrente === 'agente'
  const isAgenzia = ruoloCorrente === 'agenzia'
  const isStudio = ruoloCorrente === 'studio'
  const isPartnerDipendente = ruoloCorrente === 'partner_dipendente'
  const isStudioLikeRole = isStudioLike(ruoloCorrente)
  const isFree = !user || ruoloCorrente === 'free'

  // Recupera i cataloghi (RLS attivo)
  let cataloghiQuery = supabase
    .from('cataloghi')
    .select('*')
    .order('creato_il', { ascending: false })

  if (isManager && nomeFilter.length > 0) {
    cataloghiQuery = cataloghiQuery.ilike('titolo', `%${escapeIlikePattern(nomeFilter)}%`)
  }

  // Ospite, free o studio-like: solo cataloghi pubblicati (no bozze)
  if (!user || ruoloCorrente === 'free' || isStudioLikeRole) {
    cataloghiQuery = cataloghiQuery.eq('stato_pubblicazione', 'attivo')
  }

  const { data: cataloghi, error: cataloghiError } = await cataloghiQuery

  const cataloghiPerVista = (cataloghi ?? []).filter((c) => {
    if (!user && isLoginOnlyCatalogCategory(c.categoria as string | null)) return false
    if (isVenditoreLikeRole && isAgentOnlyCatalogCategory(c.categoria as string | null)) return false
    if (isStudioLikeRole && !isCatalogCategoryAllowedForStudioRole(c.categoria as string | null)) return false
    return true
  })

  // Recupera fornitori associati a questo agente (se non è un profilo free)
  let fornitori: Fornitore[] = []
  if (user && ruoloCorrente !== 'free' && !isStudioLikeRole) {
    const { data: fornitoriRaw } = await supabase
      .from('connessioni_agente_fornitore')
      .select(`
        fornitore:profili!fornitore_id (
          id,
          nome_completo,
          telefono,
          email,
          ruolo
        )
      `)
      .eq('agente_id', user.id)

    const fornitoriEstratti =
      fornitoriRaw?.flatMap((f) => {
        const fornitore = f.fornitore
        if (!fornitore) return []
        return Array.isArray(fornitore) ? fornitore : [fornitore]
      }) || []

    fornitori = fornitoriEstratti
      .filter(Boolean)
      .map((f) => ({ ...f, ruolo: f.ruolo ?? null })) as Fornitore[]
  }

  let operatoriAssegnatiUtente: Fornitore[] = []
  if (user && profilo?.registrazione_approvata !== false) {
    const { data: opLinkRows } = await supabase.from('connessioni_utente_operatore').select(`
        operatore:profili!operatore_id (
          id,
          nome_completo,
          telefono,
          email,
          ruolo
        )
      `).eq('utente_id', user.id)

    const estratti =
      opLinkRows?.flatMap((row) => {
        const op = row.operatore
        if (!op) return []
        return Array.isArray(op) ? op : [op]
      }) || []

    operatoriAssegnatiUtente = estratti
      .filter(Boolean)
      .map((o) => ({ ...o, ruolo: o.ruolo ?? null })) as Fornitore[]
  }

  // Per studio, partner_dipendente, partner e agenzia: carica solo il profilo di chi li ha invitati
  let invitatoDaContatto: Fornitore | null = null
  if ((isStudioLikeRole || isVenditoreLikeRole || isAgenzia) && profilo?.invitato_da) {
    const { data: inviterData } = await supabase
      .from('profili')
      .select('id, nome_completo, email, telefono, ruolo')
      .eq('id', profilo.invitato_da)
      .single()
    if (inviterData) {
      invitatoDaContatto = { ...inviterData, ruolo: inviterData.ruolo ?? null }
    }
  }

  // Gerarchia propria per agenzia/agente/partner
  const PROFILI_GERARCHIA_SEL =
    'id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata, seguito_da, espositore_1, espositore_2, box_show_room_1, box_show_room_2, box_show_room_3, box_show_room_4, agenzia_campione_1, agenzia_campione_2, agenzia_catalogo_1, agenzia_catalogo_2, agenzia_campioni_aggiornato_il, agenzia_cataloghi_aggiornato_il, espositori_aggiornato_il, box_aggiornato_il'

  let profiliGerarchiaDashboard: ProfiloGerarchiaRow[] = []
  let linksDashboard: { utente_id: string; operatore_id: string }[] = []
  if (user && (isAgenzia || isAgente || isVenditoreLikeRole)) {
    const gerarchiaClient =
      isAgenzia || isAgente ? createServiceRoleSupabase() ?? supabase : supabase
    const [profiliRes, linksRes] = await Promise.all([
      gerarchiaClient
        .from('profili')
        .select(PROFILI_GERARCHIA_SEL)
        .neq('ruolo', 'free')
        .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
        .limit(500),
      gerarchiaClient
        .from('connessioni_utente_operatore')
        .select('utente_id, operatore_id')
        .limit(2000),
    ])
    profiliGerarchiaDashboard = (profiliRes.data ?? []) as ProfiloGerarchiaRow[]
    linksDashboard = (linksRes.data ?? []) as { utente_id: string; operatore_id: string }[]

    if (isAgenzia || isAgente) {
      const selfRowForScope = profiloToGerarchiaRow(
        { ...profilo!, email: user.email ?? null },
        profilo!.invitato_da ?? null,
      )
      const scopeRoot = isAgente
        ? resolveAgenziaParentForAgent(selfRowForScope, profiliGerarchiaDashboard, linksDashboard) ??
          selfRowForScope
        : selfRowForScope
      profiliGerarchiaDashboard = filterProfiliInHierarchySubtree(
        scopeRoot,
        profiliGerarchiaDashboard,
        linksDashboard,
      )
    }
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
      .eq('ruolo', 'rivenditore')
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
      .in('ruolo', ['agente', 'rivenditore', 'distributore'])
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
    : (contattiAziendaliRows || []).map((row) => {
        const isAssistenza = isAssistenzaLadivaContatto(row)
        const telefono =
          row.telefono?.trim() ||
          (isAssistenza ? ASSISTENZA_LADIVA_TELEFONO : null)
        return {
          id: row.id,
          nome_completo: isAssistenza ? 'Assistenza Ladiva' : row.etichetta,
          email: row.email,
          telefono,
        }
      })

  const contattiDiRete = (isAgente || isAgenzia)
    ? mergeContattiById(fornitori, operatoriAssegnatiUtente)
    : (isStudioLikeRole || isVenditoreLikeRole)
      ? (invitatoDaContatto ? [invitatoDaContatto] : [])
      : operatoriAssegnatiUtente.length > 0
        ? operatoriAssegnatiUtente
        : isFree
          ? contattiDirettiPubblici
          : fornitori
  const contattiDiretti = (
    isFree || isManager
      ? contattiAziendali
      : [...contattiAziendali, ...contattiDiRete]
  ).filter((c) => c.id !== user?.id)

  const categorieDashboard = categoriesVisibleOnDashboard(ruoloCorrente, Boolean(user))

  const inAttesaApprovazione = Boolean(user && profilo && profilo.registrazione_approvata === false)
  const showFullDashboard = !inAttesaApprovazione

  let gerarchiaOwnerProfile: ProfiloGerarchiaRow | undefined
  let associatiPiattiOwnerProfile: ProfiloGerarchiaRow | undefined
  if (user && profilo && profiliGerarchiaDashboard.length > 0) {
    const selfRow = profiloToGerarchiaRow(
      { ...profilo, email: user.email ?? null },
      profilo.invitato_da ?? null,
    )
    associatiPiattiOwnerProfile = resolveFlatListOwnerProfile(
      isAgenzia ? 'agenzia' : isAgente ? 'agente' : isPartner ? 'distributore' : 'rivenditore',
      selfRow,
      profiliGerarchiaDashboard,
      linksDashboard,
    )
    if (isAgente) {
      gerarchiaOwnerProfile =
        resolveAgenziaParentForAgent(selfRow, profiliGerarchiaDashboard, linksDashboard) ?? selfRow
    } else {
      gerarchiaOwnerProfile = selfRow
    }
  }

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
              : <>Bentornato {profilo?.nome_completo || user?.email || 'Utente Free'}</>
            }
            {user ? (
              <>
                {isAdmin ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Admin</span> : null}
                {ruoloCorrente === 'manager' ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Manager</span> : null}
                {isPartner ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Venditore</span> : null}
                {isRivenditore ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Rivenditore</span> : null}
                {isAgenzia ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Agenzia</span> : null}
                {isAgente ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Agente</span> : null}
                {isStudio ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Studio</span> : null}
                {isPartnerDipendente ? <span className="ml-3 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white">Promoter</span> : null}
                {user && profilo?.registrazione_approvata === false ? (
                  <span className="ml-3 inline-flex items-center rounded-full border border-amber-300 px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-900">
                    In attesa di approvazione
                  </span>
                ) : null}
                {isFree && !isManager && !isVenditoreLikeRole && !isAgenzia && !isAgente && !isStudio && !isPartnerDipendente && profilo?.registrazione_approvata !== false ? (
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

        {showFullDashboard && (isAgenzia || isVenditoreLikeRole || isAgente) && associatiPiattiOwnerProfile && (
          <AssociatiPiattiPanel
            ownerProfile={associatiPiattiOwnerProfile}
            viewerRole={
              isAgenzia ? 'agenzia' : isAgente ? 'agente' : isPartner ? 'distributore' : 'rivenditore'
            }
            profili={profiliGerarchiaDashboard}
            links={linksDashboard}
          />
        )}

        {showFullDashboard && (isAgenzia || isAgente || isVenditoreLikeRole) && gerarchiaOwnerProfile && (
          <GerarchiaUtentiTree
            currentUserId={user!.id}
            viewerRole={ruoloCorrente}
            profili={profiliGerarchiaDashboard}
            links={linksDashboard}
            ownerProfile={gerarchiaOwnerProfile}
          />
        )}

        {showFullDashboard && !isManager && (isVenditoreLikeRole || isPartnerDipendente || isAgenzia || isAgente) && (
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
                  <ContattoDirettoCard
                    key={fornitore.id}
                    nome={fornitore.nome_completo}
                    email={fornitore.email}
                    telefono={fornitore.telefono}
                    ruolo={fornitore.ruolo}
                  />
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

              {isAdmin && (
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
              )}
            </div>
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
                  <ContattoDirettoCard
                    key={fornitore.id}
                    nome={fornitore.nome_completo}
                    email={fornitore.email}
                    telefono={fornitore.telefono}
                    ruolo={fornitore.ruolo}
                  />
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
