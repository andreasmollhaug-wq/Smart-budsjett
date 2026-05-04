import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'
import type { ReactNode } from 'react'

export default function DottirLayout({ children }: { children: ReactNode }) {
  return <DottirSmoothScroll>{children}</DottirSmoothScroll>
}
