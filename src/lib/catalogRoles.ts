/** Ruoli che possono essere assegnati come visibilità di un catalogo. */
export const RUOLI_CATALOGO = [
  { value: 'free',         label: 'Pubblico (ospiti / Free)' },
  { value: 'studio',       label: 'Studio' },
  { value: 'distributore', label: 'Partner' },
  { value: 'agente',       label: 'Agente' },
  { value: 'manager',      label: 'Manager' },
] as const

export type RuoloCatalogo = (typeof RUOLI_CATALOGO)[number]['value']

/** Ruoli di default per un nuovo catalogo (tutti tranne free/pubblico). */
export const RUOLI_CATALOGO_DEFAULT: RuoloCatalogo[] = [
  'agente', 'distributore', 'studio', 'manager',
]
