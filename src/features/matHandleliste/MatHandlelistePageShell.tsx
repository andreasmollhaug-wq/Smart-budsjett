'use client'

import type { ReactNode } from 'react'

export function MatHandlelistePageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto px-3 py-4 sm:px-4 md:px-6"
      style={{
        background: 'var(--bg)',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {children}
    </div>
  )
}
