import Link from 'next/link'
import type { AppLocale } from '@/lib/locale'
import { tAdmin } from '@/lib/i18nAdmin'

export default function CatalogCategoriaTabs({
  active,
  categories,
  counts,
  labels,
  nome,
  lingua,
  locale,
}: {
  active: string | 'all'
  categories: readonly string[]
  counts: Record<string, number>
  labels: Record<string, string>
  nome: string
  lingua: string
  locale: AppLocale
}) {
  const copy = tAdmin(locale)

  function href(categoria: string | 'all') {
    const params = new URLSearchParams()
    if (nome) params.set('nome', nome)
    params.set('lingua', lingua)
    if (categoria !== 'all') params.set('categoria', categoria)
    return `/dashboard/gestione-cataloghi?${params.toString()}`
  }

  const tabs: Array<string | 'all'> = ['all', ...categories]

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.categoria}>
      {tabs.map((tab) => {
        const selected = active === tab
        const label = tab === 'all' ? copy.tutteLingue : (labels[tab] ?? tab)
        const count = tab === 'all' ? counts.all : counts[tab]
        return (
          <Link
            key={tab}
            href={href(tab)}
            role="tab"
            aria-selected={selected}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
              selected
                ? 'border-[#060d41] bg-[#060d41] text-white'
                : 'border-black bg-white text-[#060d41] hover:bg-zinc-100'
            }`}
          >
            {label}
            {typeof count === 'number' ? (
              <span className={selected ? 'text-white/80' : 'text-zinc-500'}>{count}</span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
