import Header from '@/components/Header'
import RegistrazioneForm from '@/components/RegistrazioneForm'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { getAppLocale } from '@/lib/localeServer'
import { tRegistrazione } from '@/lib/i18n'
import { loadInvitoValidato } from '@/lib/invitoLookup'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  let ruoloKey: string | null = null
  let societaInvito: string | null = null
  let hasInvito = false
  if (tokenRaw) {
    const svc = createServiceRoleSupabase()
    const invito = svc ? await loadInvitoValidato(svc, tokenRaw) : null
    if (invito) {
      hasInvito = true
      ruoloKey = invito.ruolo
      societaInvito = invito.societa
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />
      <RegistrazioneForm
        initialLocale={locale}
        tokenRaw={tokenRaw}
        hasInvito={hasInvito}
        ruoloKey={ruoloKey}
        societaInvito={societaInvito}
        ok={ok}
        message={message}
      />
    </div>
  )
}
