import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Phone, MessageCircle, Users, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import AdminProfiliPanel, { type ProfiloGestioneRow } from '@/components/admin/AdminProfiliPanel'
import GerarchiaUtentiTree from '@/components/admin/GerarchiaUtentiTree'
import InvitaUtente from '@/components/InvitaUtente'
import type { ProfiloGerarchiaRow } from '@/lib/userHierarchy'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gestione Utenti · Ladiva Ceramica',
}

type Operatore = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  ruolo: 'agente' | 'distributore' | 'studio'
  area_geografica: string | null
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

export default async function GestioneUtentiPage(props: {
  searchParams: Promise<{ area?: string; nome?: string; message?: string }>
}) {
  const searchParams = await props.searchParams
  const areaFilter = searchParams?.area ?? 'all'
  const nomeFilter = (searchParams?.nome ?? '').trim()
  const actionMessage = searchParams?.message ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profilo } = await supabase
    .from('profili')
    .select('id, nome_completo, ruolo, area_geografica')
    .eq('id', user.id)
    .single()

  const ruoloCorrente = profilo?.ruolo ?? 'free'
  const isAdmin = ruoloCorrente === 'admin'
  const isManager = isAdmin || ruoloCorrente === 'manager'

  if (!isManager) redirect('/dashboard')

  // Aree disponibili per il filtro
  const { data: areeProfili } = await supabase
    .from('profili')
    .select('area_geografica')
    .not('area_geografica', 'is', null)

  const areeDisponibili = Array.from(
    new Set(
      (areeProfili ?? [])
        .map((p) => p.area_geografica)
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort((a, b) => a.localeCompare(b))

  const profiloSel =
    'id, nome_completo, email, telefono, societa, area_geografica, ruolo, registrazione_approvata, creato_il'

  let operatoriQuery = supabase
    .from('profili')
    .select('id, nome_completo, email, telefono, ruolo, area_geografica')
    .in('ruolo', ['agente', 'distributore', 'studio', 'partner_dipendente'])
      .order('nome_completo', { ascending: true })

  if (areaFilter !== 'all') operatoriQuery = operatoriQuery.eq('area_geografica', areaFilter)
  if (nomeFilter.length > 0) operatoriQuery = operatoriQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)

  let listaQuery = supabase
    .from('profili')
    .select(profiloSel)
    .neq('ruolo', 'free')
    .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
    .order('nome_completo', { ascending: true, nullsFirst: false })
    .limit(150)

  if (areaFilter !== 'all') listaQuery = listaQuery.eq('area_geografica', areaFilter)
  if (nomeFilter.length > 0) listaQuery = listaQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)

  const pendQuery = supabase
    .from('profili')
    .select(profiloSel)
    .eq('registrazione_approvata', false)
    .order('nome_completo', { ascending: true, nullsFirst: false })

  const linksQuery = supabase
    .from('connessioni_utente_operatore')
    .select('utente_id, operatore_id')
    .limit(2000)

  let gerarchiaQuery = supabase
    .from('profili')
    .select('id, nome_completo, email, area_geografica, ruolo, invitato_da, registrazione_approvata')
    .neq('ruolo', 'free')
    .order('nome_completo', { ascending: true, nullsFirst: false })

  if (areaFilter !== 'all') gerarchiaQuery = gerarchiaQuery.eq('area_geografica', areaFilter)
  if (nomeFilter.length > 0) {
    gerarchiaQuery = gerarchiaQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)
  }

  /** Tutti gli utenti approvati, senza filtro area/nome: usati per associare il ruolo inferiore. */
  const associazioneQuery = supabase
    .from('profili')
    .select('id, nome_completo, email, area_geografica, ruolo, invitato_da, registrazione_approvata')
    .neq('ruolo', 'free')
    .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
    .order('nome_completo', { ascending: true, nullsFirst: false })
    .limit(500)

  const [opRes, pendRes, listaRes, linksRes, gerarchiaRes, associazioneRes] = await Promise.all([
    operatoriQuery,
    pendQuery,
    listaQuery,
    linksQuery,
    gerarchiaQuery,
    associazioneQuery,
  ])

  const operatoriAdmin = (opRes.data ?? []) as Operatore[]
  const profiliRegistrazionePendente = (pendRes.data ?? []) as ProfiloGestioneRow[]
  const profiliGestioneAdmin = (listaRes.data ?? []) as ProfiloGestioneRow[]
  const connessioniUtenteOperatoreRows = (linksRes.data ?? []) as { utente_id: string; operatore_id: string }[]
  const profiliGerarchia = (gerarchiaRes.data ?? []) as ProfiloGerarchiaRow[]
  const profiliAssociazione = (associazioneRes.data ?? []) as ProfiloGerarchiaRow[]

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
            Gestione Utenti
          </h1>
        </div>

        {actionMessage ? (
          <div className="rounded-xl border border-black bg-white px-4 py-3 text-sm text-[#060d41]">
            {actionMessage}
          </div>
        ) : null}

        {/* Filtro */}
        <section id="filtro-utenti" className="border border-black rounded-2xl bg-white p-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-xl text-zinc-900 font-medium">Filtra utenti</h2>
              <p className="text-sm text-zinc-600 mt-1">Filtra per area geografica e/o per nome.</p>
            </div>
            <form className="flex flex-wrap items-center gap-3" method="get">
              <input
                type="search"
                name="nome"
                defaultValue={nomeFilter}
                placeholder="Es. Anita"
                aria-label="Cerca per nome"
                className="h-10 min-w-[10rem] flex-1 rounded-lg border border-black bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-500"
              />
              <select
                name="area"
                defaultValue={areaFilter}
                className="h-10 rounded-lg border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
              >
                <option value="all">Tutte le aree</option>
                {areeDisponibili.map((area) => (
                  <option key={area} value={area}>{area}</option>
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

        {/* Struttura organizzativa (matrioska) */}
        <GerarchiaUtentiTree
          currentUserId={user.id}
          viewerRole={ruoloCorrente}
          profili={profiliGerarchia}
          links={connessioniUtenteOperatoreRows}
        />

        {/* Gestione profili */}
        <AdminProfiliPanel
          currentUserId={user.id}
          profiliPendenti={profiliRegistrazionePendente}
          profiliLista={profiliGestioneAdmin}
          profiliGerarchia={profiliGerarchia}
          profiliAssociazione={profiliAssociazione}
          links={connessioniUtenteOperatoreRows}
          readOnly={!isAdmin}
        />

        {/* Invita utenti */}
        <section className="border border-black rounded-2xl bg-white p-6">
          <h2 className="text-xl text-zinc-900 font-medium mb-1">Invita utenti</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Genera un link di registrazione per il ruolo scelto. Il nuovo utente sarà collegato al tuo profilo dopo l&apos;approvazione.
          </p>
          <InvitaUtente ruoloCorrente={ruoloCorrente} />
        </section>

        {/* Operatori abilitati */}
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
                      {operatore.ruolo === 'distributore' ? 'partner' : operatore.ruolo}
                      {operatore.area_geografica ? ` • ${operatore.area_geografica}` : ''}
                    </p>
                  </div>
                  <div className="mt-auto flex gap-3 pt-6">
                    {operatore.telefono ? (
                      <>
                        <a href={`tel:${operatore.telefono.trim()}`} className="flex-1 flex justify-center items-center gap-2 bg-[#060d41] text-white hover:bg-[#0a155a] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors">
                          <Phone size={16} /> Chiama
                        </a>
                        <a href={`https://wa.me/${operatore.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 border border-black bg-zinc-50 hover:bg-[#25D366]/10 hover:border-[#25D366] hover:text-[#25D366] text-zinc-900 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
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
              <p className="text-sm text-zinc-600">Nessun operatore trovato per il filtro selezionato.</p>
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
