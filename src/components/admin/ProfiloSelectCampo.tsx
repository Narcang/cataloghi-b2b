'use client'

import { opzioniPerSelect } from '@/lib/profiloSpecializzazioneOpzioni'
import { QUANTITA_MAX } from '@/lib/profiloQuantita'

type Props = {
  name: string
  label: string
  value: string | null
  options: readonly string[]
  inputClassName: string
  qtaName: string
  qtaValue: number | null
  dataName: string
  dataValue: string | null
}

export default function ProfiloSelectCampo({
  name,
  label,
  value,
  options,
  inputClassName,
  qtaName,
  qtaValue,
  dataName,
  dataValue,
}: Props) {
  const selectOptions = opzioniPerSelect(options, value)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 items-end">
      <label className="block text-xs font-medium uppercase text-zinc-600 min-w-0">
        {label}
        <select
          key={selectOptions.join('\0')}
          name={name}
          defaultValue={value ?? ''}
          className={inputClassName}
        >
          <option value="">— Nessuna selezione —</option>
          {selectOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium uppercase text-zinc-600">
        Qtà
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={QUANTITA_MAX}
          step={1}
          name={qtaName}
          defaultValue={qtaValue ?? ''}
          placeholder="—"
          className={`${inputClassName} w-16 text-center`}
        />
      </label>
      <label className="block text-xs font-medium uppercase text-zinc-600">
        Data
        <input
          type="text"
          name={dataName}
          defaultValue={dataValue ?? ''}
          placeholder="gg/mm/aaaa"
          className={`${inputClassName} w-28 text-center`}
        />
      </label>
    </div>
  )
}
