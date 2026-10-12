'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  email: string
}

export default function RipristinaAccessoEmail({ email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null)

  async function ripristina() {
    setLoading(true)
    setError(null)
    setMessage(null)
    setRecoveryLink(null)
    try {
      const res = await fetch('/api/admin/profili/ripristina-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email,
          ...(email === 'gianni@gameoftiles.us'
            ? { nome_completo: 'Gianni Pala', societa: 'Game of Tiles' }
            : {}),
        }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        message?: string
        recovery_link?: string | null
      } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Ripristino non riuscito')
        return
      }
      setMessage(data.message ?? 'Accesso ripristinato')
      setRecoveryLink(data.recovery_link ?? null)
      router.refresh()
    } catch {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-black bg-white px-4 py-3 space-y-3">
      <p className="text-sm text-zinc-800">
        Ripristina <span className="font-medium">{email}</span> come agente collegato a La Diva,
        così può accedere o impostare la password.
      </p>
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {recoveryLink ? (
        <p className="text-xs break-all text-zinc-600">
          Link per impostare la password:{' '}
          <a href={recoveryLink} className="underline text-[#060d41]">
            {recoveryLink}
          </a>
        </p>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void ripristina()}
        className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
      >
        {loading ? 'Ripristino…' : 'Ripristina accesso agente'}
      </button>
    </div>
  )
}
