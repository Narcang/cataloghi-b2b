'use client'

import type { AgenziaProfiloCampi } from '@/lib/agenziaProfiloOptions'
import type { OpzioniSpecializzazioneMap } from '@/lib/profiloSpecializzazioneOpzioni'
import ProfiloOpzioniCategoriaAdmin from '@/components/admin/ProfiloOpzioniCategoriaAdmin'
import ProfiloSelectCampo from '@/components/admin/ProfiloSelectCampo'

type Props = {
  profilo: AgenziaProfiloCampi
  inputClassName?: string
  opzioni: OpzioniSpecializzazioneMap
  canManageOpzioni?: boolean
  onOpzioniChange?: (opzioni: OpzioniSpecializzazioneMap) => void
}

export default function AgenziaProfiloCampi({
  profilo,
  inputClassName = 'mt-1 w-full h-9 rounded-md border border-black bg-zinc-50 px-2 text-sm',
  opzioni,
  canManageOpzioni = false,
  onOpzioniChange,
}: Props) {
  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-black/20 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Strumenti lavoro agente e Cataloghi</p>
        <p className="text-xs opacity-80 mt-0.5">
          Solo per profili Agenzia — scelta singola, quantità e data per ogni voce.
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Strumenti lavoro agente</p>
        {canManageOpzioni && onOpzioniChange ? (
          <ProfiloOpzioniCategoriaAdmin
            categoria="campioni"
            opzioni={opzioni.campioni}
            onOpzioniChange={onOpzioniChange}
          />
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ProfiloSelectCampo
            name="agenzia_campione_1"
            label="Strumento"
            value={profilo.agenzia_campione_1}
            options={opzioni.campioni}
            inputClassName={inputClassName}
            qtaName="agenzia_campione_1_qta"
            qtaValue={profilo.agenzia_campione_1_qta ?? null}
            dataName="agenzia_campione_1_data"
            dataValue={profilo.agenzia_campione_1_data ?? null}
          />
          <ProfiloSelectCampo
            name="agenzia_campione_2"
            label="Strumento"
            value={profilo.agenzia_campione_2}
            options={opzioni.campioni}
            inputClassName={inputClassName}
            qtaName="agenzia_campione_2_qta"
            qtaValue={profilo.agenzia_campione_2_qta ?? null}
            dataName="agenzia_campione_2_data"
            dataValue={profilo.agenzia_campione_2_data ?? null}
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase opacity-90 mb-2">Cataloghi</p>
        {canManageOpzioni && onOpzioniChange ? (
          <ProfiloOpzioniCategoriaAdmin
            categoria="cataloghi"
            opzioni={opzioni.cataloghi}
            onOpzioniChange={onOpzioniChange}
          />
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ProfiloSelectCampo
            name="agenzia_catalogo_1"
            label="Catalogo"
            value={profilo.agenzia_catalogo_1}
            options={opzioni.cataloghi}
            inputClassName={inputClassName}
            qtaName="agenzia_catalogo_1_qta"
            qtaValue={profilo.agenzia_catalogo_1_qta ?? null}
            dataName="agenzia_catalogo_1_data"
            dataValue={profilo.agenzia_catalogo_1_data ?? null}
          />
          <ProfiloSelectCampo
            name="agenzia_catalogo_2"
            label="Catalogo"
            value={profilo.agenzia_catalogo_2}
            options={opzioni.cataloghi}
            inputClassName={inputClassName}
            qtaName="agenzia_catalogo_2_qta"
            qtaValue={profilo.agenzia_catalogo_2_qta ?? null}
            dataName="agenzia_catalogo_2_data"
            dataValue={profilo.agenzia_catalogo_2_data ?? null}
          />
          <ProfiloSelectCampo
            name="agenzia_catalogo_3"
            label="Catalogo"
            value={profilo.agenzia_catalogo_3}
            options={opzioni.cataloghi}
            inputClassName={inputClassName}
            qtaName="agenzia_catalogo_3_qta"
            qtaValue={profilo.agenzia_catalogo_3_qta ?? null}
            dataName="agenzia_catalogo_3_data"
            dataValue={profilo.agenzia_catalogo_3_data ?? null}
          />
          <ProfiloSelectCampo
            name="agenzia_catalogo_4"
            label="Catalogo"
            value={profilo.agenzia_catalogo_4}
            options={opzioni.cataloghi}
            inputClassName={inputClassName}
            qtaName="agenzia_catalogo_4_qta"
            qtaValue={profilo.agenzia_catalogo_4_qta ?? null}
            dataName="agenzia_catalogo_4_data"
            dataValue={profilo.agenzia_catalogo_4_data ?? null}
          />
        </div>
      </div>
    </div>
  )
}
