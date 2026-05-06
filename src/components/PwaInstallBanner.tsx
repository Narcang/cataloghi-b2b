'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPrompt | null
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true
  const md = window.matchMedia('(display-mode: standalone)')
  if (md.matches) return true
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export default function PwaInstallBanner() {
  const [installAvailable, setInstallAvailable] = useState(false)
  const [ios, setIos] = useState(false)
  const [iosDismissed, setIosDismissed] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // ignore registration failures
      })
    }

    if (isStandalone()) return

    const ua = window.navigator.userAgent
    const i =
      /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
    setIos(!!i)

    const onBip = (e: Event) => {
      e.preventDefault()
      window.deferredPrompt = e as BeforeInstallPrompt
      setInstallAvailable(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  const install = useCallback(async () => {
    const promptEvent = window.deferredPrompt
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      console.log('PWA installazione accettata')
    } else {
      console.log('PWA installazione rifiutata')
    }
    window.deferredPrompt = null
    setInstallAvailable(false)
  }, [])

  if (isStandalone()) return null
  if (ios && !iosDismissed) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[200] border-t border-white/10 bg-[#060d41] text-white/95 p-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        role="complementary"
        aria-label="Aggiunta alla schermata Home"
      >
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3 px-1">
          <p className="text-sm leading-relaxed pr-1">
            Per aprire Ladiva <strong>senza barra del browser</strong>: tocca <strong>Condividi</strong> e poi{' '}
            <strong>Aggiungi alla schermata Home</strong> (o &quot;Aggiungi a Home&quot;).
          </p>
          <button
            type="button"
            onClick={() => setIosDismissed(true)}
            className="shrink-0 p-1 rounded-md hover:bg-white/10"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    )
  }
  if (!installAvailable) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] border-t border-white/10 bg-[#060d41] text-white p-3"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-1">
        <p className="text-sm">Installa l&apos;app su questo dispositivo</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={install}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#060d41] hover:bg-white/90"
          >
            <Download size={16} />
            Installa App
          </button>
        </div>
      </div>
    </div>
  )
}
