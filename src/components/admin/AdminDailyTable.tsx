'use client'

import { useMemo } from 'react'
import { CalendarRange } from 'lucide-react'
import { cellTint, computeDailyDerived } from '@/lib/admin/adminDailyDisplay'
import type { AdminMetricsPayload } from '@/lib/admin/types'

function MetricCell({
  value,
  max,
  accent,
}: {
  value: number
  max: number
  accent: string
}) {
  const tint = cellTint(value, max, accent)
  return (
    <td
      className="px-4 py-3 text-right tabular-nums"
      style={{
        color: value > 0 ? 'var(--text)' : 'var(--text-muted)',
        fontWeight: value > 0 ? 600 : 400,
        ...tint,
      }}
    >
      {value}
    </td>
  )
}

/** Eldste dag øverst, i dag nederst — samme rekkefølge som i metrics.daily. */
export default function AdminDailyTable({
  daily,
  dailyTotals,
}: {
  daily: AdminMetricsPayload['daily']
  dailyTotals: AdminMetricsPayload['dailyTotals']
}) {
  const derived = useMemo(() => computeDailyDerived(daily, dailyTotals), [daily, dailyTotals])

  const maxReg = Math.max(1, ...daily.map((d) => d.registrations))
  const maxConfirmed = Math.max(1, ...daily.map((d) => d.confirmed))
  const maxCheckout = Math.max(1, ...daily.map((d) => d.checkouts))

  if (daily.length === 0) return null

  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--text) 5%, transparent)',
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-4 py-3 sm:px-5"
        style={{
          borderColor: 'var(--border)',
          background:
            'linear-gradient(90deg, color-mix(in srgb, var(--primary) 8%, var(--surface)) 0%, var(--surface) 100%)',
        }}
      >
        <CalendarRange size={18} style={{ color: 'var(--primary)' }} aria-hidden />
        <p className="text-sm font-medium">Daglig oversikt</p>
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th
                scope="col"
                className="sticky left-0 z-10 px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider sm:px-5 sm:text-xs"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
              >
                Dag
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-wider sm:text-xs"
                style={{ color: '#3B5BDB' }}
              >
                Registrert
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-wider sm:text-xs"
                style={{ color: '#099268' }}
              >
                Bekreftet
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-wider sm:px-5 sm:text-xs"
                style={{ color: '#7048E8' }}
              >
                Checkout
              </th>
            </tr>
          </thead>
          <tbody>
            {daily.map((row, index) => {
              const zebra = index % 2 === 1 && !row.isToday
              return (
                <tr
                  key={row.dateKey}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
                    background: row.isToday
                      ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                      : zebra
                        ? 'color-mix(in srgb, var(--text) 2%, var(--surface))'
                        : undefined,
                  }}
                >
                  <td
                    className="sticky left-0 z-10 whitespace-nowrap px-4 py-3 sm:px-5"
                    style={{
                      background: row.isToday
                        ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                        : zebra
                          ? 'color-mix(in srgb, var(--text) 2%, var(--surface))'
                          : 'var(--surface)',
                      color: 'var(--text)',
                      fontWeight: row.isToday ? 600 : 500,
                    }}
                  >
                    <span className="capitalize">{row.dayLabel}</span>
                    {row.isToday ? (
                      <span
                        className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide sm:text-[0.65rem]"
                        style={{
                          background: 'var(--primary)',
                          color: '#fff',
                        }}
                      >
                        I dag
                      </span>
                    ) : null}
                  </td>
                  <MetricCell value={row.registrations} max={maxReg} accent="#3B5BDB" />
                  <MetricCell value={row.confirmed} max={maxConfirmed} accent="#099268" />
                  <MetricCell value={row.checkouts} max={maxCheckout} accent="#7048E8" />
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr
              style={{
                background:
                  'linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, var(--bg)) 0%, var(--bg) 100%)',
                borderTop: '2px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
              }}
            >
              <td
                className="sticky left-0 z-10 px-4 py-3.5 text-sm font-semibold sm:px-5"
                style={{
                  background:
                    'linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, var(--bg)) 0%, var(--bg) 100%)',
                }}
              >
                Sum ({derived.dayCount} dager)
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums" style={{ color: '#3B5BDB' }}>
                {dailyTotals.registrations}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums" style={{ color: '#099268' }}>
                {dailyTotals.confirmed}
              </td>
              <td
                className="px-4 py-3.5 text-right text-sm font-bold tabular-nums sm:px-5"
                style={{ color: '#7048E8' }}
              >
                {dailyTotals.checkouts}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
