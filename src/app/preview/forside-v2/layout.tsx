import { ApplyMarketingSandPalette } from '@/components/marketing/ApplyMarketingSandPalette'

export default function ForsideV2PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ApplyMarketingSandPalette />
      {children}
    </>
  )
}
