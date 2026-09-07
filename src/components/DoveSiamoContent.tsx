'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { tDoveSiamo, tHome } from '@/lib/i18n'
import type { AppLocale } from '@/lib/locale'
import { useAppLocale } from '@/lib/useAppLocale'

export default function DoveSiamoContent({ initialLocale }: { initialLocale: AppLocale }) {
  const locale = useAppLocale(initialLocale)
  const copy = tDoveSiamo(locale)
  const homeCopy = tHome(locale)

  return (
    <div className="ladiva-root ladiva-root--auto ladiva-root-home-lower flex-1 flex flex-col">
      <section
        className="ladiva-home-dove-section ladiva-section-catalog-wide"
        id="dove-siamo"
      >
        <div className="ladiva-home-dove-inner">
          <span className="ladiva-label">{copy.kicker}</span>
          <h1 className="ladiva-section-title">{copy.titolo}</h1>
          <div className="ladiva-contact-grid">
            <div className="ladiva-home-contact-card">
              <MapPin className="ladiva-home-contact-icon" size={28} />
              <h3>{copy.showRoom}</h3>
              <p>
                Via Matteotti 2<br />
                Formigine MO<br />
                {copy.paese}
              </p>
            </div>
            <div className="ladiva-home-contact-card">
              <MapPin className="ladiva-home-contact-icon" size={28} />
              <h3>{copy.produzione}</h3>
              <p>
                Via San Prospero 65/A<br />
                42033 Carpineti RE<br />
                {copy.paese}
              </p>
            </div>
            <div className="ladiva-home-contact-card">
              <MapPin className="ladiva-home-contact-icon" size={28} />
              <h3>{copy.deposito}</h3>
              <p>
                Strada Statale 467<br />
                Sant&apos;Antonino di Casalgrande RE
              </p>
            </div>
          </div>

          <div className="ladiva-map-placeholder">
            <iframe
              title={copy.mapTitle}
              src={`https://maps.google.com/maps?q=Carpineti,+Reggio+Emilia,+Italy&z=13&hl=${locale}&output=embed`}
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
              {copy.tornaHome}
            </Link>
            {' · '}
            <Link href="/login" className="ladiva-footer-link whitespace-nowrap">
              {homeCopy.accediPortale}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
