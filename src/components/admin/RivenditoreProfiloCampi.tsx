'use client'

import {
  BOX_SHOW_ROOM_OPTIONS,
  ESPOSITORE_OPTIONS,
  type RivenditoreProfiloCampi as RivenditoreProfiloCampiValues,
} from '@/lib/rivenditoreProfiloOptions'
import { QUANTITA_MAX } from '@/lib/profiloQuantita'

type Props = {
  profilo: Omit<RivenditoreProfiloCampiValues, 'seguito_da'>
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

export default function RivenditoreProfiloCampi({
  profilo,
  inputClassName = 'mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm',
}: Props) {
  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-black/20 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Espositori e Box Show Room</p>
        <p className="text-xs opacity-80 mt-0.5">
          Solo per profili Rivenditori — scelta singola e quantità per ogni voce.
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Espositori</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectCampo
            name="espositore_1"
            label="Espositore"
            value={profilo.espositore_1}
            options={ESPOSITORE_OPTIONS}
            inputClassName={inputClassName}
            qtaName="espositore_1_qta"
            qtaValue={profilo.espositore_1_qta ?? null}
          />
          <SelectCampo
            name="espositore_2"
            label="Espositore"
            value={profilo.espositore_2}
            options={ESPOSITORE_OPTIONS}
            inputClassName={inputClassName}
            qtaName="espositore_2_qta"
            qtaValue={profilo.espositore_2_qta ?? null}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Box Show Room</p>
        <p className="text-xs opacity-70 mb-2">Quattro scelte singole (01–04) con quantità.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectCampo
            name="box_show_room_1"
            label="Box Show Room 01"
            value={profilo.box_show_room_1}
            options={BOX_SHOW_ROOM_OPTIONS}
            inputClassName={inputClassName}
            qtaName="box_show_room_1_qta"
            qtaValue={profilo.box_show_room_1_qta ?? null}
          />
          <SelectCampo
            name="box_show_room_2"
            label="Box Show Room 02"
            value={profilo.box_show_room_2}
            options={BOX_SHOW_ROOM_OPTIONS}
            inputClassName={inputClassName}
            qtaName="box_show_room_2_qta"
            qtaValue={profilo.box_show_room_2_qta ?? null}
          />
          <SelectCampo
            name="box_show_room_3"
            label="Box Show Room 03"
            value={profilo.box_show_room_3}
            options={BOX_SHOW_ROOM_OPTIONS}
            inputClassName={inputClassName}
            qtaName="box_show_room_3_qta"
            qtaValue={profilo.box_show_room_3_qta ?? null}
          />
          <SelectCampo
            name="box_show_room_4"
            label="Box Show Room 04"
            value={profilo.box_show_room_4}
            options={BOX_SHOW_ROOM_OPTIONS}
            inputClassName={inputClassName}
            qtaName="box_show_room_4_qta"
            qtaValue={profilo.box_show_room_4_qta ?? null}
          />
        </div>
      </div>
    </div>
  )
}
