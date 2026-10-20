'use client'

import { useId, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AgenziaProfiloCampi } from '@/lib/agenziaProfiloOptions'
import type { OpzioniSpecializzazioneMap } from '@/lib/profiloSpecializzazioneOpzioni'
import ProfiloOpzioniCategoriaAdmin from '@/components/admin/ProfiloOpzioniCategoriaAdmin'
import ProfiloSelectCampo from '@/components/admin/ProfiloSelectCampo'
import { tAdmin } from '@/lib/i18nAdmin'
import { useAppLocale } from '@/lib/useAppLocale'

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
  const locale = useAppLocale()
  const copy = tAdmin(locale)
  const [aperto, setAperto] = useState(false)
  const panelId = useId()

  return (
    <div className="md:col-span-2 rounded-lg border border-black/20">
      <button
        type="button"
        aria-expanded={aperto}
        aria-controls={panelId}
        onClick={() => setAperto((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#060d41]"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            {aperto ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
            Strumenti lavoro agente e Cataloghi
          </span>
          <span className="mt-0.5 block pl-6 text-xs opacity-80">
            Solo per profili Agenzia — scelta singola, quantità e data per ogni voce.
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold">
          {aperto ? copy.chiudiElenco : copy.apriElenco}
        </span>
      </button>
      <div id={panelId} className={aperto ? 'space-y-4 px-4 pb-4' : 'hidden'}>
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
    </div>
  )
}
