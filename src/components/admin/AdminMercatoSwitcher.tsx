'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import type { Mercato } from '@/lib/mercato'
import { tAdmin, tVersioneMonitorataValue } from '@/lib/i18nAdmin'
import { useAppLocale } from '@/lib/useAppLocale'

type Props = {
  className?: string
}

type VersioneKey = 'it' | 'ru' | 'en'

export default function AdminMercatoSwitcher({ className = '' }: Props) {
  const locale = useAppLocale()
  const copy = tAdmin(locale)
  const [mercato, setMercato] = useState<Mercato>('it')
  const [ruConfigured, setRuConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active: VersioneKey = mercato === 'ru' ? 'ru' : locale === 'en' ? 'en' : 'it'

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/mercato', { credentials: 'same-origin' })
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; mercato?: Mercato; ruConfigured?: boolean; message?: string }
          | null
        if (cancelled) return
        if (!res.ok || !data?.ok) {
          setError(data?.message ?? copy.caricaMercato)
          return
        }
        if (data.mercato) setMercato(data.mercato)
        setRuConfigured(Boolean(data.ruConfigured))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [copy.caricaMercato])

  async function seleziona(next: VersioneKey) {
    if (next === active || saving) return
    if (next === 'ru' && !ruConfigured) return
    setSaving(true)
    setError(null)
    try {
      const requests: Promise<Response>[] = []
      if (next === 'ru') {
        requests.push(
          fetch('/api/admin/mercato', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mercato: 'ru' }),
          }),
        )
      } else {
        requests.push(
          fetch('/api/admin/mercato', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mercato: 'it' }),
          }),
        )
        requests.push(
          fetch('/api/locale', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale: next }),
          }),
        )
      }

      const results = await Promise.all(requests)
      for (const res of results) {
        const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
        if (!res.ok || !data?.ok) {
          setError(data?.message ?? copy.salvaMercato)
          return
        }
      }
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const buttons: { key: VersioneKey; label: string }[] = [
    { key: 'it', label: copy.italia },
    { key: 'ru', label: copy.russia },
    { key: 'en', label: copy.english },
  ]

  return (
    <div
      className={`ladiva-mercato-switch-bar rounded-xl border border-white/15 bg-[#060d41] px-4 py-3 ${className}`.trim()}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white">
          <Globe size={16} className="shrink-0 text-white" aria-hidden />
          <span>
            {copy.versioneMonitorata}:{' '}
            <strong className="font-semibold text-white">
              {tVersioneMonitorataValue(locale, mercato)}
            </strong>
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-white/20 bg-[#060d41] p-0.5">
          {buttons.map(({ key, label }) => {
            const isActive = active === key
            const disabled = saving || (key === 'ru' && !ruConfigured)
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => void seleziona(key)}
                className={`ladiva-mercato-switch-btn rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:hover:!bg-transparent disabled:hover:!text-white ${
                  isActive ? 'ladiva-mercato-switch-btn-active' : 'ladiva-mercato-switch-btn-inactive'
                }`}
                title={key === 'ru' && !ruConfigured ? copy.configuraRu : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      {!ruConfigured ? (
        <p className="mt-2 text-xs text-white/75">{copy.russiaEnvHelp}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  )
}
