'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportCataloghiRussia() {
  const router = useRouter()
  const [ruCount, setRuCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/admin/cataloghi/import-ru', { credentials: 'same-origin' })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; ruCount?: number; message?: string } | null
      if (cancelled) return
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Impossibile leggere i cataloghi Russia.')
        return
      }
      setRuCount(typeof data.ruCount === 'number' ? data.ruCount : 0)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function importa() {
    if (loading) return
    const ok = window.confirm(
      'Copiare i cataloghi dal progetto Russia a questo sito, come file in lingua russa? I PDF italiani non vengono toccati.',
    )
    if (!ok) return

    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/cataloghi/import-ru', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        message?: string
        errors?: string[]
      } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Import non riuscito')
        return
      }
      const extra = data.errors?.length ? ` ${data.errors.slice(0, 3).join(' · ')}` : ''
      setMessage(`${data.message ?? 'Import completato.'}${extra}`)
      router.replace(`/dashboard/gestione-cataloghi?lingua=ru&message=${encodeURIComponent(data.message ?? 'Import completato')}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="border border-black rounded-2xl bg-white p-6 space-y-3">
      <h2 className="text-xl text-zinc-900 font-medium">Cataloghi Russia</h2>
      <p className="text-sm text-zinc-600">
        Copia PDF e copertine dal progetto Russia in questo database, con lingua <strong>ru</strong>.
        I file italiani restano invariati.
      </p>
      {ruCount !== null ? (
        <p className="text-sm text-zinc-800">
          Cataloghi trovati sul progetto Russia: <strong>{ruCount}</strong>
        </p>
      ) : error ? null : (
        <p className="text-sm text-zinc-500">Verifica archivio Russia…</p>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      <button
        type="button"
        onClick={() => void importa()}
        disabled={loading || ruCount === 0}
        className="h-10 rounded-md bg-[#060d41] text-white px-5 text-sm font-semibold hover:bg-[#0a155a] transition-colors disabled:opacity-60"
      >
        {loading ? 'Copia in corso…' : 'Importa cataloghi Russia'}
      </button>
    </section>
  )
}
