import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // Pagine pubbliche (free / ospite senza password): home, dove siamo, login, auth, dashboard ridotta, PDF cataloghi attivi
  const publicPaths = [
    '/',
    '/dove-siamo',
    '/login',
    '/auth',
    '/recupero-password',
    '/reset-password',
    '/dashboard',
    '/cataloghi',
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

  return supabaseResponse
}
