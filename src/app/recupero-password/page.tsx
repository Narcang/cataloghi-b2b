'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'

export default function RecuperoPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    setIsSubmitting(true)
    setMessage(null)

    const redirectTo = `${window.location.origin}/reset-password`
    await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo })

    setIsSubmitting(false)
    setMessage(`Ti abbiamo inviato un'email di recupero password all'indirizzo ${trimmedEmail}.`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#fafafa]">
      <Card className="w-full max-w-sm border border-black bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl text-zinc-900">Recupero password</CardTitle>
            <CardDescription className="text-zinc-600">
              Inserisci la tua email: ti invieremo un link per reimpostare la password.
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className="text-sm text-zinc-700 font-medium mt-2 text-center">
                {message}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full bg-[#060d41] text-white hover:bg-[#0a155a]"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia link per recupero'}
            </Button>

            <Link href="/login" className="text-sm text-zinc-700 hover:underline text-center">
              Torna al login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

