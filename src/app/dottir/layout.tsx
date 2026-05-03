import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/** Favicon og Apple-ikon for Dottir (rot-appen beholder Smart Budsjett-ikon). */
export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/dottir/icon', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/dottir/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
}

export default function DottirLayout({ children }: { children: ReactNode }) {
  return <DottirSmoothScroll>{children}</DottirSmoothScroll>
}
