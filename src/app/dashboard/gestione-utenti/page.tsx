import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import AdminProfiliPanel, { type ProfiloGestioneRow } from '@/components/admin/AdminProfiliPanel'
import GerarchiaUtentiTree from '@/components/admin/GerarchiaUtentiTree'
import InvitaUtente from '@/components/InvitaUtente'
import type { ProfiloGerarchiaRow } from '@/lib/userHierarchy'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gestione Utenti · Ladiva Ceramica',
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

const RUOLO_FILTER_OPTIONS = [
  { value: 'all',               label: 'Tutti i ruoli' },
  { value: 'admin',             label: 'Admin' },
  { value: 'manager',           label: 'Manager' },
  { value: 'agenzia',           label: 'Agenzia' },
  { value: 'agente',            label: 'Agente' },
  { value: 'rivenditore',       label: 'Rivenditore' },
  { value: 'distributore',      label: 'Venditore' },
  { value: 'partner_dipendente',label: 'Promoter' },
  { value: 'studio',            label: 'Studio' },
  { value: 'free',              label: 'Free' },
]

export default async function GestioneUtentiPage(props: {
  searchParams: Promise<{ ruolo?: string; nome?: string; message?: string }>
}) {
  const searchParams = await props.searchParams
  const ruoloFilter = searchParams?.ruolo ?? 'all'
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

  const profiloSel =
    'id, nome_completo, email, telefono, societa, area_geografica, ruolo, registrazione_approvata, creato_il'

  let listaQuery = supabase
    .from('profili')
    .select(profiloSel)
    .neq('ruolo', 'free')
    .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
    .order('nome_completo', { ascending: true, nullsFirst: false })
    .limit(150)

  if (ruoloFilter !== 'all') listaQuery = listaQuery.eq('ruolo', ruoloFilter)
  if (nomeFilter.length > 0) listaQuery = listaQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)

  const pendQuery = supabase
    .from('profili')
    .select(profiloSel)
    .eq('registrazione_approvata', false)
    .order('nome_completo', { ascending: true, nullsFirst: false })

  // Per la struttura organizzativa usiamo il service role per bypassare la RLS e
  // vedere tutte le connessioni/profili indipendentemente dal ruolo del viewer.
  const svc = createServiceRoleSupabase() ?? supabase

  const linksQuery = svc
    .from('connessioni_utente_operatore')
    .select('utente_id, operatore_id')
    .limit(2000)

  let gerarchiaQuery = svc
    .from('profili')
    .select('id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata')
    .neq('ruolo', 'free')
    .order('nome_completo', { ascending: true, nullsFirst: false })

  if (ruoloFilter !== 'all') gerarchiaQuery = gerarchiaQuery.eq('ruolo', ruoloFilter)
  if (nomeFilter.length > 0) {
    gerarchiaQuery = gerarchiaQuery.ilike('nome_completo', `%${escapeIlikePattern(nomeFilter)}%`)
  }

  /** Tutti gli utenti approvati, senza filtro area/nome: usati per associare il ruolo inferiore. */
  const associazioneQuery = svc
    .from('profili')
    .select('id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata')
    .neq('ruolo', 'free')
    .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
    .order('nome_completo', { ascending: true, nullsFirst: false })
    .limit(500)

  /** Cataloghi attivi per permessi per-utente (sessione admin/manager, non service role). */
  const cataloghiQuery = supabase
    .from('cataloghi')
    .select('id, titolo, categoria, ruoli_visibili')
    .eq('stato_pubblicazione', 'attivo')
    .order('titolo', { ascending: true, nullsFirst: false })

  const [pendRes, listaRes, linksRes, gerarchiaRes, associazioneRes, cataloghiRes] = await Promise.all([
    pendQuery,
    listaQuery,
    linksQuery,
    gerarchiaQuery,
    associazioneQuery,
    cataloghiQuery,
  ])

  const profiliRegistrazionePendente = (pendRes.data ?? []) as ProfiloGestioneRow[]
  const profiliGestioneAdmin = (listaRes.data ?? []) as ProfiloGestioneRow[]
  const connessioniUtenteOperatoreRows = (linksRes.data ?? []) as { utente_id: string; operatore_id: string }[]
  const profiliGerarchia = (gerarchiaRes.data ?? []) as ProfiloGerarchiaRow[]
  const profiliAssociazione = (associazioneRes.data ?? []) as ProfiloGerarchiaRow[]
  const allCataloghi = (cataloghiRes.data ?? []) as { id: string; titolo: string | null; categoria: string | null; ruoli_visibili: string[] }[]

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
              <p className="text-sm text-zinc-600 mt-1">Filtra per ruolo e/o per nome.</p>
            </div>
            <form className="flex flex-wrap items-center gap-3" method="get">
              <input
                type="search"
                name="nome"
                defaultValue={nomeFilter}
                placeholder="Es. Fabio"
                aria-label="Cerca per nome"
                className="h-10 min-w-[10rem] flex-1 rounded-lg border border-black bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-500"
              />
              <select
                name="ruolo"
                defaultValue={ruoloFilter}
                className="h-10 rounded-lg border border-black bg-zinc-50 px-3 text-sm text-zinc-900"
              >
                {RUOLO_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
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
          allCataloghi={allCataloghi}
          readOnly={!isAdmin}
          canManageCataloghi={isManager}
        />

        {/* Invita utenti */}
        <section className="border border-black rounded-2xl bg-white p-6">
          <h2 className="text-xl text-zinc-900 font-medium mb-1">Invita utenti</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Genera un link di registrazione per il ruolo scelto. Il nuovo utente sarà collegato al tuo profilo dopo l&apos;approvazione.
          </p>
          <InvitaUtente ruoloCorrente={ruoloCorrente} />
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
