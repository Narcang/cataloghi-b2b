'use client'

import {
  CAMPIONE_OPTIONS,
  CATALOGO_AGENZIA_OPTIONS,
  type AgenziaProfiloCampi,
} from '@/lib/agenziaProfiloOptions'
import { QUANTITA_MAX } from '@/lib/profiloQuantita'

type Props = {
  profilo: AgenziaProfiloCampi
  inputClassName?: string
}

function SelectCampo({
  name,
  label,
  value,
  options,
  inputClassName,
  qtaName,
  qtaValue,
}: {
  name: string
  label: string
  value: string | null
  options: readonly string[]
  inputClassName: string
  qtaName: string
  qtaValue: number | null
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
      <label className="block text-xs font-medium uppercase text-zinc-600">
        {label}
        <select name={name} defaultValue={value ?? ''} className={inputClassName}>
          <option value="">— Nessuna selezione —</option>
          {options.map((option) => (
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
          className={`${inputClassName} w-20 text-center`}
        />
      </label>
    </div>
  )
}

export default function AgenziaProfiloCampi({
  profilo,
  inputClassName = 'mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm',
}: Props) {
  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-black/20 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Campioni e Cataloghi</p>
        <p className="text-xs opacity-80 mt-0.5">
          Solo per profili Agenzia — scelta singola e quantità per ogni voce.
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Campioni</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectCampo
            name="agenzia_campione_1"
            label="Campione"
            value={profilo.agenzia_campione_1}
            options={CAMPIONE_OPTIONS}
            inputClassName={inputClassName}
            qtaName="agenzia_campione_1_qta"
            qtaValue={profilo.agenzia_campione_1_qta ?? null}
          />
          <SelectCampo
            name="agenzia_campione_2"
            label="Campione"
            value={profilo.agenzia_campione_2}
            options={CAMPIONE_OPTIONS}
            inputClassName={inputClassName}
            qtaName="agenzia_campione_2_qta"
            qtaValue={profilo.agenzia_campione_2_qta ?? null}
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Cataloghi</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectCampo
            name="agenzia_catalogo_1"
            label="Catalogo"
            value={profilo.agenzia_catalogo_1}
            options={CATALOGO_AGENZIA_OPTIONS}
            inputClassName={inputClassName}
            qtaName="agenzia_catalogo_1_qta"
            qtaValue={profilo.agenzia_catalogo_1_qta ?? null}
          />
          <SelectCampo
            name="agenzia_catalogo_2"
            label="Catalogo"
            value={profilo.agenzia_catalogo_2}
            options={CATALOGO_AGENZIA_OPTIONS}
            inputClassName={inputClassName}
            qtaName="agenzia_catalogo_2_qta"
            qtaValue={profilo.agenzia_catalogo_2_qta ?? null}
          />
        </div>
      </div>
    </div>
  )
}
