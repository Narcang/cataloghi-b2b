import Link from 'next/link'
import { APP_LOCALES, localeNameIn, type AppLocale } from '@/lib/locale'
import { tAdmin } from '@/lib/i18nAdmin'

type Tab = AppLocale | 'all'

export default function CatalogLinguaTabs({
  active,
  counts,
  nome,
  locale,
}: {
  active: Tab
  counts: Record<Tab, number>
  nome: string
  locale: AppLocale
}) {
  const copy = tAdmin(locale)
  const tabs: Tab[] = ['all', ...APP_LOCALES]

  function href(tab: Tab) {
    const params = new URLSearchParams()
    if (nome) params.set('nome', nome)
    params.set('lingua', tab)
    return `/dashboard/gestione-cataloghi?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.linguaCataloghi}>
      {tabs.map((tab) => {
        const selected = active === tab
        const label = tab === 'all' ? copy.tutteLingue : localeNameIn(locale, tab)
        return (
          <Link
            key={tab}
            href={href(tab)}
            role="tab"
            aria-selected={selected}
            className={`ladiva-filter-tab inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
              selected ? 'ladiva-filter-tab-active' : ''
            }`}
          >
            {label}
            <span className="ladiva-filter-tab-count">{counts[tab]}</span>
          </Link>
        )
      })}
    </div>
  )
}
