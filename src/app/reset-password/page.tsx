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
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'error'>('loading')
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrapRecoverySession() {
      setStatus('loading')
      setSessionError(null)

      const currentUrl = new URL(window.location.href)
      const query = currentUrl.searchParams
      const hash = new URLSearchParams(currentUrl.hash.startsWith('#') ? currentUrl.hash.slice(1) : '')
      const type = query.get('type') ?? hash.get('type')
      const tokenHash = query.get('token_hash') ?? hash.get('token_hash')

      const accessToken = query.get('access_token') ?? hash.get('access_token')
      const refreshToken = query.get('refresh_token') ?? hash.get('refresh_token')

      // Flusso classico: Supabase invia access_token + refresh_token.
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (cancelled) return
        if (error) {
          setStatus('error')
          setSessionError(error.message)
          return
        }

        setStatus('ready')
        window.history.replaceState({}, '', '/reset-password')
        return
      }

      // Flusso alternativo: Supabase invia token_hash + type=recovery.
      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })

        if (cancelled) return
        if (error) {
          setStatus('error')
          setSessionError(error.message)
          return
        }

        setStatus('ready')
        window.history.replaceState({}, '', '/reset-password')
        return
      }

      if (cancelled) return
      setStatus('invalid')
    }

    void bootstrapRecoverySession()

    return () => {
      cancelled = true
    }
  }, [supabase])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!newPassword) return

    if (status !== 'ready') {
      setUpdateError("Per aggiornare la password, apri il link di recupero ricevuto via email.")
      return
    }
    if (newPassword !== confirmPassword) {
      setUpdateError('Le password non coincidono. Controlla e riprova.')
      return
    }
    if (newPassword.length < 6) {
      setUpdateError('La password deve contenere almeno 6 caratteri.')
      return
    }

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
          {status === 'invalid' && (
            <div className="text-sm text-zinc-700 text-center">
              Link di recupero non valido o mancante.{' '}
              <Link href="/recupero-password" className="underline">
                Richiedi un nuovo link
              </Link>
              .
            </div>
          )}

          {status === 'error' && sessionError && (
            <div className="text-sm text-red-500 font-medium text-center">{sessionError}</div>
          )}

          {status === 'loading' && <div className="text-sm text-zinc-600 text-center">Caricamento...</div>}

          {status !== 'loading' && (
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

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Conferma password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {status !== 'ready' && (
                <div className="text-xs text-zinc-600">
                  Inserisci la nuova password e usa il link corretto ricevuto via email per completare il recupero.
                </div>
              )}

              {updateError && <div className="text-sm text-red-500 font-medium">{updateError}</div>}

              <CardFooter className="p-0">
                <Button
                  className="w-full bg-[#060d41] text-white hover:bg-[#0a155a]"
                  type="submit"
                  disabled={isUpdating || status !== 'ready'}
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

