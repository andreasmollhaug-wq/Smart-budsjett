import { Suspense } from 'react'
import RorleggerAllePage from '@/features/rorlegger-prosjekter/RorleggerAllePage'

function FallBack() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center p-8 text-sm"
      style={{ color: 'var(--text-muted)' }}
    >
      Laster filtre…
    </div>
  )
}

export default function RorleggerAlleRoutePage() {
  return (
    <Suspense fallback={<FallBack />}>
      <RorleggerAllePage />
    </Suspense>
  )
}
