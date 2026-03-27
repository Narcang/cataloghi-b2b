import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <Card className="w-full max-w-sm">
        <form action={login}>
          <CardHeader>
            <CardTitle className="text-2xl">Accesso Agenti</CardTitle>
            <CardDescription>
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
          <CardFooter>
            <Button className="w-full" type="submit">
              Accedi al Portale
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
