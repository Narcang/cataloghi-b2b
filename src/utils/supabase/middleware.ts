import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSessioneScadutaPerRiloggio } from '@/lib/ultimoAccessoUtenti'

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie))
  return to
}

function isAuthKeepSessionPath(pathname: string): boolean {
  return pathname.startsWith('/auth') || pathname.startsWith('/reset-password')
}

/** Sotto il tetto di Vercel: un Auth lento non deve chiudere il sito con 504. */
const AUTH_FETCH_MS = 4000

const PUBLIC_PATHS = [
  '/',
  '/dove-siamo',
  '/login',
  '/registrazione',
  '/tutorial',
  '/auth',
  '/recupero-password',
  '/reset-password',
  '/cataloghi',
  '/privacy',
  '/termini',
  '/cookie',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function haCookieSessione(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes('auth-token'))
}

function fetchConTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(AUTH_FETCH_MS),
  })
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchConTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  let user: { last_sign_in_at?: string | null } | null = null
  let authNonRisponde = false
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error?.name === 'AuthRetryableFetchError') authNonRisponde = true
    else user = data.user
  } catch {
    authNonRisponde = true
  }

  // Cancellare utenti tiene occupato Auth. Se non risponde, si lascia passare
  // chi ha già il cookie: la pagina ricontrolla la sessione, senza il 504 del middleware.
  if (authNonRisponde) {
    if (!isPublicPath(pathname) && !haCookieSessione(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Dopo 24h da last_sign_in_at si forza un nuovo login (email+password) così l'ultimo accesso si aggiorna.
  if (user && isSessioneScadutaPerRiloggio(user.last_sign_in_at) && !isAuthKeepSessionPath(pathname)) {
    try {
      await supabase.auth.signOut()
    } catch {
      // Auth lento: il redirect al login avviene comunque.
    }
    if (pathname.startsWith('/login')) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '?message=sessione'
    return copyCookies(supabaseResponse, NextResponse.redirect(url))
  }

  // Pagine pubbliche: home e cataloghi in vetrina. Menu e area riservata (/dashboard) richiedono il login.
  const isPublic = isPublicPath(pathname)

  // Se l'utente non è loggato e vuole accedere a una pagina protetta, rimanda al login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se è già loggato e va al login, rimanda alla dashboard
  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/registrazione')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
