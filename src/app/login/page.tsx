import Link from 'next/link'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#fafafa]">
      <Card className="w-full max-w-sm border border-black bg-white shadow-sm">
        <form action={login}>
          <CardHeader>
            <CardTitle className="text-2xl text-zinc-900">Accesso Agenti</CardTitle>
            <CardDescription className="text-zinc-600">
              Inserisci le tue credenziali per visualizzare i cataloghi B2B e gestire i fornitori.
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
              Accedi al Portale
            </Button>
            <Link
              href="/recupero-password"
              className="w-full h-8 inline-flex items-center justify-center rounded-lg border border-[#060d41] text-sm font-medium text-[#060d41] hover:bg-[#060d41]/5 transition-colors"
            >
              Recupera password
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
