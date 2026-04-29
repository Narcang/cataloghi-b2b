import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
            fontSize: 96,
            fontWeight: 600,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            lineHeight: 1,
          }}
        >
          L
        </div>
      </div>
    ),
    { ...size }
  )
}
