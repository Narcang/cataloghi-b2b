'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  associazioneMonteAttuale,
  haPersonaAssociazione,
  personeDisponibili,
  sediDisponibili,
} from '@/lib/associazioneMonte'
import { profiloGerarchiaDisplayLabel, type ProfiloGerarchiaRow } from '@/lib/userHierarchy'

type Props = {
  profilo: ProfiloGerarchiaRow
  profili: ProfiloGerarchiaRow[]
  links: { utente_id: string; operatore_id: string }[]
  ruoloLabel: (ruolo: string) => string
  sedeLabel: string
  sedeVuotaLabel: string
  personaLabel: string
  personaVuotaLabel: string
  inputClassName: string
}

export default function AssociazioneMonteCampi({
  profilo,
  profili,
  links,
  ruoloLabel,
  sedeLabel,
  sedeVuotaLabel,
  personaLabel,
  personaVuotaLabel,
  inputClassName,
}: Props) {
  const attuale = useMemo(
    () => associazioneMonteAttuale(profilo, profili, links),
    [profilo, profili, links],
  )
  const [sedeId, setSedeId] = useState(attuale.sedeId ?? '')
  const [personaId, setPersonaId] = useState(attuale.personaId ?? '')

  useEffect(() => {
    setSedeId(attuale.sedeId ?? '')
    setPersonaId(attuale.personaId ?? '')
  }, [attuale.sedeId, attuale.personaId, profilo.id])

  const sedi = useMemo(() => {
    const lista = sediDisponibili(profilo, profili, ruoloLabel)
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
  }, [profilo, profili, ruoloLabel, attuale.sedeId])
  const conPersona = haPersonaAssociazione(profilo.ruolo)
  const persone = useMemo(() => {
    if (!conPersona || !sedeId) return []
    const includi = sedeId === (attuale.sedeId ?? '') ? attuale.personaId : null
    return personeDisponibili(profilo, sedeId, profili, links, ruoloLabel, includi)
  }, [conPersona, sedeId, profilo, profili, links, ruoloLabel, attuale.sedeId, attuale.personaId])

  function cambiaSede(next: string) {
    setSedeId(next)
    if (!next) {
      setPersonaId('')
      return
    }
    const includi = next === (attuale.sedeId ?? '') ? attuale.personaId : null
    const opzioni = personeDisponibili(profilo, next, profili, links, ruoloLabel, includi)
    if (!opzioni.some((p) => p.id === personaId)) setPersonaId('')
  }

  const sedeScelta = sedi.find((sede) => sede.id === sedeId)
  const etichettaCollegamento = sedeScelta ? ruoloLabel(sedeScelta.ruolo) : sedeLabel

  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="block text-xs font-medium uppercase text-zinc-600">
        {etichettaCollegamento}
        <select
          name="monte_sede_id"
          value={sedeId}
          onChange={(e) => cambiaSede(e.target.value)}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={inputClassName}
        >
          <option value="">{sedeVuotaLabel}</option>
          {sedi.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.label}
            </option>
          ))}
        </select>
      </label>
      {conPersona ? (
        <label className="block text-xs font-medium uppercase text-zinc-600">
          {personaLabel}
          <select
            name="monte_persona_id"
            value={persone.some((p) => p.id === personaId) ? personaId : ''}
            onChange={(e) => setPersonaId(e.target.value)}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!sedeId}
            className={inputClassName}
          >
            <option value="">{personaVuotaLabel}</option>
            {persone.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="monte_persona_id" value="" />
      )}
    </div>
  )
}
