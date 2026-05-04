import { MetadataRoute } from 'next'

const siteBase = process.env.NEXT_PUBLIC_APP_URL

export default function manifest(): MetadataRoute.Manifest {
  const startUrl = '/'

  return {
    // Id stabile quando c’è il dominio (aggiornamenti PWA)
    ...(siteBase ? { id: new URL(startUrl, siteBase).href } : {}),
    name: 'Ladiva Ceramica — Catalogo',
    short_name: 'Ladiva',
    description:
      'Cataloghi ceramica Ladiva: consultazione da telefono e tablet per la rete vendita. Apri a schermo intero dopo installazione.',
    lang: 'it',
    start_url: startUrl,
    scope: '/',
    /**
     * standalone: niente barra indirizzi, come un’app nativa
     * (a differenza di “browser” che mantiene il chrome del browser)
     */
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    background_color: '#ffffff',
    theme_color: '#060d41',
    orientation: 'any',
    categories: ['business', 'design'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
