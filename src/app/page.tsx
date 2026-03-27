import Header from '@/components/Header'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="ladiva-root">
      <Header />

      {/* HERO */}
      <section className="ladiva-hero">
        <div className="ladiva-hero-overlay" />
        <div className="ladiva-hero-content">
          <p className="ladiva-hero-eyebrow">Ceramica Italiana dal 2013</p>
          <h1 className="ladiva-hero-title">Ladiva Ceramica</h1>
          <p className="ladiva-hero-subtitle">
            L'arte della ceramica italiana incontra l'architettura contemporanea
          </p>
          <a href="#chi-siamo" className="ladiva-hero-btn">Scopri di più</a>
        </div>
      </section>

      {/* CHI SIAMO */}
      <section className="ladiva-section" id="chi-siamo">
        <div className="ladiva-section-inner">
          <span className="ladiva-label">La nostra storia</span>
          <h2 className="ladiva-section-title">Chi siamo</h2>
          <div className="ladiva-prose">
            <p>
              Ladiva Ceramica nasce dall'esigenza naturale di portare il pensiero di architetti e designer
              verso una libertà assoluta, creando una linea ceramica con un unico supporto, un unico sistema di
              produzione e un unico spessore, mantenendo intatto il concetto di piastrella, materiale ceramico smaltato
              con bordi leggermente arrotondati. Questo sistema rende la ceramica Ladiva simile al marmo o al legno,
              materiali ampiamente utilizzati dagli architetti per la loro flessibilità.
            </p>
            <p>
              Grazie a questa intuizione, ma senza trasformare la manifattura della ceramica italiana, il brand ha
              intrapreso nel 2013 un percorso senza precedenti, con l'obiettivo di sfidare le regole dei grandi
              produttori. Ancora più importante è il valore aggiunto al prodotto grazie all'utilizzo di materie prime
              di origine italiana e delle acque della nostra sorgente Gabbianella, che rendono il prodotto finito un
              piccolo pezzo della bellissima Italia.
            </p>
            <p>
              Ladiva nasce dall'esigenza naturale di sollecitare i migliori designer e architetti a realizzare le loro
              idee, con l'uso dei nostri prodotti, decorati solo con un sistema a rilievo, che dà allo smalto la
              possibilità di deformarsi in superficie creando un prodotto unico. Il vantaggio di avere solo decorazioni
              a rilievo, e non serigrafia, dona alle ceramiche Ladiva una longevità paragonabile ai grandi classici
              dell'arredamento, perché il rilievo non ha mai tempo.
            </p>
          </div>
        </div>
      </section>

      {/* CARPINETI CASTLE */}
      <section className="ladiva-section alt" id="carpineti-castle">
        <div className="ladiva-section-inner">
          <span className="ladiva-label">Il nostro territorio</span>
          <h2 className="ladiva-section-title">Carpineti Castle</h2>
          <p className="ladiva-section-subtitle">Carpineti Castle</p>
          <div className="ladiva-prose">
            <p>
              Lo si può vedere lì in cima, sia lungo la pianura della Secchia che quella del Tresinaro: sugli Appennini
              di Reggio Emilia sorge il Castello di Carpineti, uno dei manieri del potente dominio di Matilde di Canossa.
              La fortezza è situata in un posto privilegiato per ospitare papi, imperatori, re e duchi mentre stipulavano
              accordi sulle sorti d'Italia. Il mastio è ancora quasi intatto e sorge su uno degli speroni rocciosi del
              crinale del Monte Antognano.
            </p>
            <p>
              "CASTELLO DELLE DONNE" con una cintura muraria irregolare quasi come un trapezio. All'estremità del lato
              meridionale più corto c'è una piccola abside che è configurata come una torre rotonda attraverso cui si
              entrava nel castello. All'interno c'è una torre isolata con una pianta quadrata, composta da blocchi di
              macigno ben squadrati. L'intera struttura fu restaurata dal 1990 ai primi del 1999. Il castello di
              Carpineti si trova su un importante crocevia di sentieri escursionistici: il percorso Spallanzani e il
              percorso della Matilde.
            </p>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="ladiva-section" id="collections">
        <div className="ladiva-section-inner">
          <span className="ladiva-label">I nostri prodotti</span>
          <h2 className="ladiva-section-title">Collections</h2>
          <div className="ladiva-grid-3">
            <div className="ladiva-card-collection">
              <div className="ladiva-card-icon">15</div>
              <h3 className="ladiva-card-title">Family 15</h3>
              <p className="ladiva-card-text">
                Composta da 7.5X15, 7.5X30, 15X15 e 15X30. Una collezione versatile che si adatta a ogni spazio.
              </p>
            </div>
            <div className="ladiva-card-collection">
              <div className="ladiva-card-icon">20</div>
              <h3 className="ladiva-card-title">Family 20</h3>
              <p className="ladiva-card-text">
                Composta da 10X20, 20X20, 20X80, 40X40 e 40X80. Piastrelle in gres porcellanato smaltato.
              </p>
            </div>
            <div className="ladiva-card-collection">
              <div className="ladiva-card-icon">CC</div>
              <h3 className="ladiva-card-title">Capsule Collection</h3>
              <p className="ladiva-card-text">
                Con il solo formato 20X20, forme tridimensionali uniche. Anche in versione terracotta mattone.
              </p>
            </div>
          </div>
          <div className="ladiva-gres-note">
            <p>
              Tutti i prodotti Ladiva sono realizzati con presse idrauliche e ogni decorazione è eseguita esclusivamente tramite rilievo.
            </p>
          </div>
        </div>
      </section>

      {/* DOVE SIAMO */}
      <section className="ladiva-section alt" id="dove-siamo">
        <div className="ladiva-section-inner">
          <span className="ladiva-label">Vieni a trovarci</span>
          <h2 className="ladiva-section-title">Dove Siamo</h2>
          <div className="ladiva-contact-grid">
            <div className="ladiva-contact-card">
              <MapPin className="ladiva-contact-icon" size={28} />
              <h3>Sede</h3>
              <p>Carpineti (RE), Appennino Reggiano<br />Emilia-Romagna, Italia</p>
            </div>
            <div className="ladiva-contact-card">
              <Phone className="ladiva-contact-icon" size={28} />
              <h3>Telefono</h3>
              <p>Contattaci per informazioni<br />sui nostri prodotti e cataloghi</p>
            </div>
            <div className="ladiva-contact-card">
              <Mail className="ladiva-contact-icon" size={28} />
              <h3>Email</h3>
              <p>Scrivici per richieste<br />commerciali e partnership</p>
            </div>
          </div>

          {/* Map embed placeholder */}
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

      {/* FOOTER */}
      <footer className="ladiva-footer">
        <p>© {new Date().getFullYear()} Ladiva Ceramica · Carpineti (RE), Italia</p>
        <a href="/login" className="ladiva-footer-link">Accedi al Portale Agenti →</a>
      </footer>
    </div>
  )
}
