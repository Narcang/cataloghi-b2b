import Header from '@/components/Header'
import RegistrazioneForm from '@/components/RegistrazioneForm'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { getAppLocale } from '@/lib/localeServer'
import { tRegistrazione } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchInvito(token: string): Promise<{ ruolo_invitato: string; creato_da: string } | null> {
  if (!token || token.length < 10) return null
  const svc = createServiceRoleSupabase()
  if (!svc) return null
  const { data } = await svc
    .from('inviti')
    .select('ruolo_invitato, creato_da, usato, multi_uso')
    .eq('token', token)
    .single()
  if (!data || (data.usato && !data.multi_uso)) return null
  return { ruolo_invitato: data.ruolo_invitato, creato_da: data.creato_da }
}

export async function generateMetadata() {
  const locale = await getAppLocale()
  const copy = tRegistrazione(locale)
  return {
    title: `${copy.metaTitle} · Ladiva Ceramica`,
    description: copy.metaDescription,
  }
}

export default async function RegistrazionePage(props: {
  searchParams: Promise<{ message?: string; ok?: string; token?: string }>
}) {
  const searchParams = await props.searchParams
  const locale = await getAppLocale()
  const ok = searchParams?.ok === '1'
  const message = searchParams?.message ?? ''
  const tokenRaw = (searchParams?.token ?? '').trim()

  const invito = tokenRaw ? await fetchInvito(tokenRaw) : null

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />
      <RegistrazioneForm
        initialLocale={locale}
        tokenRaw={tokenRaw}
        hasInvito={Boolean(invito)}
        ruoloKey={invito?.ruolo_invitato ?? null}
        ok={ok}
        message={message}
      />
    </div>
  )
}
