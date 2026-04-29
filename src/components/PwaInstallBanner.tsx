'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true
  const md = window.matchMedia('(display-mode: standalone)')
  if (md.matches) return true
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export default function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPrompt | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [ios, setIos] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    if (isStandalone()) return
    if (localStorage.getItem('ladiva_pwa_install_dismiss') === '1') {
      setDismissed(true)
    }
    const ua = window.navigator.userAgent
    const i =
      /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
    setIos(!!i)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem('ladiva_pwa_install_dismiss', '1')
    } catch {
      // ignore
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }, [deferred, dismiss])

  if (!ready) return null
  if (isStandalone()) return null
  if (dismissed) return null
  if (!deferred && !ios) return null
  if (ios) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[200] border-t border-white/10 bg-[#060d41] text-white/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]"
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
            onClick={dismiss}
            className="shrink-0 p-1 rounded-md hover:bg-white/10"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    )
  }

  if (!deferred) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] border-t border-white/10 bg-[#060d41] text-white p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-1">
        <p className="text-sm">Installa l&apos;app su questo dispositivo: icona in home e apertura a schermo pieno.</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={install}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#060d41] hover:bg-white/90"
          >
            <Download size={16} />
            Installa
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Non ora"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
