const DOMINIO_EMAIL_TECNICA = '@manuale.ladiva.local'

/** Account creato a mano senza indirizzo reale: non è un’email di login. */
export function isEmailTecnica(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase().endsWith(DOMINIO_EMAIL_TECNICA)
}

/** Ruoli di cui si può impostare email e password di accesso dalla scheda. L’admin resta fuori. */
const RUOLI_EMAIL_LOGIN = new Set([
  'manager',
  'agenzia',
  'agente',
  'back_office',
  'fornitore',
  'rivenditore',
  'distributore',
  'free',
  'studio',
  'studio_associato',
  'partner_dipendente',
])

export function ruoloConEmailDiLogin(ruolo: string | null | undefined): boolean {
  return RUOLI_EMAIL_LOGIN.has(ruolo ?? '')
}
