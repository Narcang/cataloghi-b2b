import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'

function json(ok: boolean, message: string, status: number, extra?: object) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

const ALLOWED_ROLES = new Set(['admin', 'manager', 'agenzia', 'agente', 'distributore'])

async function getRequester() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  return { userId: user.id, ruolo: profilo?.ruolo ?? 'free' }
}

async function canManageUser(requesterId: string, requesterRole: string, targetId: string): Promise<boolean> {
  if (requesterRole === 'admin' || requesterRole === 'manager') return true
  // agenzia/agente/distributore: può gestire solo utenti collegati
  const svc = createServiceRoleSupabase()
  if (!svc) return false
  const { count } = await svc
    .from('connessioni_utente_operatore')
    .select('*', { count: 'exact', head: true })
    .or(
      `and(utente_id.eq.${requesterId},operatore_id.eq.${targetId}),` +
      `and(utente_id.eq.${targetId},operatore_id.eq.${requesterId})`
    )
  return (count ?? 0) > 0
}

/** GET /api/admin/catalogo-permessi?utente_id=xxx
 *  Restituisce la lista di catalogo_id nella whitelist dell'utente.
 *  Array vuoto = nessuna restrizione (vede tutto il ruolo). */
export async function GET(request: NextRequest) {
  const req = await getRequester()
  if (!req) return json(false, 'Non autenticato', 401)
  if (!ALLOWED_ROLES.has(req.ruolo)) return json(false, 'Non autorizzato', 403)

  const utenteId = request.nextUrl.searchParams.get('utente_id') ?? ''
  if (!utenteId) return json(false, 'utente_id mancante', 400)

  const canManage = await canManageUser(req.userId, req.ruolo, utenteId)
  if (!canManage) return json(false, 'Non autorizzato per questo utente', 403)

  const svc = createServiceRoleSupabase()
  if (!svc) return json(false, 'Configurazione server mancante', 500)

  const { data, error } = await svc
    .from('catalogo_permessi_utente')
    .select('catalogo_id')
    .eq('utente_id', utenteId)

  if (error) return json(false, error.message, 500)

  return json(true, 'OK', 200, { catalogo_ids: (data ?? []).map(r => r.catalogo_id) })
}

/** POST /api/admin/catalogo-permessi
 *  Body: { utente_id, catalogo_ids: string[] }
 *  Sostituisce l'intera whitelist dell'utente.
 *  catalogo_ids vuoto = rimuovi tutte le restrizioni. */
export async function POST(request: NextRequest) {
  const req = await getRequester()
  if (!req) return json(false, 'Non autenticato', 401)
  if (!ALLOWED_ROLES.has(req.ruolo)) return json(false, 'Non autorizzato', 403)

  let body: { utente_id?: string; catalogo_ids?: string[] }
  try { body = await request.json() } catch { return json(false, 'JSON non valido', 400) }

  const utenteId = String(body.utente_id ?? '').trim()
  const catalogoIds = Array.isArray(body.catalogo_ids) ? body.catalogo_ids.map(String) : []

  if (!utenteId) return json(false, 'utente_id mancante', 400)

  const canManage = await canManageUser(req.userId, req.ruolo, utenteId)
  if (!canManage) return json(false, 'Non autorizzato per questo utente', 403)

  const svc = createServiceRoleSupabase()
  if (!svc) return json(false, 'Configurazione server mancante', 500)

  // Sostituisci l'intera whitelist
  await svc.from('catalogo_permessi_utente').delete().eq('utente_id', utenteId)

  if (catalogoIds.length > 0) {
    const rows = catalogoIds.map(cid => ({ utente_id: utenteId, catalogo_id: cid, creato_da: req.userId }))
    const { error } = await svc.from('catalogo_permessi_utente').insert(rows)
    if (error) return json(false, `Errore salvataggio: ${error.message}`, 500)
  }

  return json(true, 'Permessi aggiornati', 200, { catalogo_ids: catalogoIds })
}
