'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { MonthRow } from '@/lib/formuebyggerPro'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

const ROW_H = 40
const VIRTUAL_THRESHOLD = 120

const grid =
  'grid gap-0 items-center min-w-[920px] grid-cols-[minmax(3rem,4rem)_minmax(2.5rem,3rem)_minmax(5.5rem,1fr)_minmax(5rem,1fr)_minmax(7rem,1.2fr)_minmax(5.5rem,1fr)_minmax(4.5rem,1fr)_minmax(6rem,1fr)_minmax(6.5rem,1fr)_minmax(6rem,1fr)]'

function RowCells({
  row,
  onExtraChange,
}: {
  row: MonthRow
  onExtraChange: (globalMonthIndex: number, value: number) => void
}) {
  const { formatNOK } = useNokDisplayFormatters()
  return (
    <>
      <span style={{ color: 'var(--text)' }}>{row.globalMonthIndex + 1}</span>
      <span style={{ color: 'var(--text)' }}>{row.yearIndex + 1}</span>
      <span style={{ color: 'var(--text-muted)' }}>{formatNOK(row.ib)}</span>
      <span style={{ color: 'var(--text-muted)' }}>{formatNOK(row.savings)}</span>
      <span>
        <input
          type="number"
          min={0}
          step={100}
          className="w-full rounded-lg px-2 py-1 text-sm border max-w-[9rem]"
          style={{
            background: 'var(--primary-pale)',
            borderColor: 'var(--primary)',
            color: 'var(--text)',
          }}
          value={row.extra === 0 ? '' : row.extra}
          placeholder="0"
          onChange={(e) => {
            const v = e.target.value === '' ? 0 : Number(e.target.value)
            onExtraChange(row.globalMonthIndex, Number.isFinite(v) ? Math.max(0, v) : 0)
          }}
        />
      </span>
      <span style={{ color: 'var(--text-muted)' }}>{formatNOK(row.grossReturn)}</span>
      <span style={{ color: 'var(--text-muted)' }}>{formatNOK(row.tax)}</span>
      <span style={{ color: 'var(--text)' }}>{formatNOK(row.ub)}</span>
      <span style={{ color: 'var(--text-muted)' }}>{formatNOK(row.cumulativePeriodicSavings)}</span>
      <span style={{ color: 'var(--text-muted)' }}>{formatNOK(row.realValue)}</span>
    </>
  )
}

function HeaderRow() {
  return (
    <div
      className={`${grid} px-2 py-2 text-xs font-semibold border-b sticky top-0 z-10`}
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    >
      <span>Mnd #</span>
      <span>År</span>
      <span>IB</span>
      <span>Sparing</span>
      <span>Ekstra</span>
      <span>Avkastning</span>
      <span>Skatt</span>
      <span>UB</span>
      <span>Kum. sparing</span>
      <span>Reell verdi</span>
    </div>
  )
}

function SimpleTable({
  rows,
  onExtraChange,
}: {
  rows: MonthRow[]
  onExtraChange: (globalMonthIndex: number, value: number) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <HeaderRow />
      {rows.map((row) => (
        <div
          key={row.globalMonthIndex}
          className={`${grid} px-2 py-2 text-sm border-b`}
          style={{ borderColor: 'var(--border)' }}
        >
          <RowCells row={row} onExtraChange={onExtraChange} />
        </div>
      ))}
    </div>
  )
}

function VirtualTable({
  rows,
  onExtraChange,
}: {
  rows: MonthRow[]
  onExtraChange: (globalMonthIndex: number, value: number) => void
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 25,
  })

  const vItems = virtualizer.getVirtualItems()

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <div ref={parentRef} className="max-h-[min(70vh,520px)] overflow-auto">
        <HeaderRow />
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {vItems.map((vi) => {
            const row = rows[vi.index]
            if (!row) return null
            return (
              <div
                key={vi.key}
                className={`${grid} px-2 py-2 text-sm border-b absolute left-0 w-full min-w-[920px]`}
                style={{
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                  borderColor: 'var(--border)',
                }}
              >
                <RowCells row={row} onExtraChange={onExtraChange} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function FormuebyggerMonthlyTable(props: {
  rows: MonthRow[]
  onExtraChange: (globalMonthIndex: number, value: number) => void
}) {
  if (props.rows.length > VIRTUAL_THRESHOLD) {
    return <VirtualTable {...props} />
  }
  return <SimpleTable {...props} />
}
