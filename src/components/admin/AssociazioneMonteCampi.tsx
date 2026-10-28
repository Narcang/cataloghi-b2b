'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  fasceAssociazione,
  personeFascia,
  sediFascia,
  selezioneFascia,
  type FasciaAssociazione,
} from '@/lib/associazioneMonte'
import { profiloGerarchiaDisplayLabel, type ProfiloGerarchiaRow } from '@/lib/userHierarchy'

type Props = {
  profilo: ProfiloGerarchiaRow
  profili: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  ruoloLabel: (ruolo: string) => string
  personaLabel: string
  inputClassName: string
}

function etichettaPersona(fascia: FasciaAssociazione, personaLabel: string): string {
  if (fascia.personaRuoli.includes('distributore') || fascia.personaRuoli.includes('partner_dipendente')) {
    return 'Venditori e promoter'
  }
  return personaLabel
}

function RigaFascia({
  fascia,
  profilo,
  profili,
  links,
  ruoloLabel,
  personaLabel,
  inputClassName,
}: Props & { fascia: FasciaAssociazione }) {
  const attuale = useMemo(
    () => selezioneFascia(fascia, profilo, profili, links),
    [fascia, profilo, profili, links],
  )
  const [sedeId, setSedeId] = useState(attuale.sedeId ?? '')
  const [personaId, setPersonaId] = useState(attuale.personaId ?? '')

  useEffect(() => {
    setSedeId(attuale.sedeId ?? '')
    setPersonaId(attuale.personaId ?? '')
  }, [attuale.sedeId, attuale.personaId, profilo.id, fascia.id])

  const sedi = useMemo(() => {
    const lista = sediFascia(fascia, profilo, profili, ruoloLabel)
    if (attuale.sedeId && !lista.some((sede) => sede.id === attuale.sedeId)) {
      const extra = profili.find((p) => p.id === attuale.sedeId)
      if (extra) {
        lista.unshift({
          id: extra.id,
          ruolo: extra.ruolo,
          label: `${profiloGerarchiaDisplayLabel(extra)} · ${ruoloLabel(extra.ruolo)}`,
        })
      }
    }
    return lista
  }, [fascia, profilo, profili, ruoloLabel, attuale.sedeId])

  const conPersona = fascia.personaRuoli.length > 0
  const persone = useMemo(() => {
    if (!conPersona || !sedeId) return []
    const includi = sedeId === (attuale.sedeId ?? '') ? attuale.personaId : null
    return personeFascia(fascia, sedeId, profilo, profili, links, ruoloLabel, includi)
  }, [conPersona, sedeId, fascia, profilo, profili, links, ruoloLabel, attuale.sedeId, attuale.personaId])

  function cambiaSede(next: string) {
    setSedeId(next)
    if (!next) {
      setPersonaId('')
      return
    }
    const includi = next === (attuale.sedeId ?? '') ? attuale.personaId : null
    const opzioni = personeFascia(fascia, next, profilo, profili, links, ruoloLabel, includi)
    if (!opzioni.some((p) => p.id === personaId)) setPersonaId('')
  }

  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="block text-xs font-medium uppercase text-zinc-600">
        {ruoloLabel(fascia.sedeRuolo)}
        <select
          name={`fascia_${fascia.id}_sede`}
          value={sedeId}
          onChange={(e) => cambiaSede(e.target.value)}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={inputClassName}
        >
          <option value="">Nessuno</option>
          {sedi.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.label}
            </option>
          ))}
        </select>
      </label>
      {conPersona ? (
        <label className="block text-xs font-medium uppercase text-zinc-600">
          {etichettaPersona(fascia, personaLabel)}
          <select
            name={`fascia_${fascia.id}_persona`}
            value={persone.some((p) => p.id === personaId) ? personaId : ''}
            onChange={(e) => setPersonaId(e.target.value)}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!sedeId}
            className={inputClassName}
          >
            <option value="">Nessuno</option>
            {persone.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name={`fascia_${fascia.id}_persona`} value="" />
      )}
    </div>
  )
}

export default function AssociazioneMonteCampi(props: Props) {
  const fasce = fasceAssociazione(props.profilo.ruolo)
  if (fasce.length === 0) return null

  return (
    <div className="md:col-span-2 space-y-3">
      <input type="hidden" name="fascia_associazione" value="1" />
      {fasce.map((fascia) => (
        <RigaFascia key={fascia.id} fascia={fascia} {...props} />
      ))}
    </div>
  )
}
