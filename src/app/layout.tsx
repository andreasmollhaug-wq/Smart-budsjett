import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'Smart Budsjett | EnkelExcel',
    template: '%s · Smart Budsjett',
  },
  description: 'Din personlige økonomiassistent',
  /** Eksplisitte ruter fra app/icon.tsx og app/apple-icon.tsx (unngår 404 på /favicon.ico alene). */
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  )
}
