/** Ruoli che possono essere assegnati come visibilità di un catalogo. */
export const RUOLI_CATALOGO = [
  { value: 'free',               label: 'Pubblico (ospiti / Free)' },
  { value: 'studio',             label: 'Studio' },
  { value: 'partner_dipendente', label: 'Venditori Dipendenti' },
  { value: 'distributore',       label: 'Venditori' },
  { value: 'agente',             label: 'Agente' },
  { value: 'agenzia',            label: 'Agenzia' },
  { value: 'manager',            label: 'Manager' },
] as const

export type RuoloCatalogo = (typeof RUOLI_CATALOGO)[number]['value']

/** Ruoli di default per un nuovo catalogo (tutti tranne free/pubblico). */
export const RUOLI_CATALOGO_DEFAULT: RuoloCatalogo[] = [
  'agente', 'agenzia', 'distributore', 'studio', 'partner_dipendente', 'manager',
]
