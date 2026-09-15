'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { readLocaleCookie } from '@/lib/useAppLocale'

/** Senza `?lingua=` allinea la scheda cataloghi alla lingua dell’header. */
export default function CatalogLinguaQuerySync() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('lingua')) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('lingua', readLocaleCookie())
    router.replace(`/dashboard/gestione-cataloghi?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return null
}
