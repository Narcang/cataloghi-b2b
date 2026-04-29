'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Scorre alla sezione indicata dall'hash (es. /dashboard#catalog-cat-family-20)
 * dopo il render, rispettando l'header sticky.
 */
export default function DashboardHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/dashboard') return
    const raw = window.location.hash.replace(/^#/, '')
    if (!raw) return
    const id = decodeURIComponent(raw)

    const run = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    requestAnimationFrame(() => {
      run()
      setTimeout(run, 100)
    })
  }, [pathname])

  return null
}
