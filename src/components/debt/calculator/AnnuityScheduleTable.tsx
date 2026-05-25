'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { SCHEDULE_VIRTUAL_THRESHOLD } from '@/components/debt/calculator/calculatorUiUtils'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { AmortizationRow } from '@/lib/mortgageCalculator'

const ROW_H = 44

export const SCHEDULE_GRID =
  'grid gap-0 items-center min-w-[28rem] grid-cols-[2.5rem_1fr_1fr_1fr_1fr] sm:min-w-[36rem]'

function ScheduleTableHeader() {
  return (
    <div
      className={`${SCHEDULE_GRID} px-2 py-2 text-xs font-semibold border-b sticky top-0 z-10`}
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    >
      <span>Mnd</span>
      <span className="text-right">Termin</span>
      <span className="text-right">Renter</span>
      <span className="text-right">Avdrag</span>
      <span className="text-right">Restgjeld</span>
    </div>
  )
}

function ScheduleRow({ row }: { row: AmortizationRow }) {
  const { formatNOK } = useNokDisplayFormatters()
  return (
    <>
      <span style={{ color: 'var(--text)' }}>{row.monthIndex}</span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text)' }}>
        {formatNOK(row.payment)}
      </span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {formatNOK(row.interest)}
      </span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {formatNOK(row.principal)}
      </span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {formatNOK(row.balanceAfter)}
      </span>
    </>
  )
}

function ScheduleTableSimple({ rows }: { rows: AmortizationRow[] }) {
  return (
    <div
      className="overflow-x-auto overscroll-x-contain rounded-xl border touch-manipulation"
      style={{ borderColor: 'var(--border)' }}
    >
      <ScheduleTableHeader />
      {rows.map((row) => (
        <div
          key={row.monthIndex}
          className={`${SCHEDULE_GRID} px-2 py-2 text-sm border-b`}
          style={{ borderColor: 'var(--border)' }}
        >
          <ScheduleRow row={row} />
        </div>
      ))}
    </div>
  )
}

function ScheduleTableVirtual({ rows }: { rows: AmortizationRow[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 20,
  })
  const vItems = virtualizer.getVirtualItems()

  return (
    <div
      className="overflow-x-auto overscroll-x-contain rounded-xl border touch-manipulation"
      style={{ borderColor: 'var(--border)' }}
    >
      <div ref={parentRef} className="max-h-[min(70vh,520px)] overflow-auto overscroll-y-contain touch-manipulation">
        <ScheduleTableHeader />
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {vItems.map((vi) => {
            const row = rows[vi.index]
            if (!row) return null
            return (
              <div
                key={vi.key}
                className={`${SCHEDULE_GRID} px-2 py-2 text-sm border-b absolute left-0 w-full min-w-[28rem] sm:min-w-[36rem]`}
                style={{
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                  borderColor: 'var(--border)',
                }}
              >
                <ScheduleRow row={row} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AnnuityScheduleTable({ rows }: { rows: AmortizationRow[] }) {
  if (rows.length === 0) return null
  if (rows.length >= SCHEDULE_VIRTUAL_THRESHOLD) {
    return <ScheduleTableVirtual rows={rows} />
  }
  return <ScheduleTableSimple rows={rows} />
}
