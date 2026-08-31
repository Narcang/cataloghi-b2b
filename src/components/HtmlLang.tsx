'use client'

import { useEffect } from 'react'
import { useAppLocale } from '@/lib/useAppLocale'

export default function HtmlLang() {
  const locale = useAppLocale()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
