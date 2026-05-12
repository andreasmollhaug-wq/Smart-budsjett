import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { GoogleAnalytics } from '@next/third-parties/google'
import { COMPANY_NAME } from '@/lib/legal'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/** Bumper når favicon/PWA-PNG byttes, så nettlesere ikke viser gammel tab-ikon-cache. */
const FAVICON_CACHE_QUERY = '?v=fav02'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3B5BDB',
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${PRODUCT_DISPLAY_NAME} | ${COMPANY_NAME}`,
    template: `%s · ${PRODUCT_DISPLAY_NAME}`,
  },
  description: 'Din personlige økonomiassistent',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: `/pwa-icon-192.png${FAVICON_CACHE_QUERY}`, sizes: '192x192', type: 'image/png' },
      { url: `/pwa-icon-512.png${FAVICON_CACHE_QUERY}`, sizes: '512x512', type: 'image/png' },
    ],
    apple: `/apple-icon.png${FAVICON_CACHE_QUERY}`,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  const marketingSandPalette = headerList.get('x-ui-marketing-sand') === '1'

  return (
    <html lang="nb" data-ui-palette={marketingSandPalette ? 'sand' : undefined}>
      <body>
        {children}
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      </body>
    </html>
  )
}
