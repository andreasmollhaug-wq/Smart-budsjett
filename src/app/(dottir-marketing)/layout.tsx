import type { Viewport } from 'next'
import { ApplyMarketingSandPalette } from '@/components/marketing/ApplyMarketingSandPalette'

export const viewport: Viewport = {
  themeColor: '#004b6b',
}

export default function DottirMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ApplyMarketingSandPalette />
      {children}
    </>
  )
}
