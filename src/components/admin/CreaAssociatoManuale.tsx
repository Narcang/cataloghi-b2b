'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

type RuoloNuovo = 'agente' | 'back_office' | 'distributore' | 'agenzia' | 'rivenditore'

type ParentOption = { id: string; label: string }

type Props = {
  parentId?: string
  parentLabel?: string
  ruoloNuovo: RuoloNuovo
  /** Se valorizzata, la società è fissata a questo valore (uguale a quella del genitore) e non modificabile. */
  societaBloccata?: string
  /** Se presente, l'utente sceglie il collegamento da questo elenco. */
  parentOptions?: ParentOption[]
  parentSelectLabel?: string
  allowEmptyParent?: boolean
  emptyParentLabel?: string
}

const CONFIG: Record<
  RuoloNuovo,
  { titolo: string; persona: string; nomePlaceholder: string; societaPlaceholder: string; button: string }
> = {
  agente: {
    titolo: 'Inserisci agente manualmente',
    persona: 'agente',
    nomePlaceholder: 'Es. Mario Rossi',
    societaPlaceholder: '',
    button: 'Crea e associa agente',
  },
  back_office: {
    titolo: 'Inserisci back-office manualmente',
    persona: 'back-office',
    nomePlaceholder: 'Es. Mario Rossi',
    societaPlaceholder: '',
    button: 'Crea e associa back-office',
  },
  distributore: {
    titolo: 'Inserisci venditore manualmente',
    persona: 'venditore',
    nomePlaceholder: 'Es. Luca Bianchi',
    societaPlaceholder: '',
    button: 'Crea e associa venditore',
  },
  agenzia: {
    titolo: 'Inserisci agenzia manualmente',
    persona: 'agenzia',
    nomePlaceholder: 'Es. Mario Rossi',
    societaPlaceholder: 'Es. Rossi Agency',
    button: 'Crea agenzia',
  },
  rivenditore: {
    titolo: 'Inserisci rivenditore manualmente',
    persona: 'rivenditore',
    nomePlaceholder: 'Es. Luca Bianchi',
    societaPlaceholder: 'Es. Ceramiche Bianchi',
    button: 'Crea rivenditore',
  },
}

export default function CreaAssociatoManuale({
  parentId,
  parentLabel,
  ruoloNuovo,
  societaBloccata,
  parentOptions,
  parentSelectLabel,
  allowEmptyParent = false,
  emptyParentLabel = 'Nessun collegamento',
}: Props) {
  const router = useRouter()
  const cfg = CONFIG[ruoloNuovo]
  const societaLocked = Boolean(societaBloccata?.trim())
  const prioritaSocieta = ruoloNuovo === 'agenzia' || ruoloNuovo === 'rivenditore'
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [areaGeografica, setAreaGeografica] = useState('')
  const [societa, setSocieta] = useState('')
  const [selectedParentId, setSelectedParentId] = useState(
    parentId ?? (allowEmptyParent ? '' : (parentOptions?.[0]?.id ?? '')),
  )
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
    if (prioritaSocieta && !(societaLocked ? societaBloccata : societa)?.trim()) {
      setError('La società è obbligatoria')
      return
    }
    if (!prioritaSocieta && !nomeCompleto.trim()) {
      setError('Il nome è obbligatorio')
      return
    }
    const parentToSend = (parentOptions ? selectedParentId : parentId)?.trim() || undefined
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profili/crea-associato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          parent_id: parentToSend,
          ruolo_nuovo: ruoloNuovo,
          nome_completo: nomeCompleto,
          email,
          telefono,
          societa: societaLocked ? societaBloccata : societa,
          area_geografica: areaGeografica,
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? 'Creazione non riuscita')
        return
      }
      setMessage(data.message ?? 'Creato')
      reset()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full h-9 rounded-md border border-black bg-white px-2 text-sm'
  const selectedParentLabel =
    parentOptions?.find((o) => o.id === selectedParentId)?.label ?? parentLabel

  return (
    <div>
      <p className="text-xs font-medium uppercase text-zinc-600 mb-1 flex items-center gap-1.5">
        <UserPlus size={14} aria-hidden />
        {cfg.titolo}
      </p>
      <p className="text-xs text-zinc-500 mb-2">
        {selectedParentLabel ? (
          <>
            Crea un{cfg.persona === 'agenzia' ? '’' : ' '}{cfg.persona} e collegalo a{' '}
            <span className="font-medium text-zinc-700">{selectedParentLabel}</span>: comparirà nella
            struttura organizzativa.
          </>
        ) : (
          <>
            Crea un{cfg.persona === 'agenzia' ? '’' : ' '}{cfg.persona}: comparirà nella struttura
            organizzativa.
          </>
        )}{' '}
        Se non indichi un’email viene creato un account tecnico interno (il profilo resta visibile ma
        non può accedere finché non gli configuri l’accesso).
      </p>

      {message ? (
        <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-black/15 rounded-lg p-3 bg-zinc-50"
        onSubmit={submit}
      >
        {parentOptions && parentOptions.length > 0 ? (
          <label className="block text-xs font-medium uppercase text-zinc-600 md:col-span-2">
            {parentSelectLabel ?? 'Collega a'}
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className={inputClass}
            >
              {allowEmptyParent ? <option value="">{emptyParentLabel}</option> : null}
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {prioritaSocieta ? (
          <label className="block text-xs font-medium uppercase text-zinc-600 md:col-span-2">
            Società *
            {societaLocked ? (
              <input
                type="text"
                value={societaBloccata ?? ''}
                readOnly
                disabled
                className={`${inputClass} bg-zinc-100 text-zinc-500 cursor-not-allowed`}
              />
            ) : (
              <input
                type="text"
                value={societa}
                onChange={(e) => setSocieta(e.target.value)}
                placeholder={cfg.societaPlaceholder}
                className={inputClass}
              />
            )}
          </label>
        ) : null}
        <label className="block text-xs font-medium uppercase text-zinc-600">
          {prioritaSocieta ? 'Nome referente (opzionale)' : 'Nome completo *'}
          <input
            type="text"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            placeholder={cfg.nomePlaceholder}
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
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} />
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
        {prioritaSocieta ? null : (
          <label className="block text-xs font-medium uppercase text-zinc-600 md:col-span-2">
            Società {societaLocked ? '(uguale alla tua azienda)' : '(opzionale)'}
            {societaLocked ? (
              <input
                type="text"
                value={societaBloccata ?? ''}
                readOnly
                disabled
                className={`${inputClass} bg-zinc-100 text-zinc-500 cursor-not-allowed`}
              />
            ) : (
              <input type="text" value={societa} onChange={(e) => setSocieta(e.target.value)} className={inputClass} />
            )}
          </label>
        )}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-[#060d41] text-white px-3 text-sm font-semibold hover:bg-[#0a155a] disabled:opacity-50"
          >
            {saving ? 'Creazione…' : cfg.button}
          </button>
        </div>
      </form>
    </div>
  )
}
