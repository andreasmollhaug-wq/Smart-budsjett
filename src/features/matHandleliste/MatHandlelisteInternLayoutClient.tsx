'use client'

import MatHandlelisteSubnav from '@/components/matHandleliste/MatHandlelisteSubnav'
import MatHandlelisteTourProvider from '@/features/matHandleliste/MatHandlelisteTourProvider'

export default function MatHandlelisteInternLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <MatHandlelisteTourProvider>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MatHandlelisteSubnav />
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">{children}</div>
      </div>
    </MatHandlelisteTourProvider>
  )
}
