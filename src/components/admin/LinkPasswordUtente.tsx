'use client'

import { useState } from 'react'

type Props = {
  email: string
}

export default function LinkPasswordUtente({ email }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function genera() {
    setLoading(true)
    setError(null)
    setMessage(null)
    setCopied(false)
    setRecoveryLink(null)
    try {
      const res = await fetch('/api/admin/profili/link-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        message?: string
        recovery_link?: string | null
      } | null
      if (!res.ok || !data?.ok || !data.recovery_link) {
        setError(data?.message ?? 'Link non generato')
        return
      }
      setMessage(data.message ?? 'Link pronto')
      setRecoveryLink(data.recovery_link)
    } catch {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  async function impostaPassword() {
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri')
      setMessage(null)
      return
    }
    setPasswordLoading(true)
    setError(null)
    setMessage(null)
    setRecoveryLink(null)
    try {
      const res = await fetch('/api/admin/profili/link-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Password non impostata')
        return
      }
      setPassword('')
      setMessage(data.message ?? 'Password impostata')
    } catch {
      setError('Errore di rete')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function copia() {
    if (!recoveryLink) return
    try {
      await navigator.clipboard.writeText(recoveryLink)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Nuova password"
          className="h-9 min-w-[12rem] rounded-md border border-black bg-white px-2 text-sm text-zinc-900"
        />
        <button
          type="button"
          disabled={passwordLoading || password.length === 0}
          onClick={() => void impostaPassword()}
          className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
        >
          {passwordLoading ? 'Salvataggio…' : 'Imposta password'}
        </button>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void genera()}
        className="h-9 rounded-md border border-black bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? 'Generazione…' : 'Genera link password'}
      </button>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {recoveryLink ? (
        <div className="space-y-2">
          <p className="text-xs break-all text-zinc-600">{recoveryLink}</p>
          <button
            type="button"
            onClick={() => void copia()}
            className="h-8 rounded-md bg-[#060d41] text-white px-3 text-xs font-semibold hover:bg-[#0a155a]"
          >
            {copied ? 'Copiato' : 'Copia link'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
