import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'
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
                <h3>Sede</h3>
                <p>
                  Carpineti (RE), Appennino Reggiano
                  <br />
                  Emilia-Romagna, Italia
                </p>
              </div>
              <div className="ladiva-home-contact-card">
                <Phone className="ladiva-home-contact-icon" size={28} />
                <h3>Telefono</h3>
                <p>
                  Contattaci per informazioni
                  <br />
                  sui nostri prodotti e cataloghi
                </p>
              </div>
              <div className="ladiva-home-contact-card">
                <Mail className="ladiva-home-contact-icon" size={28} />
                <h3>Email</h3>
                <p>
                  Scrivici per richieste
                  <br />
                  commerciali e partnership
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
