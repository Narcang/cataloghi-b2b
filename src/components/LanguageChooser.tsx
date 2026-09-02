'use client'

import Image from 'next/image'
import { CHOOSER_LOCALES, LOCALE_FLAG, LOCALE_NATIVE, type AppLocale } from '@/lib/locale'
import { tHome } from '@/lib/i18n'

export default function LanguageChooser() {
  async function scegli(locale: AppLocale) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ locale }),
    })
    window.location.assign('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12">
      <Image src="/logo.png" alt="Ladiva Ceramica" width={180} height={64} style={{ objectFit: 'contain' }} />
      <h1 className="mt-10 text-2xl md:text-3xl font-semibold text-[#060d41] text-center">
        Scegli la lingua · Choose language
      </h1>
      <p className="mt-3 max-w-lg text-center text-sm text-zinc-600 space-y-1">
        <span className="block">{tHome('it').scegliLinguaHelp}</span>
        <span className="block">{tHome('en').scegliLinguaHelp}</span>
      </p>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
        {CHOOSER_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => void scegli(locale)}
            className="rounded-2xl border border-black bg-white px-4 py-6 text-base md:text-lg font-semibold text-[#060d41] hover:bg-[#060d41] hover:text-white transition-colors"
          >
            {LOCALE_FLAG[locale]} {LOCALE_NATIVE[locale]}
          </button>
        ))}
      </div>
    </div>
  )
}
