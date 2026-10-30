'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Users, UserCheck } from 'lucide-react'
import CreaAssociatoManuale from '@/components/admin/CreaAssociatoManuale'
import LinkPasswordUtente from '@/components/admin/LinkPasswordUtente'
import CatalogoPermessiPanel, { type CatalogoDisponibile } from '@/components/admin/CatalogoPermessiPanel'
import RivenditoreProfiloCampi from '@/components/admin/RivenditoreProfiloCampi'
import AgenziaProfiloCampi from '@/components/admin/AgenziaProfiloCampi'
import { readRivenditoreCampiFromFormData } from '@/lib/rivenditoreProfiloOptions'
import { readAgenziaCampiFromFormData } from '@/lib/agenziaProfiloOptions'
import {
  buildOpzioniSpecializzazioneMap,
  type OpzioniSpecializzazioneMap,
} from '@/lib/profiloSpecializzazioneOpzioni'
import {
  isRivenditoreManagedByAgenzia,
  isRivenditoreManagedByAgente,
  profiloGerarchiaDisplayLabel,
  profiloToGerarchiaRow,
  resolveAgenziaParentForAgent,
  resolveRivenditoreParentForDistributore,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'
import { isAgenteLike } from '@/lib/catalogRoles'
import { isEmailTecnica, ruoloConEmailDiLogin } from '@/lib/emailTecnica'
import AssociazioneMonteCampi from '@/components/admin/AssociazioneMonteCampi'
import { fasceAssociazione, regolaAssociazioneMonte, selezioneFascia } from '@/lib/associazioneMonte'

import { useAppLocale } from '@/lib/useAppLocale'
import { tDashboard } from '@/lib/i18n'
import { tAdmin, tRuolo, tRivenditoriCount } from '@/lib/i18nAdmin'

function ruoloHaSede(ruolo: string) {
  return ruolo === 'agenzia' || ruolo === 'rivenditore' || ruolo === 'studio'
}

function nomeSedeProfilo(p: { societa: string | null; nome_completo: string | null }) {
  return (p.societa || p.nome_completo || '').trim()
}

function leggiFasce(fd: FormData, ruolo: string) {
  return fasceAssociazione(ruolo).map((fascia) => ({
    id: fascia.id,
    sede_id: String(fd.get(`fascia_${fascia.id}_sede`) ?? '').trim() || null,
    persona_id: String(fd.get(`fascia_${fascia.id}_persona`) ?? '').trim() || null,
  }))
}

function fasceInvariate(
  profilo: ProfiloGerarchiaRow,
  profili: ProfiloGerarchiaRow[],
  links: { utente_id: string; operatore_id: string }[],
  scelte: { id: string; sede_id: string | null; persona_id: string | null }[],
) {
  return fasceAssociazione(profilo.ruolo).every((fascia) => {
    const scelta = scelte.find((item) => item.id === fascia.id)
    const attuale = selezioneFascia(fascia, profilo, profili, links)
    const persona = fascia.personaRuoli.length > 0 ? (scelta?.persona_id ?? null) : null
    return (scelta?.sede_id ?? null) === (attuale.sedeId ?? null) && persona === (attuale.personaId ?? null)
  })
}

export type ProfiloGestioneRow = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  societa: string | null
  area_geografica: string | null
  ruolo: string
  invitato_da?: string | null
  registrazione_approvata: boolean | null
  creato_il: string | null
  espositore_1?: string | null
  espositore_2?: string | null
  seguito_da?: string | null
  giro_visita?: string | null
  telefonata?: string | null
  note_visita?: string | null
  note_telefonata?: string | null
  box_show_room_1?: string | null
  box_show_room_2?: string | null
  box_show_room_3?: string | null
  box_show_room_4?: string | null
  agenzia_campione_1?: string | null
  agenzia_campione_2?: string | null
  agenzia_catalogo_1?: string | null
  agenzia_catalogo_2?: string | null
  agenzia_catalogo_3?: string | null
  agenzia_catalogo_4?: string | null
  espositore_1_qta?: number | null
  espositore_2_qta?: number | null
  box_show_room_1_qta?: number | null
  box_show_room_2_qta?: number | null
  box_show_room_3_qta?: number | null
  box_show_room_4_qta?: number | null
  agenzia_campione_1_qta?: number | null
  agenzia_campione_2_qta?: number | null
  agenzia_catalogo_1_qta?: number | null
  agenzia_catalogo_2_qta?: number | null
  espositore_1_data?: string | null
  espositore_2_data?: string | null
  box_show_room_1_data?: string | null
  box_show_room_2_data?: string | null
  box_show_room_3_data?: string | null
  box_show_room_4_data?: string | null
  agenzia_campione_1_data?: string | null
  agenzia_campione_2_data?: string | null
  agenzia_catalogo_1_data?: string | null
  agenzia_catalogo_2_data?: string | null
  agenzia_catalogo_3_qta?: number | null
  agenzia_catalogo_4_qta?: number | null
  agenzia_catalogo_3_data?: string | null
  agenzia_catalogo_4_data?: string | null
}

export type OperatoreAssociazione = {
  id: string
  nome_completo: string | null
  email: string | null
  telefono: string | null
  ruolo: string
  area_geografica: string | null
}

const RUOLI_OPTIONS = ['admin', 'manager', 'agenzia', 'agente', 'back_office', 'rivenditore', 'distributore', 'partner_dipendente', 'studio', 'studio_associato', 'free'] as const

/** Ruoli per cui ha senso personalizzare la dashboard portale per singolo utente. */
function puoPersonalizzareCataloghi(ruolo: string): boolean {
  return !['admin', 'free', 'manager'].includes(ruolo)
}

type RuoloOption = (typeof RUOLI_OPTIONS)[number]

type RuoloTabId = 'admin' | 'manager' | 'agenzia' | 'agente' | 'back_office' | 'rivenditore' | 'distributore' | 'studio' | 'studio_associato' | 'partner_dipendente' | 'free'

const RUOLI_TAB: { id: RuoloTabId }[] = [
  { id: 'admin' },
  { id: 'manager' },
  { id: 'agenzia' },
  { id: 'agente' },
  { id: 'back_office' },
  { id: 'rivenditore' },
  { id: 'distributore' },
  { id: 'partner_dipendente' },
  { id: 'studio' },
  { id: 'studio_associato' },
]

function profiloSortKey(p: ProfiloGestioneRow): string {
  return (p.societa || p.nome_completo || p.email || p.id).trim().toLocaleLowerCase('it')
}

function sortProfiliAlfabetico(list: ProfiloGestioneRow[]): ProfiloGestioneRow[] {
  return [...list].sort((a, b) =>
    profiloSortKey(a).localeCompare(profiloSortKey(b), 'it', { sensitivity: 'base' }),
  )
}

type Props = {
  currentUserId: string
  profiliPendenti: ProfiloGestioneRow[]
  profiliLista: ProfiloGestioneRow[]
  profiliGerarchia: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  /** Tutti i cataloghi attivi (con ruoli_visibili) per la gestione permessi per-utente. */
  allCataloghi: CatalogoDisponibile[]
  /** Whitelist già letta in pagina, per utente. Evita una richiesta per ogni scheda. */
  permessiPerUtente?: Record<string, string[]>
  /** False se la lettura dei permessi in pagina non è riuscita: la scheda li richiede da sola. */
  permessiPronti?: boolean
  /** Quando true (ruolo manager) i profili approvati restano in sola lettura. */
  readOnly?: boolean
  /** Admin e manager possono approvare o rifiutare le registrazioni pendenti. */
  canReviewPending?: boolean
  /** Admin e manager possono aggiornare strumenti/cataloghi (agenzia) ed espositori/box (rivenditore). */
  canEditSpecializzazione?: boolean
  /** Admin e manager possono gestire i cataloghi visibili anche se readOnly è true. */
  canManageCataloghi?: boolean
  /** Admin e manager possono inserire a mano agenzie, rivenditori, agenti e venditori. */
  canCreateAssociati?: boolean
  /** Vista agenzia/agente: elenco rivenditori associati, senza approvazioni né tab multi-ruolo. */
  agenziaRivenditoriMode?: boolean
  /** L'agenzia può aggiornare espositori e box dei rivenditori collegati. */
  canEditRivenditoreAsAgenzia?: boolean
  /** L'agente può aggiornare espositori e box dei rivenditori collegati. */
  canEditRivenditoreAsAgente?: boolean
  /** Apre di default i profili nell'elenco (details espansi). */
  apriProfiliDiDefault?: boolean
  /** Admin: aggiunge/rimuove voci nei menu a tendina specializzazione. */
  canManageSpecializzazioneOpzioni?: boolean
  /** Eliminazione account. I manager gestiscono profilo e associazioni, senza cancellare. */
  canDeleteUtenti?: boolean
  /** Con una ricerca nome/email mostra tutti i risultati, anche senza associazione. */
  cercaAttiva?: boolean
}

const DEFAULT_SPECIALIZZAZIONE_OPZIONI = buildOpzioniSpecializzazioneMap([])

export default function AdminProfiliPanel({
  currentUserId,
  profiliPendenti,
  profiliLista,
  profiliGerarchia,
  links,
  allCataloghi,
  permessiPerUtente = {},
  permessiPronti = false,
  readOnly = false,
  canReviewPending = false,
  canEditSpecializzazione = false,
  canManageCataloghi = false,
  canCreateAssociati = false,
  agenziaRivenditoriMode = false,
  canEditRivenditoreAsAgenzia = false,
  canEditRivenditoreAsAgente = false,
  apriProfiliDiDefault = false,
  canManageSpecializzazioneOpzioni = false,
  canDeleteUtenti = !readOnly,
  cercaAttiva = false,
}: Props) {
  const router = useRouter()
  const locale = useAppLocale()
  const copy = tAdmin(locale)
  const dashCopy = tDashboard(locale)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()
  const salvaPermessiById = useRef(new Map<string, () => Promise<boolean>>())
  const [specializzazioneOpzioni, setSpecializzazioneOpzioni] =
    useState<OpzioniSpecializzazioneMap>(DEFAULT_SPECIALIZZAZIONE_OPZIONI)
  const [ruoloAttivo, setRuoloAttivo] = useState<RuoloTabId>(
    agenziaRivenditoriMode ? 'rivenditore' : 'admin',
  )
  const [soloAssociati, setSoloAssociati] = useState(!cercaAttiva)
  const [listaAperta, setListaAperta] = useState(false)
  const [schedeAperte, setSchedeAperte] = useState<Set<string>>(() => new Set())

  const specializzazioneOpzioniFormProps = {
    opzioni: specializzazioneOpzioni,
    canManageOpzioni: canManageSpecializzazioneOpzioni,
    onOpzioniChange: canManageSpecializzazioneOpzioni
      ? setSpecializzazioneOpzioni
      : undefined,
  }

  const ruoliTab = agenziaRivenditoriMode
    ? RUOLI_TAB.filter((tab) => tab.id === 'rivenditore')
    : cercaAttiva && profiliLista.some((p) => p.ruolo === 'free')
      ? [...RUOLI_TAB, { id: 'free' as const }]
      : RUOLI_TAB

  const profiliPendentiOrdinati = useMemo(() => sortProfiliAlfabetico(profiliPendenti), [profiliPendenti])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/profili/specializzazione-opzioni', {
          credentials: 'same-origin',
        })
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; opzioni?: OpzioniSpecializzazioneMap }
          | null
        if (!cancelled && res.ok && data?.ok && data.opzioni) {
          setSpecializzazioneOpzioni(data.opzioni)
        }
      } catch {
        /* fallback: opzioni predefinite */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const profiliListaGestione = useMemo(
    () => (cercaAttiva ? profiliLista : profiliLista.filter((p) => p.ruolo !== 'free')),
    [profiliLista, cercaAttiva],
  )

  const profiliPerRuolo = useMemo(() => {
    const map = new Map<RuoloTabId, ProfiloGestioneRow[]>()
    for (const tab of ruoliTab) map.set(tab.id, [])
    for (const profilo of sortProfiliAlfabetico(profiliListaGestione)) {
      const ruolo = profilo.ruolo as RuoloTabId
      if (!map.has(ruolo)) continue
      map.get(ruolo)!.push(profilo)
    }
    return map
  }, [profiliListaGestione, ruoliTab])

  const profiliRuoloAttivo = profiliPerRuolo.get(ruoloAttivo) ?? []

  const invitatoDaById = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const row of profiliGerarchia) m.set(row.id, row.invitato_da)
    return m
  }, [profiliGerarchia])

  const mostraStatoAssociazione =
    !agenziaRivenditoriMode &&
    (ruoloAttivo === 'agente' ||
      ruoloAttivo === 'back_office' ||
      ruoloAttivo === 'distributore' ||
      ruoloAttivo === 'partner_dipendente' ||
      ruoloAttivo === 'studio_associato')

  const profiloHaAssociazione = useMemo(() => {
    return (p: ProfiloGestioneRow) => {
      const row = profiloToGerarchiaRow(p, p.invitato_da ?? invitatoDaById.get(p.id) ?? null)
      const inviter = profiliGerarchia.find((item) => item.id === row.invitato_da)
      if (p.ruolo === 'agente' || p.ruolo === 'back_office') {
        if (resolveAgenziaParentForAgent(row, profiliGerarchia, links)) return true
        return Boolean(inviter && isAgenteLike(inviter.ruolo))
      }
      if (p.ruolo === 'distributore' || p.ruolo === 'partner_dipendente') {
        if (resolveRivenditoreParentForDistributore(row, profiliGerarchia, links)) return true
        return Boolean(
          inviter &&
            (inviter.ruolo === 'distributore' ||
              inviter.ruolo === 'rivenditore' ||
              inviter.ruolo === 'partner_dipendente'),
        )
      }
      if (p.ruolo === 'studio_associato') {
        if (inviter?.ruolo === 'studio' || inviter?.ruolo === 'studio_associato') return true
        return profiliGerarchia.some(
          (other) =>
            other.ruolo === 'studio' &&
            links.some(
              (link) =>
                (link.utente_id === p.id && link.operatore_id === other.id) ||
                (link.operatore_id === p.id && link.utente_id === other.id),
            ),
        )
      }
      return false
    }
  }, [invitatoDaById, profiliGerarchia, links])

  const profiliAssociati = mostraStatoAssociazione
    ? profiliRuoloAttivo.filter((p) => profiloHaAssociazione(p))
    : []
  const profiliNonAssociati = mostraStatoAssociazione
    ? profiliRuoloAttivo.filter((p) => !profiloHaAssociazione(p))
    : []
  const profiliVisibili =
    mostraStatoAssociazione && !cercaAttiva
      ? soloAssociati
        ? profiliAssociati
        : profiliNonAssociati
      : profiliRuoloAttivo

  useEffect(() => {
    const firstConUtenti = ruoliTab.find((tab) => (profiliPerRuolo.get(tab.id)?.length ?? 0) > 0)
    if ((profiliPerRuolo.get(ruoloAttivo)?.length ?? 0) > 0) return
    if (firstConUtenti) setRuoloAttivo(firstConUtenti.id)
  }, [profiliPerRuolo, ruoloAttivo, ruoliTab])

  useEffect(() => {
    setListaAperta(false)
  }, [ruoloAttivo, soloAssociati])

  async function postUpdate(body: Record<string, unknown>, refresh = true) {
    setError(null)
    setMessage(null)
    const res = await fetch('/api/admin/profili/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
    if (!res.ok || !data?.ok) {
      setError(data?.message ?? 'Aggiornamento non riuscito')
      return false
    }
    setMessage(data.message ?? 'Salvato')
    if (refresh) router.refresh()
    return true
  }

  async function postAssociazioneMonte(
    profiloId: string,
    fasce: { id: string; sede_id: string | null; persona_id: string | null }[],
    refresh = true,
  ) {
    const res = await fetch('/api/admin/profili/associa-monte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        profilo_id: profiloId,
        fasce,
      }),
    })
    const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
    if (!res.ok || !data?.ok) {
      setMessage(null)
      setError(data?.message ?? 'Associazione non salvata')
      if (refresh) router.refresh()
      return false
    }
    if (refresh) router.refresh()
    return true
  }

  async function salvaScheda(
    profiloId: string,
    fd: FormData,
    emailAttuale: string | null | undefined,
    ruolo: string,
    profilo: ProfiloGerarchiaRow,
  ) {
    setSavingId(profiloId)
    try {
      const fasce = fd.has('fascia_associazione') ? leggiFasce(fd, ruolo) : null
      const aggiornaFasce = Boolean(fasce && !fasceInvariate(profilo, profiliGerarchia, links, fasce))
      const salvaPermessi = salvaPermessiById.current.get(profiloId)
      const [ok, permessiOk] = await Promise.all([
        postUpdate(readForm(fd, profiloId, emailAttuale), false),
        salvaPermessi ? salvaPermessi() : Promise.resolve(true),
      ])
      if (!ok) return
      if (aggiornaFasce && fasce) {
        const assocOk = await postAssociazioneMonte(profiloId, fasce, false)
        if (!assocOk) return
      }
      if (!permessiOk) {
        setError('Profilo salvato, ma la dashboard non è stata aggiornata')
      }
      startRefresh(() => {
        router.refresh()
      })
    } finally {
      setSavingId(null)
    }
  }

  async function postDelete(profiloId: string) {
    setError(null)
    setMessage(null)
    if (
      !window.confirm(copy.eliminaConfirm)
    ) {
      return false
    }
    setDeletingId(profiloId)
    try {
      const res = await fetch('/api/admin/profili/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ profilo_id: profiloId }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Eliminazione non riuscita')
        return false
      }
      setMessage(data.message ?? 'Utente eliminato')
      router.refresh()
      return true
    } finally {
      setDeletingId(null)
    }
  }

  function readForm(fd: FormData, profiloId: string, emailAttuale?: string | null) {
    const nome_completo = String(fd.get('nome_completo') ?? '').trim() || null
    const emailInserita = String(fd.get('email') ?? '').trim().toLowerCase()
    const telefono = String(fd.get('telefono') ?? '').trim() || null
    const societa = String(fd.get('societa') ?? '').trim() || null
    const area_geografica = String(fd.get('area_geografica') ?? '').trim() || null
    const ruolo = String(fd.get('ruolo') ?? '').trim()
    const rawApprovazione = fd.get('registrazione_approvata')
    const registrazione_approvata =
      rawApprovazione === 'on' || rawApprovazione === 'true' || rawApprovazione === '1'
    const body: Record<string, unknown> = {
      profilo_id: profiloId,
      nome_completo: ruoloHaSede(ruolo) ? societa : nome_completo,
      telefono,
      societa,
      area_geografica,
      ruolo,
      registrazione_approvata,
    }
    // Campo vuoto su un account tecnico: non cancellare l’email interna.
    if (!(ruoloConEmailDiLogin(ruolo) && !emailInserita && isEmailTecnica(emailAttuale))) {
      body.email = emailInserita || null
    }
    if (ruoloConEmailDiLogin(ruolo)) {
      const password = String(fd.get('password_accesso') ?? '').trim()
      if (password) body.password = password
    }
    if (ruolo === 'rivenditore') {
      Object.assign(body, readRivenditoreCampiFromFormData(fd))
    } else if ((ruolo === 'studio' || ruolo === 'studio_associato') && fd.has('seguito_da')) {
      body.seguito_da = String(fd.get('seguito_da') ?? '').trim() || null
    }
    if (ruolo === 'agenzia') {
      Object.assign(body, readAgenziaCampiFromFormData(fd))
    }
    if (fd.has('giro_visita') || fd.has('telefonata') || fd.has('note_visita') || fd.has('note_telefonata')) {
      body.giro_visita = String(fd.get('giro_visita') ?? '').trim() || null
      body.telefonata = String(fd.get('telefonata') ?? '').trim() || null
      body.note_visita = String(fd.get('note_visita') ?? '').trim() || null
      body.note_telefonata = String(fd.get('note_telefonata') ?? '').trim() || null
    }
    return body
  }

  function readFormSpecializzazione(fd: FormData, profiloId: string, ruolo: string) {
    const body: Record<string, unknown> = { profilo_id: profiloId }
    if (ruolo === 'rivenditore') {
      Object.assign(body, readRivenditoreCampiFromFormData(fd))
      delete body.seguito_da
    }
    if (ruolo === 'agenzia') {
      Object.assign(body, readAgenziaCampiFromFormData(fd))
    }
    return body
  }

  function campiAssociazione(profilo: ProfiloGestioneRow, inputClassName: string) {
    if (!canCreateAssociati || !regolaAssociazioneMonte(profilo.ruolo)) return null
    return (
      <AssociazioneMonteCampi
        profilo={profiloToGerarchiaRow(
          profilo,
          profilo.invitato_da ?? invitatoDaById.get(profilo.id) ?? null,
        )}
        profili={profiliGerarchia}
        links={links}
        ruoloLabel={(ruolo) => tRuolo(locale, ruolo)}
        personaLabel={copy.associaPersona}
        inputClassName={inputClassName}
      />
    )
  }

  function campiGiroTelefonata(profilo: ProfiloGestioneRow, inputClassName: string) {
    if (!canCreateAssociati) return null
    if (profilo.ruolo !== 'agenzia' && profilo.ruolo !== 'agente') return null
    return (
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Giro visita
          <input
            name="giro_visita"
            type="date"
            defaultValue={(profilo.giro_visita ?? '').slice(0, 10)}
            className={inputClassName}
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Telefonata
          <input
            name="telefonata"
            type="date"
            defaultValue={(profilo.telefonata ?? '').slice(0, 10)}
            className={inputClassName}
          />
        </label>
        <p className="md:col-span-2 text-xs font-normal normal-case text-zinc-500">
          La visita diventa rossa dopo 90 giorni, la telefonata dopo 10.
        </p>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Nota giro visita
          <textarea
            name="note_visita"
            rows={2}
            maxLength={400}
            defaultValue={profilo.note_visita ?? ''}
            className="mt-1 w-full resize-none rounded-md border border-black bg-zinc-50 px-2 py-1.5 text-sm font-normal normal-case"
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Nota telefonata
          <textarea
            name="note_telefonata"
            rows={2}
            maxLength={400}
            defaultValue={profilo.note_telefonata ?? ''}
            className="mt-1 w-full resize-none rounded-md border border-black bg-zinc-50 px-2 py-1.5 text-sm font-normal normal-case"
          />
        </label>
      </div>
    )
  }

  const etichettaElenco =
    mostraStatoAssociazione && !cercaAttiva
      ? `${tRuolo(locale, ruoloAttivo)} · ${soloAssociati ? copy.associati : copy.nonAssociati}`
      : tRuolo(locale, ruoloAttivo)

  return (
    <section id="gestione-utenti" className="space-y-10 border border-black rounded-2xl bg-white p-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-black pb-4">
        <Users className="text-[#060d41]" size={28} aria-hidden />
        <div>
          <h2 className="text-2xl font-medium text-zinc-900">{copy.gestioneUtentiPanel}</h2>
          <p className="text-sm text-zinc-600 mt-1">
            {agenziaRivenditoriMode
              ? copy.gestioneUtentiPanelHelpAgenzia
              : copy.gestioneUtentiPanelHelp}
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      {!agenziaRivenditoriMode && profiliPendentiOrdinati.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <UserCheck size={20} aria-hidden />
            {copy.registrazioniAttesa} ({profiliPendentiOrdinati.length})
          </h3>
          <ul className="space-y-4 list-none p-0 m-0">
            {profiliPendentiOrdinati.map((p) => (
              <li key={p.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm text-zinc-700 mb-3">
                  <strong>{p.nome_completo || copy.senzaNome}</strong> · {p.email} · {p.societa || '—'} · Tel.{' '}
                  {p.telefono || '—'} · {copy.campoRuolo}: {tRuolo(locale, p.ruolo)} · {copy.campoArea}: {p.area_geografica || '—'}
                </p>
                {canReviewPending ? (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() =>
                        void postUpdate({
                          profilo_id: p.id,
                          registrazione_approvata: true,
                        })
                      }
                      className="h-9 rounded-md bg-[#060d41] px-3 text-sm font-semibold text-white hover:bg-[#0a155a] disabled:opacity-50"
                    >
                      {copy.approva}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => void postDelete(p.id)}
                      className="h-9 rounded-md border border-red-600 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === p.id ? copy.eliminazione : copy.rifiuta}
                    </button>
                  </div>
                ) : null}
                {!readOnly && (
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget)
                      await salvaScheda(
                        p.id,
                        fd,
                        p.email,
                        p.ruolo,
                        profiloToGerarchiaRow(p, p.invitato_da ?? invitatoDaById.get(p.id) ?? null),
                      )
                    }}
                  >
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {ruoloHaSede(p.ruolo) ? 'Sede' : copy.campoNome}
                      <input
                        name={ruoloHaSede(p.ruolo) ? 'societa' : 'nome_completo'}
                        type="text"
                        defaultValue={ruoloHaSede(p.ruolo) ? nomeSedeProfilo(p) : (p.nome_completo ?? '')}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {ruoloConEmailDiLogin(p.ruolo) ? 'Email di login' : copy.campoEmail}
                      <input
                        name="email"
                        type="email"
                        defaultValue={ruoloConEmailDiLogin(p.ruolo) && isEmailTecnica(p.email) ? '' : (p.email ?? '')}
                        placeholder={ruoloConEmailDiLogin(p.ruolo) ? 'Vuota: resta l’account tecnico' : undefined}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    {ruoloConEmailDiLogin(p.ruolo) ? (
                      <label className="block text-xs font-medium uppercase text-zinc-600 md:col-span-2">
                        Password di accesso (opzionale)
                        <input
                          name="password_accesso"
                          type="text"
                          autoComplete="new-password"
                          placeholder="Con l’email di login entra subito. Non parte nessuna email."
                          className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                        />
                      </label>
                    ) : null}
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoTelefono}
                      <input
                        name="telefono"
                        type="tel"
                        defaultValue={p.telefono ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    {ruoloHaSede(p.ruolo) ? null : (
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoSocieta}
                      <input
                        name="societa"
                        type="text"
                        defaultValue={p.societa ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    )}
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoArea}
                      <input
                        name="area_geografica"
                        type="text"
                        placeholder={copy.placeholderArea}
                        defaultValue={p.area_geografica ?? ''}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium uppercase text-zinc-600">
                      {copy.campoRuolo}
                      <select
                        name="ruolo"
                        defaultValue={p.ruolo}
                        className="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      >
                        {RUOLI_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {tRuolo(locale, r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {campiAssociazione(p, 'mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm')}
                    <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-800">
                      <input type="checkbox" name="registrazione_approvata" value="on" defaultChecked={false} className="rounded border-black" />
                      {copy.approvaReg}
                    </label>
                    {p.ruolo === 'rivenditore' ? (
                      <RivenditoreProfiloCampi
                        profilo={{
                          espositore_1: p.espositore_1 ?? null,
                          espositore_2: p.espositore_2 ?? null,
                          box_show_room_1: p.box_show_room_1 ?? null,
                          box_show_room_2: p.box_show_room_2 ?? null,
                          box_show_room_3: p.box_show_room_3 ?? null,
                          box_show_room_4: p.box_show_room_4 ?? null,
                          espositore_1_qta: p.espositore_1_qta ?? null,
                          espositore_2_qta: p.espositore_2_qta ?? null,
                          box_show_room_1_qta: p.box_show_room_1_qta ?? null,
                          box_show_room_2_qta: p.box_show_room_2_qta ?? null,
                          box_show_room_3_qta: p.box_show_room_3_qta ?? null,
                          box_show_room_4_qta: p.box_show_room_4_qta ?? null,
                          espositore_1_data: p.espositore_1_data ?? null,
                          espositore_2_data: p.espositore_2_data ?? null,
                          box_show_room_1_data: p.box_show_room_1_data ?? null,
                          box_show_room_2_data: p.box_show_room_2_data ?? null,
                          box_show_room_3_data: p.box_show_room_3_data ?? null,
                          box_show_room_4_data: p.box_show_room_4_data ?? null,
                        }}
                        {...specializzazioneOpzioniFormProps}
                        inputClassName="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    ) : null}
                    {p.ruolo === 'agenzia' ? (
                      <AgenziaProfiloCampi
                        profilo={{
                          agenzia_campione_1: p.agenzia_campione_1 ?? null,
                          agenzia_campione_2: p.agenzia_campione_2 ?? null,
                          agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
                          agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
                          agenzia_catalogo_3: p.agenzia_catalogo_3 ?? null,
                          agenzia_catalogo_4: p.agenzia_catalogo_4 ?? null,
                          agenzia_campione_1_qta: p.agenzia_campione_1_qta ?? null,
                          agenzia_campione_2_qta: p.agenzia_campione_2_qta ?? null,
                          agenzia_catalogo_1_qta: p.agenzia_catalogo_1_qta ?? null,
                          agenzia_catalogo_2_qta: p.agenzia_catalogo_2_qta ?? null,
                          agenzia_catalogo_3_qta: p.agenzia_catalogo_3_qta ?? null,
                          agenzia_catalogo_4_qta: p.agenzia_catalogo_4_qta ?? null,
                          agenzia_campione_1_data: p.agenzia_campione_1_data ?? null,
                          agenzia_campione_2_data: p.agenzia_campione_2_data ?? null,
                          agenzia_catalogo_1_data: p.agenzia_catalogo_1_data ?? null,
                          agenzia_catalogo_2_data: p.agenzia_catalogo_2_data ?? null,
                          agenzia_catalogo_3_data: p.agenzia_catalogo_3_data ?? null,
                          agenzia_catalogo_4_data: p.agenzia_catalogo_4_data ?? null,
                        }}
                        {...specializzazioneOpzioniFormProps}
                        inputClassName="mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm"
                      />
                    ) : null}
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={deletingId === p.id || savingId !== null || isRefreshing}
                        className="h-10 rounded-lg bg-[#060d41] text-white px-4 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                      >
                        {savingId === p.id || isRefreshing ? copy.salvataggio : copy.salvaConferma}
                      </button>
                      {p.ruolo !== 'admin' && p.id !== currentUserId ? (
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => void postDelete(p.id)}
                          className="h-10 rounded-lg border border-red-600 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === p.id ? copy.eliminazione : copy.eliminaUtente}
                        </button>
                      ) : null}
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : !agenziaRivenditoriMode ? (
        <p className="text-sm text-zinc-500">{copy.nessunaAttesa}</p>
      ) : null}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900">
          {agenziaRivenditoriMode ? copy.rivenditoriAssociati : copy.utentiAssociati}
        </h3>
        <p className="text-sm text-zinc-600">
          {agenziaRivenditoriMode
            ? copy.listaRivenditoriHelp
            : copy.listaUtentiHelp}
        </p>

        {!agenziaRivenditoriMode ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.filtraPerRuolo}>
          {ruoliTab.map((tab) => {
            const count = profiliPerRuolo.get(tab.id)?.length ?? 0
            const active = ruoloAttivo === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRuoloAttivo(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-[#060d41] bg-[#060d41] text-white'
                    : 'border-black bg-white text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {tRuolo(locale, tab.id)}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        ) : (
          <p className="text-sm font-medium text-zinc-700">
            {tRivenditoriCount(locale, profiliRuoloAttivo.length)}
          </p>
        )}

        {mostraStatoAssociazione && !cercaAttiva ? (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.filtraPerRuolo}>
            {(
              [
                { id: 'associati', label: copy.associati, count: profiliAssociati.length, active: soloAssociati },
                { id: 'non', label: copy.nonAssociati, count: profiliNonAssociati.length, active: !soloAssociati },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={tab.active}
                onClick={() => setSoloAssociati(tab.id === 'associati')}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  tab.active
                    ? 'border-[#060d41] bg-[#060d41] text-white'
                    : 'border-black/30 bg-white text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    tab.active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={listaAperta}
          aria-controls="elenco-utenti-ruolo"
          onClick={() => setListaAperta((aperta) => !aperta)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-black bg-white px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-800">
            {listaAperta ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
            <span className="truncate">{etichettaElenco}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-zinc-600">
            {listaAperta ? copy.chiudiElenco : copy.apriElenco}
          </span>
        </button>

        {listaAperta ? (
        <ul id="elenco-utenti-ruolo" className="space-y-3 list-none p-0 m-0" role="tabpanel" aria-label={`Utenti ${ruoloAttivo}`}>
          {profiliVisibili.length === 0 ? (
            <li className="rounded-xl border border-dashed border-black/30 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
              {agenziaRivenditoriMode
                ? copy.nessunRivenditoreAgenzia
                : mostraStatoAssociazione
                  ? soloAssociati
                    ? copy.nessunAssociato
                    : copy.nessunNonAssociato
                  : copy.nessunUtenteRuoloFiltro}
            </li>
          ) : null}
          {profiliVisibili.map((p) => {
            const profiloGerarchia = profiloToGerarchiaRow(
              p,
              p.invitato_da ?? invitatoDaById.get(p.id) ?? null,
            )
            const profiloReadOnly = readOnly || p.id === currentUserId || p.ruolo === 'admin'
            const agenziaAssociata = isAgenteLike(p.ruolo)
              ? resolveAgenziaParentForAgent(profiloGerarchia, profiliGerarchia, links)
              : null
            const inviterRow = profiliGerarchia.find((row) => row.id === profiloGerarchia.invitato_da)
            const agenteRiferimento = inviterRow && isAgenteLike(inviterRow.ruolo) ? inviterRow : null
            const venditoreRiferimento =
              inviterRow && p.ruolo === 'distributore' && inviterRow.ruolo === 'distributore'
                ? inviterRow
                : null
            const riferimentoInvito = agenteRiferimento ?? venditoreRiferimento
            const managerEditSpecializzazione =
              profiloReadOnly &&
              canEditSpecializzazione &&
              (p.ruolo === 'agenzia' || p.ruolo === 'rivenditore')
            const agenziaEditRivenditore =
              canEditRivenditoreAsAgenzia &&
              p.ruolo === 'rivenditore' &&
              isRivenditoreManagedByAgenzia(
                currentUserId,
                profiloGerarchia,
                profiliGerarchia,
                links,
              )
            const agenteEditRivenditore =
              canEditRivenditoreAsAgente &&
              p.ruolo === 'rivenditore' &&
              isRivenditoreManagedByAgente(
                currentUserId,
                profiloGerarchia,
                profiliGerarchia,
                links,
              )
            const rivenditoreEditEsterno = agenziaEditRivenditore || agenteEditRivenditore
            const editSpecializzazione = managerEditSpecializzazione || rivenditoreEditEsterno
            return (
              <li key={p.id} className="rounded-xl border border-black bg-zinc-50/80">
                <details
                  className="group"
                  open={apriProfiliDiDefault || undefined}
                  // Safari su iPhone/iPad non apre un select dentro details senza un listener touch.
                  onTouchStart={() => {}}
                  onToggle={(event) => {
                    const open = event.currentTarget.open
                    setSchedeAperte((prev) => {
                      if (prev.has(p.id) === open) return prev
                      const next = new Set(prev)
                      if (open) next.add(p.id)
                      else next.delete(p.id)
                      return next
                    })
                  }}
                >
                  <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-black">
                      {ruoloHaSede(p.ruolo) ? (
                        nomeSedeProfilo(p) || p.email || p.id
                      ) : p.societa ? (
                        <>
                          {p.societa}
                          <span className="ml-2 text-xs font-normal text-gray-700">{p.nome_completo || ''}</span>
                        </>
                      ) : (
                        p.nome_completo || p.email || p.id
                      )}
                      <span className="ml-2 text-xs font-normal text-gray-700">
                        {tRuolo(locale, p.ruolo)}
                        {riferimentoInvito
                          ? ` · ${dashCopy.associatoA} ${profiloGerarchiaDisplayLabel(riferimentoInvito)} (${tRuolo(locale, riferimentoInvito.ruolo)})`
                          : agenziaAssociata
                            ? ` · ${dashCopy.associatoA} ${profiloGerarchiaDisplayLabel(agenziaAssociata)}`
                            : ''}
                        {p.registrazione_approvata === false ? ` · ${copy.inAttesa}` : ''}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">{p.area_geografica || copy.areaNonDefinita}</span>
                  </summary>
                  <div className="border-t border-black/10 px-4 py-4 flex flex-col gap-4 bg-white">
                    {editSpecializzazione ? (
                      <>
                        <p className="text-sm text-zinc-600">
                          {rivenditoreEditEsterno
                            ? copy.editRivenditoreHelp
                            : copy.editAgenziaHelp}
                        </p>
                        <form
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            await postUpdate(readFormSpecializzazione(fd, p.id, p.ruolo))
                          }}
                        >
                          {p.ruolo === 'rivenditore' ? (
                            <RivenditoreProfiloCampi
                              profilo={{
                                espositore_1: p.espositore_1 ?? null,
                                espositore_2: p.espositore_2 ?? null,
                                box_show_room_1: p.box_show_room_1 ?? null,
                                box_show_room_2: p.box_show_room_2 ?? null,
                                box_show_room_3: p.box_show_room_3 ?? null,
                                box_show_room_4: p.box_show_room_4 ?? null,
                                espositore_1_qta: p.espositore_1_qta ?? null,
                                espositore_2_qta: p.espositore_2_qta ?? null,
                                box_show_room_1_qta: p.box_show_room_1_qta ?? null,
                                box_show_room_2_qta: p.box_show_room_2_qta ?? null,
                                box_show_room_3_qta: p.box_show_room_3_qta ?? null,
                                box_show_room_4_qta: p.box_show_room_4_qta ?? null,
                                espositore_1_data: p.espositore_1_data ?? null,
                                espositore_2_data: p.espositore_2_data ?? null,
                                box_show_room_1_data: p.box_show_room_1_data ?? null,
                                box_show_room_2_data: p.box_show_room_2_data ?? null,
                                box_show_room_3_data: p.box_show_room_3_data ?? null,
                                box_show_room_4_data: p.box_show_room_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                          ) : null}
                          {!rivenditoreEditEsterno && p.ruolo === 'agenzia' ? (
                            <AgenziaProfiloCampi
                              profilo={{
                                agenzia_campione_1: p.agenzia_campione_1 ?? null,
                                agenzia_campione_2: p.agenzia_campione_2 ?? null,
                                agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
                                agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
                                agenzia_catalogo_3: p.agenzia_catalogo_3 ?? null,
                                agenzia_catalogo_4: p.agenzia_catalogo_4 ?? null,
                                agenzia_campione_1_qta: p.agenzia_campione_1_qta ?? null,
                                agenzia_campione_2_qta: p.agenzia_campione_2_qta ?? null,
                                agenzia_catalogo_1_qta: p.agenzia_catalogo_1_qta ?? null,
                                agenzia_catalogo_2_qta: p.agenzia_catalogo_2_qta ?? null,
                                agenzia_catalogo_3_qta: p.agenzia_catalogo_3_qta ?? null,
                                agenzia_catalogo_4_qta: p.agenzia_catalogo_4_qta ?? null,
                                agenzia_campione_1_data: p.agenzia_campione_1_data ?? null,
                                agenzia_campione_2_data: p.agenzia_campione_2_data ?? null,
                                agenzia_catalogo_1_data: p.agenzia_catalogo_1_data ?? null,
                                agenzia_catalogo_2_data: p.agenzia_catalogo_2_data ?? null,
                                agenzia_catalogo_3_data: p.agenzia_catalogo_3_data ?? null,
                                agenzia_catalogo_4_data: p.agenzia_catalogo_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                          ) : null}
                          <div className="md:col-span-2">
                            <button
                              type="submit"
                              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                            >
                              {rivenditoreEditEsterno ? copy.salvaEspositori : copy.salvaSpecializzazione}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : profiloReadOnly ? (
                      <>
                        <p className="text-sm text-zinc-600">
                        {agenziaRivenditoriMode
                          ? copy.profiloSolaLettura
                          : readOnly
                            ? copy.visualizzazioneManager
                            : copy.profiloAdminAccount}
                        </p>
                      </>
                    ) : (
                      <>
                        <form
                          className="contents"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            await salvaScheda(p.id, fd, p.email, p.ruolo, profiloGerarchia)
                          }}
                        >
                          <div className="order-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {ruoloHaSede(p.ruolo) ? 'Sede' : copy.campoNome}
                            <input
                              name={ruoloHaSede(p.ruolo) ? 'societa' : 'nome_completo'}
                              type="text"
                              defaultValue={ruoloHaSede(p.ruolo) ? nomeSedeProfilo(p) : (p.nome_completo ?? '')}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {ruoloConEmailDiLogin(p.ruolo) ? 'Email di login' : copy.campoEmail}
                            <input
                              name="email"
                              type="email"
                              defaultValue={ruoloConEmailDiLogin(p.ruolo) && isEmailTecnica(p.email) ? '' : (p.email ?? '')}
                              placeholder={ruoloConEmailDiLogin(p.ruolo) ? 'Vuota: resta l’account tecnico' : undefined}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          {ruoloConEmailDiLogin(p.ruolo) ? (
                            <label className="block text-xs font-medium uppercase text-zinc-600 md:col-span-2">
                              Password di accesso (opzionale)
                              <input
                                name="password_accesso"
                                type="text"
                                autoComplete="new-password"
                                placeholder="Con l’email di login entra subito. Non parte nessuna email."
                                className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                              />
                            </label>
                          ) : null}
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoTelefono}
                            <input
                              name="telefono"
                              type="tel"
                              defaultValue={p.telefono ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          {ruoloHaSede(p.ruolo) ? null : (
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoSocieta}
                            <input
                              name="societa"
                              type="text"
                              defaultValue={p.societa ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          )}
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoArea}
                            <input
                              name="area_geografica"
                              type="text"
                              defaultValue={p.area_geografica ?? ''}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            />
                          </label>
                          <label className="block text-xs font-medium uppercase text-zinc-600">
                            {copy.campoRuolo}
                            <select
                              name="ruolo"
                              defaultValue={p.ruolo}
                              className="mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm"
                            >
                              {RUOLI_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {tRuolo(locale, r)}
                                </option>
                              ))}
                            </select>
                          </label>
                          {campiAssociazione(p, 'mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm')}
                          {campiGiroTelefonata(p, 'mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm')}
                          </div>
                          <div className="order-2 space-y-3">
                          <label className="flex items-center gap-2 text-sm text-zinc-800">
                            <input
                              type="checkbox"
                              name="registrazione_approvata"
                              value="on"
                              defaultChecked={p.registrazione_approvata !== false}
                              className="rounded border-black"
                            />
                            {copy.registrazioneApprovata}
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="submit"
                              disabled={deletingId === p.id || savingId !== null || isRefreshing}
                              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
                            >
                              {savingId === p.id || isRefreshing ? copy.salvataggio : copy.salvaProfilo}
                            </button>
                            {canDeleteUtenti && p.ruolo !== 'admin' && p.id !== currentUserId ? (
                              <button
                                type="button"
                                disabled={deletingId === p.id}
                                onClick={() => void postDelete(p.id)}
                                className="h-9 rounded-md border border-red-600 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === p.id ? copy.eliminazione : copy.eliminaUtente}
                              </button>
                            ) : null}
                            {canCreateAssociati && p.email && !(ruoloConEmailDiLogin(p.ruolo) && isEmailTecnica(p.email)) ? (
                              <LinkPasswordUtente email={p.email} />
                            ) : null}
                          </div>
                          </div>
                          {p.ruolo === 'rivenditore' ? (
                            <div className="order-5">
                            <RivenditoreProfiloCampi
                              profilo={{
                                espositore_1: p.espositore_1 ?? null,
                                espositore_2: p.espositore_2 ?? null,
                                box_show_room_1: p.box_show_room_1 ?? null,
                                box_show_room_2: p.box_show_room_2 ?? null,
                                box_show_room_3: p.box_show_room_3 ?? null,
                                box_show_room_4: p.box_show_room_4 ?? null,
                                espositore_1_qta: p.espositore_1_qta ?? null,
                                espositore_2_qta: p.espositore_2_qta ?? null,
                                box_show_room_1_qta: p.box_show_room_1_qta ?? null,
                                box_show_room_2_qta: p.box_show_room_2_qta ?? null,
                                box_show_room_3_qta: p.box_show_room_3_qta ?? null,
                                box_show_room_4_qta: p.box_show_room_4_qta ?? null,
                                espositore_1_data: p.espositore_1_data ?? null,
                                espositore_2_data: p.espositore_2_data ?? null,
                                box_show_room_1_data: p.box_show_room_1_data ?? null,
                                box_show_room_2_data: p.box_show_room_2_data ?? null,
                                box_show_room_3_data: p.box_show_room_3_data ?? null,
                                box_show_room_4_data: p.box_show_room_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                            </div>
                          ) : null}
                          {p.ruolo === 'agenzia' ? (
                            <div className="order-5">
                            <AgenziaProfiloCampi
                              profilo={{
                                agenzia_campione_1: p.agenzia_campione_1 ?? null,
                                agenzia_campione_2: p.agenzia_campione_2 ?? null,
                                agenzia_catalogo_1: p.agenzia_catalogo_1 ?? null,
                                agenzia_catalogo_2: p.agenzia_catalogo_2 ?? null,
                                agenzia_catalogo_3: p.agenzia_catalogo_3 ?? null,
                                agenzia_catalogo_4: p.agenzia_catalogo_4 ?? null,
                                agenzia_campione_1_qta: p.agenzia_campione_1_qta ?? null,
                                agenzia_campione_2_qta: p.agenzia_campione_2_qta ?? null,
                                agenzia_catalogo_1_qta: p.agenzia_catalogo_1_qta ?? null,
                                agenzia_catalogo_2_qta: p.agenzia_catalogo_2_qta ?? null,
                                agenzia_catalogo_3_qta: p.agenzia_catalogo_3_qta ?? null,
                                agenzia_catalogo_4_qta: p.agenzia_catalogo_4_qta ?? null,
                                agenzia_campione_1_data: p.agenzia_campione_1_data ?? null,
                                agenzia_campione_2_data: p.agenzia_campione_2_data ?? null,
                                agenzia_catalogo_1_data: p.agenzia_catalogo_1_data ?? null,
                                agenzia_catalogo_2_data: p.agenzia_catalogo_2_data ?? null,
                                agenzia_catalogo_3_data: p.agenzia_catalogo_3_data ?? null,
                                agenzia_catalogo_4_data: p.agenzia_catalogo_4_data ?? null,
                              }}
                              {...specializzazioneOpzioniFormProps}
                            />
                            </div>
                          ) : null}
                        </form>
                      </>
                    )}

                    {canCreateAssociati && p.ruolo === 'manager' ? (
                      <div className="order-4">
                      <CreaAssociatoManuale
                        parentId={p.id}
                        parentLabel={p.societa || p.nome_completo || p.email || 'questo manager'}
                        ruoloNuovo="agenzia"
                      />
                      </div>
                    ) : null}
                    {canCreateAssociati && p.ruolo === 'agenzia' ? (
                      <div className="order-4">
                      <CreaAssociatoManuale
                        parentId={p.id}
                        parentLabel={p.societa || p.nome_completo || p.email || 'questa agenzia'}
                        ruoliSelezionabili={[
                          { value: 'agente', label: 'Agente' },
                          { value: 'back_office', label: 'Back-Office' },
                          { value: 'rivenditore', label: 'Rivenditore' },
                          { value: 'distributore', label: 'Venditore' },
                        ]}
                        parentByRuolo={{
                          distributore: {
                            options: profiliGerarchia
                              .filter((row) =>
                                isRivenditoreManagedByAgenzia(p.id, row, profiliGerarchia, links),
                              )
                              .map((row) => ({
                                id: row.id,
                                label: profiloGerarchiaDisplayLabel(row),
                              })),
                            selectLabel: 'Collega a rivenditore',
                          },
                        }}
                      />
                      </div>
                    ) : null}
                    {canCreateAssociati && p.ruolo === 'rivenditore' ? (
                      <div className="order-4">
                      <CreaAssociatoManuale
                        parentId={p.id}
                        parentLabel={p.societa || p.nome_completo || p.email || 'questo rivenditore'}
                        ruoloNuovo="distributore"
                      />
                      </div>
                    ) : null}
                    {canCreateAssociati && p.ruolo === 'studio' ? (
                      <div className="order-4">
                      <CreaAssociatoManuale
                        parentId={p.id}
                        parentLabel={p.societa || p.nome_completo || p.email || 'questa sede studio'}
                        ruoloNuovo="studio_associato"
                      />
                      </div>
                    ) : null}

                    {canManageCataloghi && puoPersonalizzareCataloghi(p.ruolo) && (apriProfiliDiDefault || schedeAperte.has(p.id)) ? (
                      <div className="order-6">
                        <p className="text-xs font-medium uppercase text-zinc-600 mb-1">
                          Dashboard utente
                        </p>
                        <p className="text-xs text-zinc-500 mb-2">
                          Le sezioni spuntate sono visibili nella dashboard di questo utente. Togli la spunta per nasconderne una; quando tutte sono spuntate, vede tutto il previsto per il suo ruolo.
                        </p>
                        <div className="border border-black/15 rounded-lg p-3 bg-zinc-50">
                          <CatalogoPermessiPanel
                            utenteId={p.id}
                            utenteRuolo={p.ruolo}
                            allCataloghi={allCataloghi}
                            permessiIniziali={permessiPerUtente[p.id]}
                            permessiPronti={permessiPronti}
                            readOnly={false}
                            salvaConProfilo
                            onRegistraSalva={(salva) => {
                              if (salva) salvaPermessiById.current.set(p.id, salva)
                              else salvaPermessiById.current.delete(p.id)
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
        ) : null}
      </div>
    </section>
  )
}
