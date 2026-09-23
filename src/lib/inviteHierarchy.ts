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
