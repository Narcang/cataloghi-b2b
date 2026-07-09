import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import {
  fetchCataloghiAttivi,
  fetchPermessiUtente,
  savePermessiUtente,
} from '@/lib/catalogPermessiDb'
import { idsCataloghiInCategorie, buildGruppiCategorieConfigurabili } from '@/lib/catalogPermessiUtente'

function json(ok: boolean, message: string, status: number, extra?: object) {
  return NextResponse.json({ ok, message, ...extra }, { status })
}

const ALLOWED_ROLES = new Set(['admin', 'manager', 'agenzia', 'agente', 'rivenditore', 'distributore'])

async function getRequester() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profilo } = await supabase.from('profili').select('ruolo').eq('id', user.id).single()
  return { userId: user.id, ruolo: profilo?.ruolo ?? 'free' }
}

async function canManageUser(requesterId: string, requesterRole: string, targetId: string): Promise<boolean> {
  if (requesterRole === 'admin' || requesterRole === 'manager') return true
  const svc = createServiceRoleSupabase()
  const db = svc ?? (await createClient())
  const { count } = await db
    .from('connessioni_utente_operatore')
    .select('*', { count: 'exact', head: true })
    .or(
      `and(utente_id.eq.${requesterId},operatore_id.eq.${targetId}),` +
      `and(utente_id.eq.${targetId},operatore_id.eq.${requesterId})`,
    )
  return (count ?? 0) > 0
}

async function getTargetRuolo(utenteId: string): Promise<string | null> {
  const db = await createClient()
  const { data } = await db.from('profili').select('ruolo').eq('id', utenteId).single()
  return data?.ruolo ?? null
}

async function resolveCatalogoIds(
  utenteId: string,
  catalogoIds: string[],
  categorie: string[],
): Promise<{ ids: string[]; error: string | null }> {
  if (catalogoIds.length > 0) return { ids: catalogoIds, error: null }
  if (categorie.length === 0) return { ids: [], error: null }

  const ruoloTarget = await getTargetRuolo(utenteId)
  if (!ruoloTarget) return { ids: [], error: 'Utente non trovato' }

  const { cataloghi, error } = await fetchCataloghiAttivi()
  if (error) return { ids: [], error }

  const gruppi = buildGruppiCategorieConfigurabili(cataloghi, ruoloTarget)
  const ids = idsCataloghiInCategorie(gruppi, new Set(categorie))
  return { ids, error: null }
}

/** GET /api/admin/catalogo-permessi?utente_id=xxx */
export async function GET(request: NextRequest) {
  const req = await getRequester()
  if (!req) return json(false, 'Non autenticato', 401)
  if (!ALLOWED_ROLES.has(req.ruolo)) return json(false, 'Non autorizzato', 403)

  const utenteId = request.nextUrl.searchParams.get('utente_id') ?? ''
  if (!utenteId) return json(false, 'utente_id mancante', 400)

  const canManage = await canManageUser(req.userId, req.ruolo, utenteId)
  if (!canManage) return json(false, 'Non autorizzato per questo utente', 403)

  const { catalogo_ids, error } = await fetchPermessiUtente(utenteId)
  if (error) return json(false, error, 500)

  return json(true, 'OK', 200, { catalogo_ids })
}

/** POST — body: { utente_id, catalogo_ids?, categorie? } */
export async function POST(request: NextRequest) {
  const req = await getRequester()
  if (!req) return json(false, 'Non autenticato', 401)
  if (!ALLOWED_ROLES.has(req.ruolo)) return json(false, 'Non autorizzato', 403)

  let body: { utente_id?: string; catalogo_ids?: string[]; categorie?: string[] }
  try {
    body = await request.json()
  } catch {
    return json(false, 'JSON non valido', 400)
  }

  const utenteId = String(body.utente_id ?? '').trim()
  const catalogoIdsRaw = Array.isArray(body.catalogo_ids) ? body.catalogo_ids.map(String) : []
  const categorieRaw = Array.isArray(body.categorie) ? body.categorie.map(String) : []

  if (!utenteId) return json(false, 'utente_id mancante', 400)

  const canManage = await canManageUser(req.userId, req.ruolo, utenteId)
  if (!canManage) return json(false, 'Non autorizzato per questo utente', 403)

  const { ids: catalogoIds, error: resolveError } = await resolveCatalogoIds(
    utenteId,
    catalogoIdsRaw,
    categorieRaw,
  )
  if (resolveError) return json(false, resolveError, 500)

  const { error } = await savePermessiUtente(utenteId, catalogoIds, req.userId)
  if (error) return json(false, `Errore salvataggio: ${error}`, 500)

  return json(true, 'Permessi aggiornati', 200, { catalogo_ids: catalogoIds })
}
