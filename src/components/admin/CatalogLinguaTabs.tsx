import Link from 'next/link'
import { CATALOG_LOCALES, LOCALE_LABEL, type AppLocale, type CatalogLocale } from '@/lib/locale'
import { tAdmin } from '@/lib/i18nAdmin'

type Tab = CatalogLocale | 'all'

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
  const tabs: Tab[] = ['all', ...CATALOG_LOCALES]
  const tabLabel: Record<Tab, string> = {
    all: copy.tutteLingue,
    it: LOCALE_LABEL.it,
    ru: LOCALE_LABEL.ru,
    en: LOCALE_LABEL.en,
  }

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
        return (
          <Link
            key={tab}
            href={href(tab)}
            role="tab"
            aria-selected={selected}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
              selected
                ? 'border-[#060d41] bg-[#060d41] text-white'
                : 'border-black bg-white text-[#060d41] hover:bg-zinc-100'
            }`}
          >
            {tabLabel[tab]}
            <span className={selected ? 'text-white/80' : 'text-zinc-500'}>{counts[tab]}</span>
          </Link>
        )
      })}
    </div>
  )
}
