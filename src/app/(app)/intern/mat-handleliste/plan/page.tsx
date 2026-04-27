import { MatHandlelistePlanPage } from '@/features/matHandleliste/MatHandlelistePlanPage'
import { Suspense } from 'react'

export default function InternMatHandlelistePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Laster plan…
        </div>
      }
    >
      <MatHandlelistePlanPage />
    </Suspense>
  )
}
