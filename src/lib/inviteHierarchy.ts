import {
  getChildrenProfiles,
  profiloGerarchiaDisplayLabel,
  type ProfiloGerarchiaRow,
} from '@/lib/userHierarchy'

type LinkOperatore = { utente_id: string; operatore_id: string }

/** Operatori diretti che si possono scegliere sotto una sede, nell'invito. */
export const OPERATORI_INVITO_PER_SEDE: Record<string, readonly string[]> = {
  agenzia: ['agente', 'back_office'],
  rivenditore: ['distributore', 'partner_dipendente'],
  studio: ['studio_associato'],
}

export function buildOperatoriInvitoMap(
  profili: ProfiloGerarchiaRow[],
  links: LinkOperatore[],
  viewerId: string,
  viewerRole: string,
): Record<string, { id: string; label: string }[]> {
  const map: Record<string, { id: string; label: string }[]> = {}
  for (const [sedeRuolo, figliRuoli] of Object.entries(OPERATORI_INVITO_PER_SEDE)) {
    for (const sede of profili.filter((p) => p.ruolo === sedeRuolo)) {
      map[sede.id] = getChildrenProfiles(sede.id, sede, viewerId, viewerRole, profili, links)
        .filter((p) => figliRuoli.includes(p.ruolo))
        .map((p) => ({
          id: p.id,
          label:
            p.ruolo === 'back_office'
              ? `${profiloGerarchiaDisplayLabel(p)} · Back-Office`
              : p.ruolo === 'partner_dipendente'
                ? `${profiloGerarchiaDisplayLabel(p)} · Promoter`
                : profiloGerarchiaDisplayLabel(p),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'it', { sensitivity: 'base' }))
    }
  }
  return map
}

/** True se l'operatore è un figlio diretto di una delle sedi consentite. */
export function operatoreAppartieneASede(
  operatoreId: string,
  sedeRuolo: string,
  sedi: ProfiloGerarchiaRow[],
  profili: ProfiloGerarchiaRow[],
  links: LinkOperatore[],
  viewerId: string,
  viewerRole: string,
): boolean {
  const figli = OPERATORI_INVITO_PER_SEDE[sedeRuolo] ?? []
  for (const sede of sedi) {
    if (sede.ruolo !== sedeRuolo) continue
    const children = getChildrenProfiles(sede.id, sede, viewerId, viewerRole, profili, links)
    if (children.some((child) => child.id === operatoreId && figli.includes(child.ruolo))) return true
  }
  return false
}

/** Ruoli che ogni ruolo può invitare (gerarchia discendente). */
export const INVITA_RUOLI_DISPONIBILI: Record<string, string[]> = {
  admin:              ['manager', 'agente', 'back_office', 'distributore', 'partner_dipendente', 'studio_associato'],
  manager:            ['agente', 'back_office', 'distributore', 'partner_dipendente', 'studio_associato'],
  agenzia:            ['agente', 'distributore', 'studio_associato'],
  agente:             ['agente', 'distributore', 'studio_associato'],
  back_office:        ['agente', 'back_office', 'distributore', 'studio_associato'],
  rivenditore:        ['distributore', 'partner_dipendente', 'studio_associato'],
  distributore:       ['distributore', 'partner_dipendente', 'studio_associato'],
  studio:             ['studio_associato'],
}

/** Categoria (entità) da mostrare tra parentesi nel menu inviti. */
export const INVITO_CATEGORIA_PARENT: Record<string, string> = {
  agente: 'agenzia',
  back_office: 'agenzia',
  distributore: 'rivenditore',
  partner_dipendente: 'rivenditore',
  studio_associato: 'studio',
}

/** Etichette UI per i ruoli invitabili (fallback italiano). */
export const RUOLO_LABEL: Record<string, string> = {
  manager:            'Manager',
  agenzia:            'Agenzia',
  agente:             'Agente',
  back_office:        'Back-Office',
  rivenditore:        'Rivenditori',
  distributore:       'Venditori',
  studio:             'Sede Studio',
  studio_associato:   'Studio',
  partner_dipendente: 'Promoter',
}

/** Restituisce i ruoli che `ruolo` può invitare, con etichette. */
export function ruoliInvitabili(ruolo: string): { value: string; label: string }[] {
  const disponibili = INVITA_RUOLI_DISPONIBILI[ruolo] ?? []
  return disponibili.map((v) => ({ value: v, label: RUOLO_LABEL[v] ?? v }))
}

/** Verifica che `ruoloInvitante` possa invitare `ruoloInvitato`. */
export function puoInvitare(ruoloInvitante: string, ruoloInvitato: string): boolean {
  return (INVITA_RUOLI_DISPONIBILI[ruoloInvitante] ?? []).includes(ruoloInvitato)
}
