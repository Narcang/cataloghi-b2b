import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { Mercato } from '@/lib/mercato'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

type AdminDataContext = {
  user: User
  ruolo: string
  isAdmin: boolean
  isManager: boolean
  mercato: Mercato
  authClient: SupabaseClient
  dataClient: SupabaseClient
}

type AdminDataResult =
  | { ok: true; ctx: AdminDataContext }
  | { ok: false; response: NextResponse }

function deny(message: string, status: number) {
  return { ok: false as const, response: NextResponse.json({ ok: false, message }, { status }) }
}

/**
 * Auth e dati sul progetto IT. La lingua dei cataloghi segue il menu IT/RU/EN.
 */
export async function resolveAdminDataContext(options?: {
  requireAdmin?: boolean
  requireManager?: boolean
}): Promise<AdminDataResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return deny('Non autenticato', 401)

  const { data: profilo } = await authClient
    .from('profili')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  const ruolo = profilo?.ruolo ?? 'free'
  const isAdmin = ruolo === 'admin'
  const isManager = isAdmin || ruolo === 'manager'

  if (options?.requireAdmin && !isAdmin) return deny('Operazione non consentita', 403)
  if (options?.requireManager && !isManager) return deny('Operazione non consentita', 403)

  return {
    ok: true,
    ctx: {
      user,
      ruolo,
      isAdmin,
      isManager,
      mercato: 'it',
      authClient,
      dataClient: authClient,
    },
  }
}
