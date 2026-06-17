'use client'

import type { ReactNode } from 'react'

export function EnkelHandlelistePageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
      style={{
        background: 'var(--bg)',
        paddingLeft: 'max(0.875rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.875rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div className="mx-auto w-full max-w-xl flex-1 px-1 pt-5 pb-28 sm:px-2 sm:pt-7">
        {children}
      </div>
    </div>
  )
}
