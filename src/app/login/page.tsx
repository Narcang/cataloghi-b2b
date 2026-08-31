import Link from 'next/link'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import { tHome, tLogin } from '@/lib/i18n'
import { getAppLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams
  const locale = await getAppLocale()
  const copy = tLogin(locale)
  const homeCopy = tHome(locale)

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="w-full max-w-[1200px] mx-auto px-6 py-10 md:py-14 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm border border-black bg-white shadow-sm">
          <form action={login}>
            <CardHeader>
              <CardTitle className="text-2xl text-zinc-900 text-center">{copy.titolo}</CardTitle>
              <CardDescription className="text-zinc-600">
                {copy.descrizione}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nome.cognome@azienda.it"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>

              {searchParams?.message && (
                <div className="text-sm text-red-500 font-medium mt-2 text-center">
                  {searchParams.message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full bg-[#060d41] text-white hover:bg-[#0a155a]" type="submit">
                {copy.accedi}
              </Button>
              <Link
                href="/registrazione"
                className="w-full h-9 inline-flex items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                {copy.registrazione}
              </Link>
              <Link
                href="/recupero-password"
                className="w-full h-8 inline-flex items-center justify-center rounded-lg border border-[#060d41] text-sm font-medium text-[#060d41] hover:bg-[#060d41]/5 transition-colors"
              >
                {copy.recupero}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip">
        <div className="ladiva-home-footer-inner">
          <p className="text-sm max-w-3xl mx-auto text-center mb-1">
            <Link href="/privacy" className="underline hover:text-zinc-800 transition-colors whitespace-nowrap">{homeCopy.privacy}</Link>
              {' · '}
              <Link href="/termini" className="underline hover:text-zinc-800 transition-colors whitespace-nowrap">{homeCopy.termini}</Link>
              {' · '}
              <Link href="/cookie" className="underline hover:text-zinc-800 transition-colors whitespace-nowrap">{homeCopy.cookie}</Link>
          </p>
          <p className="text-sm max-w-3xl mx-auto text-center">
            © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
            {' · '}
            <Link href="/" className="ladiva-footer-link whitespace-nowrap">
              ← Torna alla Home Pubblica
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
