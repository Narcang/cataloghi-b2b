'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

type Props = {
  agenziaId: string
  agenziaLabel: string
}

export default function CreaAgenteManuale({ agenziaId, agenziaLabel }: Props) {
  const router = useRouter()
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [areaGeografica, setAreaGeografica] = useState('')
  const [societa, setSocieta] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setNomeCompleto('')
    setEmail('')
    setTelefono('')
    setAreaGeografica('')
    setSocieta('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!nomeCompleto.trim()) {
      setError('Il nome dell’agente è obbligatorio')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profili/crea-agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          agenzia_id: agenziaId,
          nome_completo: nomeCompleto,
          email,
          telefono,
          societa,
          area_geografica: areaGeografica,
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Creazione non riuscita')
        return
      }
      setMessage(data.message ?? 'Agente creato')
      reset()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm'

  return (
    <div>
      <p className="text-xs font-medium uppercase text-zinc-600 mb-1 flex items-center gap-1.5">
        <UserPlus size={14} aria-hidden />
        Inserisci agente manualmente
      </p>
      <p className="text-xs text-zinc-500 mb-2">
        Crea un agente e collegalo a <span className="font-medium text-zinc-700">{agenziaLabel}</span>: comparirà
        nella struttura organizzativa sotto questa agenzia. Se non indichi un’email viene creato un account tecnico
        interno (l’agente resta visibile ma non può accedere finché non gli configuri l’accesso).
      </p>

      {message ? (
        <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-black/15 rounded-lg p-3 bg-zinc-50" onSubmit={submit}>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Nome completo *
          <input
            type="text"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            placeholder="Es. Mario Rossi"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Email (opzionale)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Se assente: account tecnico interno"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Telefono (opzionale)
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-600">
          Area geografica (opzionale)
          <input
            type="text"
            value={areaGeografica}
            onChange={(e) => setAreaGeografica(e.target.value)}
            placeholder="Es. Lombardia"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-600 md:col-span-2">
          Società (opzionale)
          <input
            type="text"
            value={societa}
            onChange={(e) => setSocieta(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
          >
            {saving ? 'Creazione…' : 'Crea e associa agente'}
          </button>
        </div>
      </form>
    </div>
  )
}
