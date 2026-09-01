'use client'

import { CHOOSER_LOCALES, LOCALE_SHORT, type AppLocale } from '@/lib/locale'
import { tHeader } from '@/lib/i18n'
import { useAppLocale } from '@/lib/useAppLocale'

export default function LocaleSwitcher() {
  const locale = useAppLocale()
  const labels = tHeader(locale)

  async function scegli(next: AppLocale) {
    if (next === locale) return
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ locale: next }),
    })
    window.location.reload()
  }

  return (
    <div className="inline-flex rounded-lg border border-black/20 overflow-hidden" role="group" aria-label={labels.lingua}>
      {CHOOSER_LOCALES.map((key) => {
        const active = locale === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => void scegli(key)}
            className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
              active ? 'bg-[#060d41] text-white' : 'bg-white text-[#060d41] hover:bg-zinc-100'
            }`}
          >
            {LOCALE_SHORT[key]}
          </button>
        )
      })}
    </div>
  )
}
