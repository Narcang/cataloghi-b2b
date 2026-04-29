import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/**
 * Icona PWA / home screen (Astro maskable: contenuto al centro, margine per crop sistema).
 * Colore: navy Ladiva (#060d41).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060d41',
        }}
      >
        <div
          style={{
            color: '#f5f5f0',
            fontSize: 280,
            fontWeight: 600,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          L
        </div>
      </div>
    ),
    { ...size }
  )
}
