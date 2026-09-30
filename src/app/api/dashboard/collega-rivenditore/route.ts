import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { filterProfiliInHierarchySubtree, profiloToGerarchiaRow } from '@/lib/userHierarchy'

const CLIENTI_RUOLI = new Set([
  'back_office',
  'rivenditore',
  'distributore',
  'partner_dipendente',
  'studio',
  'studio_associato',
])

function json(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status })
}

/** Il back-office collega un cliente della propria agenzia a un agente, oppure lo riporta sull'agenzia. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return json(false, 'Sessione scaduta', 401)

  const { data: caller } = await supabase
    .from('profili')
    .select('ruolo, invitato_da')
    .eq('id', user.id)
    .maybeSingle()
  if (caller?.ruolo !== 'back_office') return json(false, 'Operazione non consentita', 403)

  let body: { profilo_id?: string; agente_id?: string | null }
  try {
    body = (await request.json()) as { profilo_id?: string; agente_id?: string | null }
  } catch {
    return json(false, 'JSON non valido', 400)
  }

  const profiloId = String(body.profilo_id ?? '').trim()
  const agenteId = String(body.agente_id ?? '').trim()
  if (!profiloId) return json(false, 'Profilo mancante', 400)
  if (profiloId === user.id) return json(false, 'Profilo non valido', 400)

  const svc = createServiceRoleSupabase()
  if (!svc) return json(false, 'Configurazione server incompleta', 500)

  const agenziaId = caller.invitato_da
  if (!agenziaId) return json(false, 'Agenzia non trovata', 400)
  const { data: agenzia } = await svc.from('profili').select('id, ruolo').eq('id', agenziaId).maybeSingle()
  if (agenzia?.ruolo !== 'agenzia') return json(false, 'Agenzia non trovata', 400)

  const [{ data: profili }, { data: links }] = await Promise.all([
    svc
      .from('profili')
      .select('id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata, seguito_da')
      .neq('ruolo', 'free')
      .limit(2000),
    svc.from('connessioni_utente_operatore').select('utente_id, operatore_id').limit(2000),
  ])
  const rows = (profili ?? []).map((p) => ({
    ...profiloToGerarchiaRow(p, p.invitato_da),
    seguito_da: p.seguito_da,
  }))
  const agenziaRow = rows.find((p) => p.id === agenziaId && p.ruolo === 'agenzia')
  if (!agenziaRow) return json(false, 'Agenzia non trovata', 400)
  const subtree = filterProfiliInHierarchySubtree(agenziaRow, rows, links ?? [])
  const target = subtree.find((p) => p.id === profiloId)
  if (!target || !CLIENTI_RUOLI.has(target.ruolo)) return json(false, 'Profilo non valido', 400)

  const agentiAgenzia = new Set(subtree.filter((p) => p.ruolo === 'agente').map((p) => p.id))

  const nuovoParent = agenteId || agenziaId
  if (agenteId && !agentiAgenzia.has(agenteId)) {
    return json(false, 'Agente non trovato nella tua agenzia', 400)
  }

  const { error } = await svc.from('profili').update({ invitato_da: nuovoParent }).eq('id', profiloId)
  if (error) return json(false, error.message, 500)
  return json(true, 'Collegamento aggiornato', 200)
}
