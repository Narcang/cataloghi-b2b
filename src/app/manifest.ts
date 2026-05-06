import { MetadataRoute } from 'next'
import { SITE_ICON_SEARCH } from '@/lib/siteIconVersion'

const icon192 = `/icon-192.png?${SITE_ICON_SEARCH}`
const icon512 = `/icon-512.png?${SITE_ICON_SEARCH}`

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ladiva Ceramica - Catalogo',
    short_name: 'Ladiva',
    description: 'Cataloghi ceramica Ladiva',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#060d41',
    icons: [
      {
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: icon512,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
