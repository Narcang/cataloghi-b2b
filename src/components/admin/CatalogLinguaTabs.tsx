import Link from 'next/link'
import { APP_LOCALES, LOCALE_LABEL, type AppLocale } from '@/lib/locale'

type Tab = AppLocale | 'all'

const TAB_LABEL: Record<Tab, string> = {
  all: 'Tutte',
  it: LOCALE_LABEL.it,
  ru: LOCALE_LABEL.ru,
  en: LOCALE_LABEL.en,
}

export default function CatalogLinguaTabs({
  active,
  counts,
  nome,
}: {
  active: Tab
  counts: Record<Tab, number>
  nome: string
}) {
  const tabs: Tab[] = ['all', ...APP_LOCALES]

  function href(tab: Tab) {
    const params = new URLSearchParams()
    if (nome) params.set('nome', nome)
    params.set('lingua', tab)
    return `/dashboard/gestione-cataloghi?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lingua cataloghi">
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
            {TAB_LABEL[tab]}
            <span className={selected ? 'text-white/80' : 'text-zinc-500'}>{counts[tab]}</span>
          </Link>
        )
      })}
    </div>
  )
}
