import type { Viewport } from 'next'
import SupabaseAuthUrlErrorBanner from '@/components/auth/SupabaseAuthUrlErrorBanner'
import { ApplyMarketingSandPalette } from '@/components/marketing/ApplyMarketingSandPalette'

export const viewport: Viewport = {
  themeColor: '#004b6b',
}

export default function DottirMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/** Palett på `<html>` kommer fra RootLayout (SSR); klientnavigasjon håndteres i komponenten under. */}
      <ApplyMarketingSandPalette />
      <SupabaseAuthUrlErrorBanner />
      {children}
    </>
  )
}
