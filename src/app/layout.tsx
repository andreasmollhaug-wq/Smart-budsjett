import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Smart Budsjett | EnkelExcel',
    template: '%s · Smart Budsjett',
  },
  description: 'Din personlige økonomiassistent',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  )
}
