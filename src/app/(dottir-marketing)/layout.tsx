import type { Viewport } from 'next'
import { ApplyMarketingSandPalette } from '@/components/marketing/ApplyMarketingSandPalette'

export const viewport: Viewport = {
  themeColor: '#004b6b',
}

export default function DottirMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/** Sand-variabler må settes før første paint; ellers vises :root (indigo) til useEffect kjører. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-ui-palette','sand')`,
        }}
      />
      <ApplyMarketingSandPalette />
      {children}
    </>
  )
}
