import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Dove siamo · Ladiva Ceramica',
  description: 'Sede, contatti e come raggiungere Ladiva Ceramica a Carpineti (RE).',
}

export default function DoveSiamoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />

      <div className="ladiva-root ladiva-root--auto ladiva-root-home-lower flex-1 flex flex-col">
        <section
          className="ladiva-home-dove-section ladiva-section-catalog-wide"
          id="dove-siamo"
        >
          <div className="ladiva-home-dove-inner">
            <span className="ladiva-label">Vieni a trovarci</span>
            <h1 className="ladiva-section-title">Dove Siamo</h1>
            <div className="ladiva-contact-grid">
              <div className="ladiva-home-contact-card">
                <MapPin className="ladiva-home-contact-icon" size={28} />
                <h3>Show Room</h3>
                <p>
                  Via Matteotti 2<br />
                  Formigine MO<br />
                  Italia
                </p>
              </div>
              <div className="ladiva-home-contact-card">
                <MapPin className="ladiva-home-contact-icon" size={28} />
                <h3>Produzione</h3>
                <p>
                  Via San Prospero 65/A<br />
                  42033 Carpineti RE<br />
                  Italia
                </p>
              </div>
              <div className="ladiva-home-contact-card">
                <MapPin className="ladiva-home-contact-icon" size={28} />
                <h3>Deposito</h3>
                <p>
                  Strada Statale 467<br />
                  Sant&apos;Antonino di Casalgrande RE
                </p>
              </div>
            </div>

            <div className="ladiva-map-placeholder">
              <iframe
                title="Carpineti RE Map"
                src="https://maps.google.com/maps?q=Carpineti,+Reggio+Emilia,+Italy&z=13&output=embed"
                width="100%"
                height="360"
                style={{ border: 0, borderRadius: '1rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        <footer className="ladiva-footer ladiva-footer--compact ladiva-footer-home-strip mt-auto">
          <div className="ladiva-home-footer-inner">
            <p className="text-sm max-w-3xl mx-auto text-center">
              © {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia
              {' · '}
              <Link href="/" className="ladiva-footer-link whitespace-nowrap">
                ← Torna alla home
              </Link>
              {' · '}
              <Link href="/login" className="ladiva-footer-link whitespace-nowrap">
                Accedi al Portale Agenti →
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
