'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import RivenditoreProfiloCampi from '@/components/admin/RivenditoreProfiloCampi'
import {
  readRivenditoreCampiFromFormData,
  type RivenditoreProfiloCampi as RivenditoreProfiloCampiValues,
} from '@/lib/rivenditoreProfiloOptions'

type Props = {
  profiloId: string
  profilo: Omit<RivenditoreProfiloCampiValues, 'seguito_da'>
}

export default function RivenditoreSpecializzazioneEditForm({ profiloId, profilo }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const fd = new FormData(e.currentTarget)
    const campi = readRivenditoreCampiFromFormData(fd)
    const { seguito_da: _omit, ...specializzazione } = campi

    try {
      const res = await fetch('/api/admin/profili/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ profilo_id: profiloId, ...specializzazione }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Aggiornamento non riuscito')
        return
      }
      setMessage(data.message ?? 'Salvato')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 border-t border-black/10 pt-3 md:col-span-4">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setError(null)
          setMessage(null)
        }}
        className="text-sm font-semibold text-[#060d41] hover:underline"
      >
        {open ? 'Chiudi modifica espositori e box' : 'Modifica espositori e box'}
      </button>

      {open ? (
        <form className="mt-3 space-y-3" onSubmit={onSubmit}>
          <RivenditoreProfiloCampi profilo={profilo} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
            >
              {saving ? 'Salvataggio…' : 'Salva espositori e box'}
            </button>
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>
        </form>
      ) : null}
    </div>
  )
}
