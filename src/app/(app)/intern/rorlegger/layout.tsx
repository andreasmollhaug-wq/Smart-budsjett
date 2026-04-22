import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rørleggerprosjekter (demo)',
  robots: { index: false, follow: false },
}

export default function RorleggerLayout({ children }: { children: React.ReactNode }) {
  return children
}
