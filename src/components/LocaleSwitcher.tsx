'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CHOOSER_LOCALES, LOCALE_LABEL, LOCALE_SHORT, type AppLocale } from '@/lib/locale'
import { tHeader } from '@/lib/i18n'
import { useAppLocale } from '@/lib/useAppLocale'

export default function LocaleSwitcher() {
  const locale = useAppLocale()
  const labels = tHeader(locale)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  async function scegli(next: AppLocale) {
    setOpen(false)
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

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  function toggle() {
    setOpen((value) => !value)
  }

  return (
    <div className="ladiva-dropdown ladiva-locale-switch" ref={rootRef}>
      <div className="ladiva-account-trigger-row">
        <button
          type="button"
          className="ladiva-split-trigger-label ladiva-locale-switch-label"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={labels.lingua}
        >
          {LOCALE_SHORT[locale]}
        </button>
        <button
          type="button"
          className="ladiva-account-chevron-btn"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={labels.lingua}
        >
          <ChevronDown size={16} className={`ladiva-chevron ${open ? 'open' : ''}`} />
        </button>
      </div>
      {open ? (
        <div className="ladiva-dropdown-menu ladiva-locale-switch-menu" role="listbox" aria-label={labels.lingua}>
          {CHOOSER_LOCALES.map((key) => {
            const active = locale === key
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                className={`ladiva-dropdown-item w-full text-left${active ? ' ladiva-locale-switch-item-active' : ''}`}
                onClick={() => void scegli(key)}
              >
                <span className="ladiva-locale-switch-code">{LOCALE_SHORT[key]}</span>
                {LOCALE_LABEL[key]}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
