import Link from 'next/link'
import Header from '@/components/Header'

export const metadata = { title: 'Termini e Condizioni – Ladiva Ceramica' }

export default function TerminiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <main className="w-full max-w-3xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Termini e Condizioni d&apos;uso</h1>
        <p className="text-sm text-zinc-400 mb-8">Ultimo aggiornamento: giugno 2026</p>

        <div className="prose prose-zinc max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">1. Accettazione dei termini</h2>
            <p>
              Registrandosi al portale riservato di <strong>Ladiva Italia srl</strong> e <strong>Ladiva ltd</strong>,
              l&apos;utente accetta integralmente i presenti Termini e Condizioni d&apos;uso.
              L&apos;accesso al portale è riservato a soggetti professionali (agenti, studi, partner commerciali)
              che abbiano ricevuto un invito o la cui richiesta di registrazione sia stata approvata.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">2. Accesso al portale</h2>
            <p>
              Le credenziali di accesso sono personali e non trasferibili. L&apos;utente è responsabile
              della riservatezza della propria password e di tutte le attività svolte con il proprio
              account. In caso di accesso non autorizzato è necessario contattare immediatamente
              l&apos;assistenza.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">3. Contenuti riservati</h2>
            <p>
              I cataloghi, i listini prezzi, le schede tecniche e gli altri materiali presenti nel
              portale sono riservati agli utenti registrati e non possono essere divulgati, riprodotti
              o distribuiti a terzi senza esplicita autorizzazione scritta di Ladiva Ceramica.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">4. Proprietà intellettuale</h2>
            <p>
              Tutti i contenuti del portale (immagini, testi, cataloghi, loghi) sono di proprietà
              esclusiva di Ladiva Ceramica o dei rispettivi titolari. È vietata qualsiasi riproduzione
              non autorizzata.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">5. Limitazione di responsabilità</h2>
            <p>
              Ladiva Ceramica si riserva il diritto di modificare, sospendere o interrompere in qualsiasi
              momento l&apos;accesso al portale senza preavviso. Le informazioni presenti nel portale
              hanno carattere commerciale e possono essere aggiornate senza comunicazione preventiva.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">6. Legge applicabile</h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è
              competente il foro di Reggio Emilia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">7. Modifiche ai termini</h2>
            <p>
              Ladiva Ceramica si riserva il diritto di modificare i presenti Termini in qualsiasi
              momento. Le modifiche saranno comunicate tramite il portale e avranno effetto dalla
              data di pubblicazione.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex gap-4 text-sm">
          <Link href="/privacy" className="underline text-[#060d41]">Privacy Policy</Link>
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
