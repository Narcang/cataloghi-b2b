'use client'

import { useEffect } from 'react'

const LETTERE = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))

type Props = {
  counts: Map<string, number>
  valore: string | null
  onChange: (lettera: string | null) => void
  etichetta: string
  tutte: string
  altre: string
}

export default function FiltroIniziale({
  counts,
  valore,
  onChange,
  etichetta,
  tutte,
  altre,
}: Props) {
  useEffect(() => {
    if (valore && (counts.get(valore) ?? 0) === 0) onChange(null)
  }, [valore, counts, onChange])

  const altreCount = counts.get('#') ?? 0

  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label={etichetta}>
      <Lettera active={valore === null} onClick={() => onChange(null)}>
        {tutte}
      </Lettera>
      {LETTERE.map((lettera) => {
        const presenti = counts.get(lettera) ?? 0
        const active = valore === lettera
        return (
          <Lettera
            key={lettera}
            active={active}
            disabled={presenti === 0}
            onClick={() => onChange(active ? null : lettera)}
          >
            {lettera}
          </Lettera>
        )
      })}
      {altreCount > 0 ? (
        <Lettera active={valore === '#'} onClick={() => onChange(valore === '#' ? null : '#')}>
          {altre}
        </Lettera>
      ) : null}
    </div>
  )
}

function Lettera({
  active,
  disabled = false,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${
        active
          ? 'border-[#060d41] bg-[#060d41] text-white'
          : disabled
            ? 'cursor-not-allowed border-black/10 bg-zinc-50 text-zinc-300'
            : 'border-black/20 bg-white text-zinc-800 hover:bg-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}
