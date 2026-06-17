'use client'

import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { EnkelHandlelistePageShell } from './EnkelHandlelistePageShell'
import { EnkelHandlelisteBottomNav } from './components/EnkelHandlelisteBottomNav'
import { ENKEL_HANDLELISTE_SHOW_INTERNAL_BANNER } from './featureFlags'

export default function EnkelHandlelisteInternLayoutClient({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" style={{ background: 'var(--bg)' }}>
      {ENKEL_HANDLELISTE_SHOW_INTERNAL_BANNER && (
        <div
          className="flex shrink-0 items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium"
          style={{
            background: 'var(--primary-pale)',
            color: 'var(--primary)',
            paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))',
          }}
        >
          <FlaskConical size={13} aria-hidden />
          Intern test — /intern/enkel-handleliste
        </div>
      )}
      <EnkelHandlelistePageShell>{children}</EnkelHandlelistePageShell>
      <EnkelHandlelisteBottomNav />
    </div>
  )
}
