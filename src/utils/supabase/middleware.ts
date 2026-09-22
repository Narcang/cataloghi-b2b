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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { data: { user } } = await supabase.auth.getUser()

  // Dopo 24h da last_sign_in_at si forza un nuovo login (email+password) così l'ultimo accesso si aggiorna.
  if (user && isSessioneScadutaPerRiloggio(user.last_sign_in_at) && !isAuthKeepSessionPath(request.nextUrl.pathname)) {
    await supabase.auth.signOut()
    if (request.nextUrl.pathname.startsWith('/login')) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '?message=sessione'
    return copyCookies(supabaseResponse, NextResponse.redirect(url))
  }

  // Pagine pubbliche (free / ospite senza password): home, dove siamo, login, auth, dashboard ridotta, PDF cataloghi attivi
  const publicPaths = [
    '/',
    '/dove-siamo',
    '/login',
    '/registrazione',
    '/tutorial',
    '/auth',
    '/recupero-password',
    '/reset-password',
    '/dashboard',
    '/cataloghi',
    '/privacy',
    '/termini',
    '/cookie',
  ]
  const isPublic = publicPaths.some((p) => {
    const path = request.nextUrl.pathname
    return path === p || path.startsWith(`${p}/`)
  })

  // Se l'utente non è loggato e vuole accedere a una pagina protetta, rimanda al login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se è già loggato e va al login, rimanda alla dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith('/registrazione')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
