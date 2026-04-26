'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { HjemflytBarnDashboard } from './HjemflytBarnDashboard'

function firstChildProfileId(profiles: { id: string; hjemflyt?: { kind?: string } }[]): string | null {
  const c = profiles.find((p) => p.hjemflyt?.kind === 'child')
  return c?.id ?? null
}

/**
 * Rute for barnevennlig visning. Barn som er innlogget ser sin egen visning; voksne ser forhåndsvisning for første barneprofil.
 */
export function HjemFlytBarnRoutePage() {
  const activeProfileId = useStore((s) => s.activeProfileId)
  const profiles = useStore((s) => s.profiles)
  const active = profiles.find((p) => p.id === activeProfileId)
  const activeIsChild = active?.hjemflyt?.kind === 'child'

  const childIdFallback = useMemo(() => firstChildProfileId(profiles), [profiles])

  const viewProfileId = activeIsChild ? activeProfileId : childIdFallback
  const isPreviewMode = !activeIsChild && childIdFallback != null

  if (viewProfileId == null) {
    return (
      <div
        className="min-h-0 min-w-0 flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 py-8 text-center"
        style={{
          background: 'var(--bg)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <p className="text-base max-w-md" style={{ color: 'var(--text-muted)' }}>
          Barnevisning krever minst én profil markert som barn. Legg det til under Konto → Profiler.
        </p>
        <Link
          href="/konto/profiler"
          className="mt-4 min-h-[44px] inline-flex items-center px-5 rounded-xl text-sm font-medium touch-manipulation"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          Gå til profiler
        </Link>
      </div>
    )
  }

  return (
    <div
      className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto px-3 py-4 sm:px-4"
      style={{
        background: 'var(--bg)',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <HjemflytBarnDashboard viewProfileId={viewProfileId} isPreviewMode={isPreviewMode} />
    </div>
  )
}
