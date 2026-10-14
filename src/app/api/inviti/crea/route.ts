import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import {
  INVITO_CATEGORIA_PARENT,
  OPERATORI_INVITO_PER_SEDE,
  operatoreAppartieneASede,
  puoInvitare,
} from '@/lib/inviteHierarchy'
import {
  filterProfiliInHierarchySubtree,
  profiloToGerarchiaRow,
  resolveAgenziaParentForAgent,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

function jsonResponse(ok: boolean, message: string, status: number, data?: Record<string, unknown>) {
  return NextResponse.json({ ok, message, ...data }, { status })
}

function pulisci(value: unknown): string {
  return String(value ?? '').trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse(false, 'Sessione scaduta o non autenticato', 401)
  }

  const { data: profilo } = await supabase
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const ruoloInvitante = profilo?.ruolo ?? ''
  if (!ruoloInvitante) {
    return jsonResponse(false, 'Profilo non trovato', 403)
  }

  let body: { ruolo_invitato?: string; multi_uso?: boolean; associato_a?: string }
  try {
    body = await request.json()
  } catch {
    return jsonResponse(false, 'JSON non valido', 400)
  }

  const ruoloInvitato = pulisci(body.ruolo_invitato)
  if (!ruoloInvitato) {
    return jsonResponse(false, 'ruolo_invitato obbligatorio', 400)
  }

  if (!puoInvitare(ruoloInvitante, ruoloInvitato)) {
    return jsonResponse(false, `Il ruolo "${ruoloInvitante}" non può invitare "${ruoloInvitato}"`, 403)
  }

  const multiUso = body.multi_uso === true
  const associatoA = pulisci(body.associato_a)
  const isPrivileged = ruoloInvitante === 'admin' || ruoloInvitante === 'manager'
  const canChooseCompanyParent =
    ruoloInvitante === 'agenzia' || ruoloInvitante === 'agente' || ruoloInvitante === 'back_office'

  const svc = createServiceRoleSupabase()
  if (!svc) {
    return jsonResponse(false, 'Configurazione server incompleta', 500)
  }

  let associatoAValidato: string | null = null
  if (associatoA) {
    if (!isPrivileged && !canChooseCompanyParent) {
      return jsonResponse(false, 'Non puoi scegliere il collegamento per questo invito', 403)
    }
    const parentAtteso = INVITO_CATEGORIA_PARENT[ruoloInvitato]
    if (!parentAtteso) {
      return jsonResponse(false, 'Questo ruolo non prevede un collegamento', 400)
    }
    const [{ data: profili }, { data: links }] = await Promise.all([
      svc
        .from('profili')
        .select('id, nome_completo, societa, email, area_geografica, ruolo, invitato_da, registrazione_approvata, seguito_da')
        .neq('ruolo', 'free')
        .limit(2000),
      svc
        .from('connessioni_utente_operatore')
        .select('utente_id, operatore_id')
        .limit(2000),
    ])
    const rows = (profili ?? []) as ProfiloGerarchiaRow[]
    const linkRows = links ?? []
    const scelto = rows.find((row) => row.id === associatoA)
    const ruoliOperatore = OPERATORI_INVITO_PER_SEDE[parentAtteso] ?? []
    const eSede = scelto?.ruolo === parentAtteso
    const eOperatore = Boolean(scelto && ruoliOperatore.includes(scelto.ruolo))
    if (!scelto || (!eSede && !eOperatore)) {
      return jsonResponse(false, 'Collegamento non valido per il ruolo scelto', 400)
    }

    let sediConsentite = rows.filter((row) => row.ruolo === parentAtteso)
    if (!isPrivileged) {
      const caller = rows.find((row) => row.id === user.id)
      const agenzia =
        caller?.ruolo === 'agenzia'
          ? caller
          : caller
            ? resolveAgenziaParentForAgent(caller, rows, linkRows)
            : null
      if (!agenzia) {
        return jsonResponse(false, 'Agenzia non trovata', 400)
      }
      const profiliAgenzia = filterProfiliInHierarchySubtree(
        profiloToGerarchiaRow(agenzia, agenzia.invitato_da),
        rows,
        linkRows,
      )
      const idsAgenzia = new Set(profiliAgenzia.map((row) => row.id))
      if (eSede && !idsAgenzia.has(scelto.id)) {
        return jsonResponse(false, 'Il collegamento scelto non appartiene alla tua agenzia', 403)
      }
      sediConsentite = sediConsentite.filter((row) => idsAgenzia.has(row.id))
    }

    if (
      eOperatore &&
      !operatoreAppartieneASede(
        scelto.id,
        parentAtteso,
        sediConsentite,
        rows,
        linkRows,
        user.id,
        ruoloInvitante,
      )
    ) {
      return jsonResponse(
        false,
        isPrivileged
          ? 'Collegamento non valido per il ruolo scelto'
          : 'Il collegamento scelto non appartiene alla tua agenzia',
        isPrivileged ? 400 : 403,
      )
    }
    associatoAValidato = scelto.id
  }

  const token = crypto.randomUUID()

  const { error } = await svc
    .from('inviti')
    .insert({
      token,
      creato_da: user.id,
      ruolo_invitato: ruoloInvitato,
      multi_uso: multiUso,
      associato_a: associatoAValidato,
    })

  if (error) {
    console.error('inviti insert', error)
    return jsonResponse(false, 'Errore nella creazione del link', 500)
  }

  const baseUrl = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const link = `${baseUrl}/registrazione?token=${token}`

  return jsonResponse(true, 'Link creato', 200, { link, token })
}
