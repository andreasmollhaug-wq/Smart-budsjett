import type { Metadata, Viewport } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { COMPANY_NAME } from '@/lib/legal'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'
import './globals.css'

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3B5BDB',
}

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_DISPLAY_NAME} | ${COMPANY_NAME}`,
    template: `%s · ${PRODUCT_DISPLAY_NAME}`,
  },
  description: 'Din personlige økonomiassistent',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>
        {children}
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      </body>
    </html>
  )
}
