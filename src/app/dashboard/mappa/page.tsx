import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { getAdminDataSupabase } from '@/lib/mercatoServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import MappaAziende, { type PuntoMappa, type ZonaMappa } from '@/components/admin/MappaAziende'
import { getAppLocale } from '@/lib/localeServer'
import { tRuolo } from '@/lib/i18nAdmin'
import { areeInteresseValide, cittaCoperteGeoValide, hexColoreArea, nazioniValide } from '@/lib/areaInteresse'
import { coperturaVisibile } from '@/lib/coperturaMappa'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mappa · Ladiva Ceramica',
}

const RUOLI_MAPPA = ['agenzia', 'rivenditore', 'studio'] as const

type Riga = {
  id: string
  nome_completo: string | null
  societa: string | null
  ruolo: string
  citta: string | null
  indirizzo: string | null
  cap: string | null
  latitudine: number | null
  longitudine: number | null
  aree_interesse: string[] | null
  nazioni_interesse: string[] | null
  citta_coperte_geo: unknown
  colore_area: string | null
  registrazione_approvata: boolean | null
}

function nomeSede(row: Riga): string {
  return (row.societa || row.nome_completo || 'Sede').trim()
}

export default async function MappaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  const ruolo = profilo?.ruolo ?? 'free'
  if (ruolo !== 'admin' && ruolo !== 'manager') redirect('/dashboard')

  const adminDataClient = ruolo === 'admin' ? (await getAdminDataSupabase()).client : null
  const db = createServiceRoleSupabase() ?? adminDataClient ?? supabase
  const locale = await getAppLocale()

  const { data, error } = await db
    .from('profili')
    .select('id, nome_completo, societa, ruolo, citta, indirizzo, cap, latitudine, longitudine, aree_interesse, nazioni_interesse, citta_coperte_geo, colore_area, registrazione_approvata')
    .in('ruolo', [...RUOLI_MAPPA])
    .or('registrazione_approvata.eq.true,registrazione_approvata.is.null')
    .limit(2000)

  const righe = (error ? [] : (data ?? [])) as Riga[]
  const punti: PuntoMappa[] = []
  const zone: ZonaMappa[] = []
  const senzaCoordinate: { id: string; nome: string; dove: string }[] = []
  let senzaIndirizzo = 0

  for (const row of righe) {
    const citta = row.citta?.trim() ?? ''
    const indirizzo = row.indirizzo?.trim() ?? ''
    const cap = row.cap?.trim() ?? ''
    const aree = areeInteresseValide(row.aree_interesse)
    const cittaGeo = cittaCoperteGeoValide(row.citta_coperte_geo)
    const nazioniIntere = nazioniValide(row.nazioni_interesse)
    const copertura = coperturaVisibile(aree, nazioniIntere, cittaGeo)
    const regioni = copertura.regioni
    const area = copertura.etichetta
    if (cittaGeo.length > 0 || regioni.length > 0) {
      zone.push({
        id: row.id,
        nome: nomeSede(row),
        ruoloLabel: tRuolo(locale, row.ruolo),
        colore: hexColoreArea(row.colore_area, row.ruolo),
        regioni,
        citta: cittaGeo,
      })
    }
    if (!citta && !indirizzo && !cap) {
      senzaIndirizzo += 1
      continue
    }
    if (typeof row.latitudine === 'number' && typeof row.longitudine === 'number') {
      punti.push({
        id: row.id,
        nome: nomeSede(row),
        ruolo: row.ruolo,
        ruoloLabel: tRuolo(locale, row.ruolo),
        citta,
        indirizzo,
        cap,
        area,
        lat: row.latitudine,
        lng: row.longitudine,
      })
    } else {
      senzaCoordinate.push({
        id: row.id,
        nome: nomeSede(row),
        dove: [indirizzo, cap, citta].filter(Boolean).join(', '),
      })
    }
  }

  punti.sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }))

  return (
    <div className="ladiva-root ladiva-root-app-dark min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight mt-3">Mappa</h1>
          <p className="text-sm text-zinc-600 mt-2 max-w-2xl">
            Agenzie, rivenditori e sedi studio. Il puntino è l’indirizzo. Ogni nazione resta intera o sulle sue regioni; le città sostituiscono solo la nazione in cui cadono.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">
            Mappa non disponibile. Esegui su Supabase il file supabase_alter_profili_copertura.sql e ricarica.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-700">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" /> Agenzia
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" /> Rivenditori
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" /> Sede studio
              </span>
              <span className="text-zinc-500">{punti.length} in mappa</span>
            </div>
            <MappaAziende punti={punti} zone={zone} />
            {senzaIndirizzo > 0 || senzaCoordinate.length > 0 ? (
              <div className="rounded-xl border border-white/15 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300 space-y-2">
                {senzaIndirizzo > 0 ? (
                  <p>
                    {senzaIndirizzo} sedi senza via, CAP o città: non compaiono finché non li inserisci in gestione utenti.
                  </p>
                ) : null}
                {senzaCoordinate.length > 0 ? (
                  <div>
                    <p>Indirizzo non trovato, quindi senza puntino:</p>
                    <ul className="mt-1 list-disc pl-5">
                      {senzaCoordinate.map((sede) => (
                        <li key={sede.id}>
                          {sede.nome} — {sede.dove}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
