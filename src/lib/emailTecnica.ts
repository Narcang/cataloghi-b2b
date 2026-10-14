const DOMINIO_EMAIL_TECNICA = '@manuale.ladiva.local'

/** Account creato a mano senza indirizzo reale: non è un’email di login. */
export function isEmailTecnica(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase().endsWith(DOMINIO_EMAIL_TECNICA)
}

export function ruoloConEmailDiLogin(ruolo: string | null | undefined): boolean {
  return ruolo === 'distributore' || ruolo === 'studio' || ruolo === 'studio_associato'
}
