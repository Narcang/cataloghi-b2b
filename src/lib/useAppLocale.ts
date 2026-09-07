'use client'

import { useEffect, useState } from 'react'
import { LOCALE_COOKIE, parseAppLocale, type AppLocale } from '@/lib/locale'

export function readLocaleCookie(): AppLocale {
  if (typeof document === 'undefined') return 'it'
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
  return parseAppLocale(match?.split('=')[1])
}

export function useAppLocale(initial?: AppLocale): AppLocale {
  const [locale, setLocale] = useState<AppLocale>(initial ?? 'it')

  useEffect(() => {
    setLocale(readLocaleCookie())
  }, [])

  return locale
}
