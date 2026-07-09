/** Ruoli che possono essere assegnati come visibilità di un catalogo. */
export const RUOLI_CATALOGO = [
  { value: 'free',               label: 'Pubblico (ospiti / Free)' },
  { value: 'studio',             label: 'Studio' },
  { value: 'partner_dipendente', label: 'Promoter' },
  { value: 'distributore',       label: 'Venditori' },
  { value: 'rivenditore',        label: 'Rivenditori' },
  { value: 'agente',             label: 'Agente' },
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

/** Ruoli di default per un nuovo catalogo (tutti tranne free/pubblico). */
export const RUOLI_CATALOGO_DEFAULT: RuoloCatalogo[] = [
  'agente', 'agenzia', 'distributore', 'rivenditore', 'studio', 'partner_dipendente', 'manager',
]
