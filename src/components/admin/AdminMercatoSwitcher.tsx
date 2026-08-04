'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { MERCATO_LABEL, type Mercato } from '@/lib/mercato'

type Props = {
  className?: string
}

export default function AdminMercatoSwitcher({ className = '' }: Props) {
  const [mercato, setMercato] = useState<Mercato>('it')
  const [ruConfigured, setRuConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          setError(data?.message ?? 'Caricamento mercato non riuscito')
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
  }, [])

  async function seleziona(next: Mercato) {
    if (next === mercato || saving) return
    if (next === 'ru' && !ruConfigured) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/mercato', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercato: next }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Salvataggio non riuscito')
        return
      }
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div
      className={`rounded-xl border border-white/15 bg-[#060d41] px-4 py-3 ${className}`.trim()}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white">
          <Globe size={16} className="shrink-0 text-white" aria-hidden />
          <span>
            Versione monitorata:{' '}
            <strong className="font-semibold text-white">{MERCATO_LABEL[mercato]}</strong>
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-white/20 bg-[#060d41] p-0.5">
          {(['it', 'ru'] as const).map((key) => {
            const active = mercato === key
            const disabled = saving || (key === 'ru' && !ruConfigured)
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => void seleziona(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-white text-[#060d41]'
                    : 'text-white hover:bg-white hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white'
                }`}
                title={key === 'ru' && !ruConfigured ? 'Configura Supabase RU nelle env' : undefined}
              >
                {MERCATO_LABEL[key]}
              </button>
            )
          })}
        </div>
      </div>
      {!ruConfigured ? (
        <p className="mt-2 text-xs text-white/75">
          Versione Russia: collegare <code className="text-[11px] text-white/90">NEXT_PUBLIC_SUPABASE_URL_RU</code>{' '}
          e <code className="text-[11px] text-white/90">SUPABASE_SERVICE_ROLE_KEY_RU</code> su Vercel.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  )
}
