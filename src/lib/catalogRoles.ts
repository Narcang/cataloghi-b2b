/** Ruoli che possono essere assegnati come visibilità di un catalogo. */
export const RUOLI_CATALOGO = [
  { value: 'free',               label: 'Pubblico (ospiti / Free)' },
  { value: 'studio',             label: 'Sede Studio' },
  { value: 'studio_associato',   label: 'Studio' },
  { value: 'partner_dipendente', label: 'Promoter' },
  { value: 'distributore',       label: 'Venditori' },
  { value: 'rivenditore',        label: 'Rivenditori' },
  { value: 'agente',             label: 'Agente' },
  { value: 'back_office',        label: 'Back-Office' },
  { value: 'agenzia',            label: 'Agenzia' },
  { value: 'manager',            label: 'Manager' },
] as const

export type RuoloCatalogo = (typeof RUOLI_CATALOGO)[number]['value']

export const RIVENDITORE_ROLE = 'rivenditore' as const

/** Venditori (distributore) e Rivenditori (rivenditore): stessi permessi portale/cataloghi. */
export const VENDITORE_LIKE_ROLES = ['distributore', 'rivenditore'] as const

export function isVenditoreLike(ruolo: string | null | undefined): boolean {
  return ruolo === 'distributore' || ruolo === 'rivenditore'
}

/** Agente e Back-Office: stessi poteri, entrambi sotto agenzia. */
export const AGENTE_LIKE_ROLES = ['agente', 'back_office'] as const

export function isAgenteLike(ruolo: string | null | undefined): boolean {
  return ruolo === 'agente' || ruolo === 'back_office'
}

/** Sede Studio (`studio`): l’entità, come l’agenzia. */
export function isSedeStudio(ruolo: string | null | undefined): boolean {
  return ruolo === 'studio'
}

/** Studio associato a una sede (`studio_associato`): come l’agente sotto agenzia. */
export function isStudioAssociato(ruolo: string | null | undefined): boolean {
  return ruolo === 'studio_associato'
}

/** Sede Studio e Studio: stessi poteri sui cataloghi. */
export function isStudioFamily(ruolo: string | null | undefined): boolean {
  return ruolo === 'studio' || ruolo === 'studio_associato'
}

/** Cataloghi “studio-like”: sede, studio associato e promoter. */
export function isStudioLike(ruolo: string | null | undefined): boolean {
  return isStudioFamily(ruolo) || ruolo === 'partner_dipendente'
}

/** Ruoli di default per un nuovo catalogo (tutti tranne free/pubblico). */
export const RUOLI_CATALOGO_DEFAULT: RuoloCatalogo[] = [
  'agente', 'back_office', 'agenzia', 'distributore', 'rivenditore', 'studio', 'studio_associato', 'partner_dipendente', 'manager',
]
