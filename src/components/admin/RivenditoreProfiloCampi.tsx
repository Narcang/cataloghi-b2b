'use client'

import type { RivenditoreProfiloCampi as RivenditoreProfiloCampiValues } from '@/lib/rivenditoreProfiloOptions'
import type { OpzioniSpecializzazioneMap } from '@/lib/profiloSpecializzazioneOpzioni'
import ProfiloOpzioniCategoriaAdmin from '@/components/admin/ProfiloOpzioniCategoriaAdmin'
import ProfiloSelectCampo from '@/components/admin/ProfiloSelectCampo'

type Props = {
  profilo: Omit<RivenditoreProfiloCampiValues, 'seguito_da'>
  inputClassName?: string
  opzioni: OpzioniSpecializzazioneMap
  canManageOpzioni?: boolean
  onOpzioniChange?: (opzioni: OpzioniSpecializzazioneMap) => void
}

export default function RivenditoreProfiloCampi({
  profilo,
  inputClassName = 'mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm',
  opzioni,
  canManageOpzioni = false,
  onOpzioniChange,
}: Props) {
  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-black/20 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Espositori e Box Show Room</p>
        <p className="text-xs opacity-80 mt-0.5">
          Solo per profili Rivenditori — scelta singola, quantità e data per ogni voce.
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Espositori</p>
        {canManageOpzioni && onOpzioniChange ? (
          <ProfiloOpzioniCategoriaAdmin
            categoria="espositori"
            opzioni={opzioni.espositori}
            onOpzioniChange={onOpzioniChange}
          />
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ProfiloSelectCampo
            name="espositore_1"
            label="Espositore"
            value={profilo.espositore_1}
            options={opzioni.espositori}
            inputClassName={inputClassName}
            qtaName="espositore_1_qta"
            qtaValue={profilo.espositore_1_qta ?? null}
            dataName="espositore_1_data"
            dataValue={profilo.espositore_1_data ?? null}
          />
          <ProfiloSelectCampo
            name="espositore_2"
            label="Espositore"
            value={profilo.espositore_2}
            options={opzioni.espositori}
            inputClassName={inputClassName}
            qtaName="espositore_2_qta"
            qtaValue={profilo.espositore_2_qta ?? null}
            dataName="espositore_2_data"
            dataValue={profilo.espositore_2_data ?? null}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Box Show Room</p>
        <p className="text-xs opacity-70 mb-2">Quattro scelte singole (01–04) con quantità e data.</p>
        {canManageOpzioni && onOpzioniChange ? (
          <ProfiloOpzioniCategoriaAdmin
            categoria="box"
            opzioni={opzioni.box}
            onOpzioniChange={onOpzioniChange}
          />
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ProfiloSelectCampo
            name="box_show_room_1"
            label="Box Show Room 01"
            value={profilo.box_show_room_1}
            options={opzioni.box}
            inputClassName={inputClassName}
            qtaName="box_show_room_1_qta"
            qtaValue={profilo.box_show_room_1_qta ?? null}
            dataName="box_show_room_1_data"
            dataValue={profilo.box_show_room_1_data ?? null}
          />
          <ProfiloSelectCampo
            name="box_show_room_2"
            label="Box Show Room 02"
            value={profilo.box_show_room_2}
            options={opzioni.box}
            inputClassName={inputClassName}
            qtaName="box_show_room_2_qta"
            qtaValue={profilo.box_show_room_2_qta ?? null}
            dataName="box_show_room_2_data"
            dataValue={profilo.box_show_room_2_data ?? null}
          />
          <ProfiloSelectCampo
            name="box_show_room_3"
            label="Box Show Room 03"
            value={profilo.box_show_room_3}
            options={opzioni.box}
            inputClassName={inputClassName}
            qtaName="box_show_room_3_qta"
            qtaValue={profilo.box_show_room_3_qta ?? null}
            dataName="box_show_room_3_data"
            dataValue={profilo.box_show_room_3_data ?? null}
          />
          <ProfiloSelectCampo
            name="box_show_room_4"
            label="Box Show Room 04"
            value={profilo.box_show_room_4}
            options={opzioni.box}
            inputClassName={inputClassName}
            qtaName="box_show_room_4_qta"
            qtaValue={profilo.box_show_room_4_qta ?? null}
            dataName="box_show_room_4_data"
            dataValue={profilo.box_show_room_4_data ?? null}
          />
        </div>
      </div>
    </div>
  )
}
