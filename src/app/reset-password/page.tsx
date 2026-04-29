'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  const [isSettingSession, setIsSettingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    // Leggiamo i token dalla query string lato client.
    // (Evita l’uso di `useSearchParams()` che in Next 16 richiede Suspense.)
    const params = new URLSearchParams(window.location.search)
    setAccessToken(params.get('access_token'))
    setRefreshToken(params.get('refresh_token'))
  }, [])

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      setIsSettingSession(false)
      setSessionError(null)
      return
    }

    const accessTokenNonNull = accessToken
    const refreshTokenNonNull = refreshToken

    let cancelled = false

    async function run() {
      setIsSettingSession(true)
      setSessionError(null)

      const { error } = await supabase.auth.setSession({
        access_token: accessTokenNonNull,
        refresh_token: refreshTokenNonNull,
      })

      if (cancelled) return
      setIsSettingSession(false)
      setSessionError(error?.message ?? null)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [accessToken, refreshToken, supabase])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!newPassword) return

    setIsUpdating(true)
    setUpdateError(null)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsUpdating(false)

    if (error) {
      setUpdateError(error.message)
      return
    }

    router.push('/login?message=Password aggiornata con successo. Accedi al portale.')
  }

  const hasTokens = Boolean(accessToken && refreshToken)

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#fafafa]">
      <Card className="w-full max-w-sm border border-black bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-zinc-900">Cambia password</CardTitle>
          <CardDescription className="text-zinc-600">
            Imposta una nuova password per completare il recupero.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {!hasTokens && (
            <div className="text-sm text-zinc-700 text-center">
              Link di recupero non valido o mancante.{' '}
              <Link href="/recupero-password" className="underline">
                Richiedi un nuovo link
              </Link>
              .
            </div>
          )}

          {hasTokens && sessionError && (
            <div className="text-sm text-red-500 font-medium text-center">{sessionError}</div>
          )}

          {hasTokens && isSettingSession && <div className="text-sm text-zinc-600 text-center">Caricamento...</div>}

          {hasTokens && !isSettingSession && !sessionError && (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nuova password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {updateError && <div className="text-sm text-red-500 font-medium">{updateError}</div>}

              <CardFooter className="p-0">
                <Button
                  className="w-full bg-[#060d41] text-white hover:bg-[#0a155a]"
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Aggiornamento...' : 'Aggiorna password'}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Link href="/login" className="text-sm text-zinc-700 hover:underline text-center">
            Torna al login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

