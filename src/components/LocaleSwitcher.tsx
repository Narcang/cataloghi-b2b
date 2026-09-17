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
    const url = new URL(window.location.href)
    if (url.pathname.includes('gestione-cataloghi')) {
      url.searchParams.set('lingua', next)
      window.location.assign(url.toString())
      return
    }
    window.location.reload()
  }

  return (
    <div
      className="ladiva-locale-switch"
      role="group"
      aria-label={labels.lingua}
    >
      {CHOOSER_LOCALES.map((key) => {
        const active = locale === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => void scegli(key)}
            className={`ladiva-locale-switch-btn cursor-pointer${active ? ' ladiva-locale-switch-btn-active' : ' ladiva-locale-switch-btn-inactive'}`}
          >
            {LOCALE_SHORT[key]}
          </button>
        )
      })}
    </div>
  )
}
