import Link from 'next/link'
import Header from '@/components/Header'

export const metadata = { title: 'Privacy Policy – Ladiva Ceramica' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="w-full max-w-3xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-400 mb-8">Ultimo aggiornamento: giugno 2026</p>

        <div className="prose prose-zinc max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">1. Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati personali è <strong>Ladiva Italia srl</strong> e <strong>Ladiva ltd</strong>,
              con sede in Via Adda 50/D, Sassuolo, Italia e Piazza Tigne Point TP 09, Sliema, Malta.
              Per qualsiasi richiesta relativa alla privacy è possibile contattarci all&apos;indirizzo{' '}
              <a href="mailto:info@ladivaceramica.it" className="underline text-[#060d41]">info@ladivaceramica.it</a> o{' '}
              <a href="mailto:info@ladiva-fpd.com" className="underline text-[#060d41]">info@ladiva-fpd.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">2. Dati raccolti</h2>
            <p>
              In fase di registrazione al portale raccogliamo i seguenti dati personali: nome, cognome,
              indirizzo email, numero di telefono e ragione sociale. Tali dati sono necessari per la
              gestione dell&apos;account e per fornire i servizi riservati agli utenti registrati.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">3. Finalità e base giuridica</h2>
            <p>
              I dati vengono trattati esclusivamente per le seguenti finalità:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Creazione e gestione dell&apos;account utente sul portale;</li>
              <li>Fornitura dei servizi richiesti (accesso a cataloghi, listini, materiali riservati);</li>
              <li>Comunicazioni operative relative al servizio.</li>
            </ul>
            <p className="mt-2">
              La base giuridica del trattamento è il consenso dell&apos;interessato (art. 6, par. 1, lett. a
              GDPR) e l&apos;esecuzione di un contratto (art. 6, par. 1, lett. b GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">4. Conservazione dei dati</h2>
            <p>
              I dati personali sono conservati per il tempo strettamente necessario alle finalità per cui
              sono stati raccolti, e comunque non oltre la cancellazione dell&apos;account o la cessazione
              del rapporto commerciale.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">5. Diritti dell&apos;interessato</h2>
            <p>
              In conformità al GDPR, hai il diritto di accedere ai tuoi dati, richiederne la rettifica o
              la cancellazione, opporti al trattamento e richiedere la portabilità. Per esercitare questi
              diritti scrivi a{' '}
              <a href="mailto:info@ladiva-fpd.com" className="underline text-[#060d41]">info@ladiva-fpd.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">6. Comunicazione a terzi</h2>
            <p>
              I dati non vengono ceduti a terzi né utilizzati per finalità diverse da quelle indicate.
              Possono essere trattati da fornitori tecnici (es. hosting, database) che operano come
              responsabili del trattamento ai sensi del GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">7. Cookie</h2>
            <p>
              Per informazioni sull&apos;utilizzo dei cookie consulta la nostra{' '}
              <Link href="/cookie" className="underline text-[#060d41]">Cookie Policy</Link>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex gap-4 text-sm">
          <Link href="/termini" className="underline text-[#060d41]">Termini e Condizioni</Link>
          <Link href="/cookie" className="underline text-[#060d41]">Cookie Policy</Link>
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
