'use client'

import Link from 'next/link'
import { register } from '@/app/registrazione/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { tHome, tRegistrazione } from '@/lib/i18n'
import { tRuolo } from '@/lib/i18nAdmin'
import type { AppLocale } from '@/lib/locale'
import { useAppLocale } from '@/lib/useAppLocale'

function flashMessage(copy: ReturnType<typeof tRegistrazione>, message: string): string {
  const known: Record<string, string> = {
    consenso: copy.errConsenso,
    campi: copy.errCampi,
    password: copy.errPassword,
    email_exists: copy.errEmailExists,
    server: copy.errServer,
    'Devi accettare le policy per procedere.': copy.errConsenso,
    'Compila tutti i campi obbligatori.': copy.errCampi,
    'La password deve avere almeno 8 caratteri.': copy.errPassword,
    'Questa email è già registrata. Prova ad accedere o recupera la password.': copy.errEmailExists,
    'Errore di configurazione server.': copy.errServer,
  }
  return known[message] ?? message
}

export default function RegistrazioneForm({
  initialLocale,
  tokenRaw,
  hasInvito,
  ruoloKey,
  ok,
  message,
}: {
  initialLocale: AppLocale
  tokenRaw: string
  hasInvito: boolean
  ruoloKey: string | null
  ok: boolean
  message: string
}) {
  const locale = useAppLocale(initialLocale)
  const copy = tRegistrazione(locale)
  const homeCopy = tHome(locale)
  const ruoloLabel = ruoloKey ? tRuolo(locale, ruoloKey) : null
  const flash = message && !ok ? flashMessage(copy, message) : ''

  return (
    <>
      <main className="w-full max-w-[1200px] mx-auto px-6 py-10 md:py-14 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg border border-black bg-white shadow-sm">
          <form action={register}>
            {tokenRaw ? <input type="hidden" name="invito_token" value={tokenRaw} /> : null}

            <CardHeader>
              <CardTitle className="text-2xl text-zinc-900">{copy.titolo}</CardTitle>
              <CardDescription className="text-zinc-600">
                {ruoloLabel
                  ? copy.invitatoCome.replace('{ruolo}', ruoloLabel)
                  : copy.descrizione}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {ruoloLabel ? (
                <div className="rounded-lg border border-[#060d41]/20 bg-[#060d41]/5 px-3 py-2 text-sm text-[#060d41] font-medium">
                  {copy.ruoloAssegnato}{' '}
                  <span className="font-bold">{ruoloLabel}</span>
                </div>
              ) : null}

              {tokenRaw && !hasInvito && !ok ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {copy.invitoInvalido}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">{copy.nome}</Label>
                  <Input id="nome" name="nome" type="text" autoComplete="given-name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cognome">{copy.cognome}</Label>
                  <Input id="cognome" name="cognome" type="text" autoComplete="family-name" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="societa">{copy.societa}</Label>
                <Input id="societa" name="societa" type="text" autoComplete="organization" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={copy.emailPlaceholder}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">{copy.telefono}</Label>
                <Input id="telefono" name="telefono" type="tel" autoComplete="tel" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{copy.password}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <p className="text-xs text-zinc-500">{copy.passwordHelp}</p>
              </div>

              {ok ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  {copy.ok}
                </div>
              ) : null}

              {flash ? (
                <div className="text-sm text-red-600 font-medium">{flash}</div>
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
                  {copy.consensoPrima}{' '}
                  <Link href="/privacy" target="_blank" className="underline text-[#060d41] hover:text-[#0a155a]">
                    {homeCopy.privacy}
                  </Link>
                  ,{copy.consensoTermini ? ` ${copy.consensoTermini} ` : ' '}
                  <Link href="/termini" target="_blank" className="underline text-[#060d41] hover:text-[#0a155a]">
                    {homeCopy.termini}
                  </Link>{' '}
                  {copy.consensoE}{' '}
                  <Link href="/cookie" target="_blank" className="underline text-[#060d41] hover:text-[#0a155a]">
                    {homeCopy.cookie}
                  </Link>
                  .
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full bg-[#060d41] text-white hover:bg-[#0a155a]" type="submit">
                {hasInvito ? copy.submitInvito : copy.submit}
              </Button>
              <p className="text-xs text-zinc-500 text-center">
                {hasInvito ? copy.notaInvito : copy.nota}
              </p>
              <Link
                href="/login"
                className="w-full h-9 inline-flex items-center justify-center rounded-lg border border-[#060d41] text-sm font-medium text-[#060d41] hover:bg-[#060d41]/5 transition-colors"
              >
                {copy.haiAccount}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip">
        <div className="ladiva-home-footer-inner">
          <p className="text-xs mb-2 max-w-3xl mx-auto text-center text-zinc-500">
            <Link href="/privacy" className="underline hover:text-zinc-800 transition-colors">
              {homeCopy.privacy}
            </Link>
            {' · '}
            <Link href="/termini" className="underline hover:text-zinc-800 transition-colors">
              {homeCopy.termini}
            </Link>
            {' · '}
            <Link href="/cookie" className="underline hover:text-zinc-800 transition-colors">
              {homeCopy.cookie}
            </Link>
          </p>
          <p className="text-sm max-w-3xl mx-auto text-center">
            © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
            {' · '}
            <Link href="/" className="ladiva-footer-link whitespace-nowrap">
              {copy.tornaHome}
            </Link>
          </p>
        </div>
      </footer>
    </>
  )
}
