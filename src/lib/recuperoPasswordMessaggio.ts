export function messaggioErroreRecupero(message: string): string {
  if (/rate limit/i.test(message)) {
    return 'Supabase ha raggiunto il limite orario di email. La richiesta precedente è partita; le successive vengono bloccate per circa un’ora. Per non aspettare, in Gestione utenti usa «Genera link password»: non cambia il ruolo.'
  }
  return `Invio non riuscito: ${message}`
}
