/** Ruoli che ogni ruolo può invitare (gerarchia discendente). */
export const INVITA_RUOLI_DISPONIBILI: Record<string, string[]> = {
  admin:        ['manager', 'agente', 'distributore', 'studio', 'partner_dipendente'],
  manager:      ['agente', 'distributore', 'studio', 'partner_dipendente'],
  agente:       ['distributore', 'studio', 'partner_dipendente'],
  distributore: ['studio', 'partner_dipendente'],
}

/** Etichette UI per i ruoli invitabili. */
export const RUOLO_LABEL: Record<string, string> = {
  manager:            'Manager',
  agente:             'Agente',
  distributore:       'Partner',
  studio:             'Studio',
  partner_dipendente: 'Partner Dipendenti',
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
