import Link from 'next/link'
import { register } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { createServiceRoleSupabase } from '@/utils/supabase/service-role'
import { RUOLO_LABEL } from '@/lib/inviteHierarchy'

async function fetchInvito(token: string): Promise<{ ruolo_invitato: string; creato_da: string } | null> {
  if (!token || token.length < 10) return null
  const svc = createServiceRoleSupabase()
  if (!svc) return null
  const { data } = await svc
    .from('inviti')
    .select('ruolo_invitato, creato_da, usato')
    .eq('token', token)
    .single()
  if (!data || data.usato) return null
  return { ruolo_invitato: data.ruolo_invitato, creato_da: data.creato_da }
}

export default async function RegistrazionePage(props: {
  searchParams: Promise<{ message?: string; ok?: string; token?: string }>
}) {
  const searchParams = await props.searchParams
  const ok = searchParams?.ok === '1'
  const message = searchParams?.message ?? ''
  const tokenRaw = (searchParams?.token ?? '').trim()

  const invito = tokenRaw ? await fetchInvito(tokenRaw) : null
  const ruoloPreassegnato = invito?.ruolo_invitato ?? null
  const ruoloLabel = ruoloPreassegnato ? (RUOLO_LABEL[ruoloPreassegnato] ?? ruoloPreassegnato) : null

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="w-full max-w-[1200px] mx-auto px-6 py-10 md:py-14 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg border border-black bg-white shadow-sm">
          <form action={register}>
            {/* Token nascosto */}
            {tokenRaw && <input type="hidden" name="invito_token" value={tokenRaw} />}

            <CardHeader>
              <CardTitle className="text-2xl text-zinc-900">Registrazione portale</CardTitle>
              <CardDescription className="text-zinc-600">
                {ruoloLabel
                  ? `Sei stato invitato come ${ruoloLabel}. Compila il modulo per completare la registrazione.`
                  : 'Compila il modulo: un amministratore confermerà il tuo account prima dell\'accesso completo ai cataloghi riservati.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {ruoloLabel && (
                <div className="rounded-lg border border-[#060d41]/20 bg-[#060d41]/5 px-3 py-2 text-sm text-[#060d41] font-medium">
                  Ruolo assegnato: <span className="font-bold">{ruoloLabel}</span>
                </div>
              )}

              {tokenRaw && !invito && !ok && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Il link di invito non è valido o è già stato utilizzato. Puoi comunque registrarti normalmente.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" name="nome" type="text" autoComplete="given-name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cognome">Cognome</Label>
                  <Input id="cognome" name="cognome" type="text" autoComplete="family-name" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="societa">Società</Label>
                <Input id="societa" name="societa" type="text" autoComplete="organization" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="nome@azienda.it" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Numero di telefono</Label>
                <Input id="telefono" name="telefono" type="tel" autoComplete="tel" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                <p className="text-xs text-zinc-500">Minimo 8 caratteri.</p>
              </div>

              {ok ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  Richiesta inviata. Se l&apos;email di conferma è attiva sul portale, controlla la casella di posta;
                  dopo la conferma l&apos;account resterà in attesa di approvazione da un amministratore.
                </div>
              ) : null}

              {message && !ok ? (
                <div className="text-sm text-red-600 font-medium">{message}</div>
              ) : null}

              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="consenso"
                  name="consenso"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-[#060d41]"
                />
                <label htmlFor="consenso" className="text-sm text-zinc-600 leading-snug">
                  Ho letto e accetto la{' '}
                  <Link href="/privacy" target="_blank" className="underline text-[#060d41] hover:text-[#0a155a]">Privacy Policy</Link>,
                  i{' '}
                  <Link href="/termini" target="_blank" className="underline text-[#060d41] hover:text-[#0a155a]">Termini e Condizioni</Link>
                  {' '}e la{' '}
                  <Link href="/cookie" target="_blank" className="underline text-[#060d41] hover:text-[#0a155a]">Cookie Policy</Link>.
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full bg-[#060d41] text-white hover:bg-[#0a155a]" type="submit">
                {invito ? 'Registrati' : 'Invia richiesta di registrazione'}
              </Button>
              <p className="text-xs text-zinc-500 text-center">
                {invito
                  ? 'La registrazione sarà confermata automaticamente e potrai accedere subito.'
                  : "In seguito potremo chiedere ulteriori informazioni: i dati extra saranno gestiti da questo modulo o dal profilo dopo l'approvazione."}
              </p>
              <Link
                href="/login"
                className="w-full h-9 inline-flex items-center justify-center rounded-lg border border-[#060d41] text-sm font-medium text-[#060d41] hover:bg-[#060d41]/5 transition-colors"
              >
                Hai già un account? Accedi
              </Link>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip">
        <div className="ladiva-home-footer-inner">
          <p className="text-sm max-w-3xl mx-auto text-center">
            © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
            {' · '}
            <Link href="/" className="ladiva-footer-link whitespace-nowrap">
              ← Torna alla Home Pubblica
            </Link>
          </p>
          <p className="text-xs mt-2 max-w-3xl mx-auto text-center opacity-70">
            <Link href="/privacy" className="ladiva-footer-link">Privacy Policy</Link>
            {' · '}
            <Link href="/termini" className="ladiva-footer-link">Termini e Condizioni</Link>
            {' · '}
            <Link href="/cookie" className="ladiva-footer-link">Cookie Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
