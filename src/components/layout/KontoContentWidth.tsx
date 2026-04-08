'use client'

import { usePathname } from 'next/navigation'

/**
 * Roadmap trenger mer bredde til Kanban; øvrige konto-sider beholder smal kolonne.
 */
export default function KontoContentWidth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const roadmapWide = pathname === '/konto/roadmap' || pathname.startsWith('/konto/roadmap/')

  return (
    <div
      className={
        roadmapWide
          ? 'max-w-5xl space-y-6 p-4 sm:p-6 md:p-8'
          : 'max-w-3xl space-y-6 p-4 sm:p-6 md:p-8'
      }
    >
      {children}
    </div>
  )
}
