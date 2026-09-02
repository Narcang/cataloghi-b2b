'use client'

import { CHOOSER_LOCALES, isCatalogLocale, LOCALE_SHORT, type AppLocale } from '@/lib/locale'
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
      url.searchParams.set('lingua', isCatalogLocale(next) ? next : 'it')
      window.location.assign(url.toString())
      return
    }
    window.location.reload()
  }

  return (
    <div
      className="ladiva-locale-switch inline-flex flex-wrap rounded-lg overflow-hidden max-w-[min(100%,22rem)]"
      role="group"
      aria-label={labels.lingua}
      style={{ backgroundColor: '#fff', border: '1px solid rgba(0, 0, 0, 0.2)' }}
    >
      {CHOOSER_LOCALES.map((key) => {
        const active = locale === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => void scegli(key)}
            className="ladiva-locale-switch-btn px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
            style={
              active
                ? { backgroundColor: '#060d41', color: '#fff' }
                : { backgroundColor: '#fff', color: '#000' }
            }
          >
            {LOCALE_SHORT[key]}
          </button>
        )
      })}
    </div>
  )
}
