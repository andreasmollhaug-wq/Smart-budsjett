import { ImageResponse } from 'next/og'

export const DOTTIR_OG_SIZE = { width: 1200, height: 630 } as const

type DottirOgImageProps = {
  headline: string
  subline: string
}

/** Bakgrunn og typografi til Dottir delingskort (Snapchat, Messenger, Slack, m.m.). */
export function dottirOpenGraphImageResponse({ headline, subline }: DottirOgImageProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(145deg, #003d56 0%, #004b6b 42%, #0a5f7a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 900,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.88)',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            Dottir
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.12,
              color: '#fff',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            {headline}
          </span>
          <span
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            {subline}
          </span>
        </div>
      </div>
    ),
    {
      ...DOTTIR_OG_SIZE,
    },
  )
}
