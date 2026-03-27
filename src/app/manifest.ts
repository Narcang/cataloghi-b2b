import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cataloghi B2B Hub',
    short_name: 'Cataloghi B2B',
    description: 'Applicazione ottimizzata per tablet di consultazione cataloghi B2B per la Rete Vendita',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
