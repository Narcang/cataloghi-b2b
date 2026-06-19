import Link from 'next/link'
import Header from '@/components/Header'

export const metadata = { title: 'Cookie Policy – Ladiva Ceramica' }

export default function CookiePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="w-full max-w-3xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-zinc-400 mb-8">Ultimo aggiornamento: giugno 2026</p>

        <div className="prose prose-zinc max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">1. Cosa sono i cookie</h2>
            <p>
              I cookie sono piccoli file di testo che i siti web salvano sul dispositivo dell&apos;utente
              durante la navigazione. Vengono utilizzati per far funzionare il sito correttamente,
              ricordare le preferenze dell&apos;utente e raccogliere informazioni statistiche.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">2. Tipologie di cookie utilizzati</h2>

            <h3 className="font-medium text-zinc-700 mt-3 mb-1">Cookie tecnici (necessari)</h3>
            <p>
              Indispensabili per il funzionamento del portale. Gestiscono la sessione di autenticazione
              dell&apos;utente e mantengono attivo l&apos;accesso all&apos;area riservata. Non richiedono
              il consenso dell&apos;utente.
            </p>

            <h3 className="font-medium text-zinc-700 mt-3 mb-1">Cookie di preferenza</h3>
            <p>
              Memorizzano le impostazioni dell&apos;utente (es. lingua, preferenze di visualizzazione)
              per migliorare l&apos;esperienza di navigazione nelle visite successive.
            </p>

            <h3 className="font-medium text-zinc-700 mt-3 mb-1">Cookie analitici</h3>
            <p>
              Raccolgono informazioni aggregate sull&apos;utilizzo del portale in forma anonima,
              permettendoci di migliorare il servizio. Non identificano il singolo utente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">3. Cookie di terze parti</h2>
            <p>
              Il portale utilizza Supabase per l&apos;autenticazione e la gestione dei dati. Supabase
              può impostare cookie tecnici necessari al funzionamento del servizio di autenticazione.
              Per maggiori informazioni consulta la{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#060d41]"
              >
                Privacy Policy di Supabase
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">4. Gestione dei cookie</h2>
            <p>
              Puoi controllare e gestire i cookie tramite le impostazioni del tuo browser. Tieni presente
              che disabilitare i cookie tecnici potrebbe compromettere il funzionamento del portale e
              rendere impossibile l&apos;accesso all&apos;area riservata.
            </p>
            <p className="mt-2">
              Per istruzioni sulla gestione dei cookie nei principali browser:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="underline text-[#060d41]">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="underline text-[#060d41]">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="underline text-[#060d41]">Apple Safari</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">5. Contatti</h2>
            <p>
              Per qualsiasi domanda relativa all&apos;utilizzo dei cookie contattaci a{' '}
              <a href="mailto:info@ladiva-fpd.com" className="underline text-[#060d41]">info@ladiva-fpd.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex gap-4 text-sm">
          <Link href="/privacy" className="underline text-[#060d41]">Privacy Policy</Link>
          <Link href="/termini" className="underline text-[#060d41]">Termini e Condizioni</Link>
          <Link href="/registrazione" className="underline text-zinc-500">← Torna alla registrazione</Link>
        </div>
      </main>

      <footer className="border-t border-zinc-100 py-4">
        <p className="text-xs text-zinc-400 text-center">
          © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
        </p>
      </footer>
    </div>
  )
}
