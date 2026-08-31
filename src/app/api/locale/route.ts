import { NextRequest, NextResponse } from 'next/server'
import { isAppLocale, LOCALE_COOKIE } from '@/lib/locale'

const MAX_AGE = 60 * 60 * 24 * 365

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null
  if (!isAppLocale(body?.locale)) {
    return NextResponse.json({ ok: false, message: 'Lingua non valida' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, locale: body.locale })
  res.cookies.set(LOCALE_COOKIE, body.locale, {
    path: '/',
    maxAge: MAX_AGE,
    sameSite: 'lax',
    httpOnly: false,
  })
  return res
}
