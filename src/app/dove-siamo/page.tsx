import Header from '@/components/Header'
import DoveSiamoContent from '@/components/DoveSiamoContent'
import { getAppLocale } from '@/lib/localeServer'
import { tDoveSiamo } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const locale = await getAppLocale()
  const copy = tDoveSiamo(locale)
  return {
    title: `${copy.metaTitle} · Ladiva Ceramica`,
    description: copy.metaDescription,
  }
}

export default async function DoveSiamoPage() {
  const locale = await getAppLocale()

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />
      <DoveSiamoContent initialLocale={locale} />
    </div>
  )
}
