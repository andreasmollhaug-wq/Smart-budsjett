'use client'

import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import { topProductsByCheckCount } from './analyseHelpers'

export function EnkelHandlelisteAnalysePage() {
  const stats = useEnkelHandlelisteStore((s) => s.productStats)
  const top = useMemo(() => topProductsByCheckCount(stats, 90, 10), [stats])
  const maxCount = top.length > 0 ? top[0].checkCount : 1

  return (
    <div className="min-w-0">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Innsikt
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Siste 90 dager · basert på det du har huket av
        </p>
      </header>

      {top.length === 0 ? (
        <div className="mt-12 flex flex-col items-center px-6 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
            <BarChart3 size={28} aria-hidden />
          </span>
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Ingen innsikt ennå
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Huk av varer mens du handler, så viser vi hva du kjøper oftest her.
          </p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {top.map((s, i) => {
            const width = Math.max(8, Math.round((s.checkCount / maxCount) * 100))
            return (
              <li
                key={s.normalizedKey}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 1px 2px rgba(30,43,79,0.04), 0 4px 14px rgba(30,43,79,0.06)' }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: i === 0 ? 'var(--cta-gradient)' : 'var(--primary-pale)', color: i === 0 ? '#fff' : 'var(--primary)' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                      {s.displayName}
                    </span>
                    <span className="shrink-0 text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {s.checkCount}×
                    </span>
                  </div>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--primary-pale)' }}>
                    <span className="block h-full rounded-full" style={{ width: `${width}%`, background: 'var(--cta-gradient)' }} />
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
