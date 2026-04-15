'use client'

import { useState, useRef, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Info, Percent } from 'lucide-react'
import type { SavingsRateMonthPoint } from '@/lib/dashboardOverviewHelpers'

const INFO_TEXT =
  'Forenklet nøkkeltall: (inntekt − utgift) / inntekt. Totalen gjelder hele valgt periode. Grafen viser samme beregning måned for måned innenfor perioden. Vises ikke når samlet inntekt er 0 eller negativ. Ikke skatte-, juridisk eller personlig rådgivning.'

type ChartRow = { name: string; sparegrad: number | null }

type Props = {
  periodLabel: string
  aggregateRatePct: number | null
  trend: SavingsRateMonthPoint[]
}

export default function DashboardSavingsRateCard({ periodLabel, aggregateRatePct, trend }: Props) {
  const [infoOpen, setInfoOpen] = useState(false)
  const infoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const close = (e: PointerEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [infoOpen])

  const chartData: ChartRow[] = trend.map((p) => ({
    name: p.monthLabel,
    sparegrad: p.ratePct,
  }))

  const numericRates = trend.map((p) => p.ratePct).filter((x): x is number => x != null && Number.isFinite(x))
  const dataMin = numericRates.length > 0 ? Math.min(...numericRates) : 0
  const dataMax = numericRates.length > 0 ? Math.max(...numericRates) : 0
  const yMin = Math.min(0, dataMin)
  const yMax = Math.max(0, dataMax)
  const span = Math.max(yMax - yMin, 1e-6)
  const pad = Math.max(1, span * 0.08)
  let low = yMin - pad
  const high = yMax + pad
  if (numericRates.length > 0 && numericRates.every((r) => r >= 0)) {
    low = Math.max(0, low)
  }
  const domain: [number, number] = [Math.floor(low), Math.ceil(high)]

  const hasAnyPoint = numericRates.length > 0

  return (
    <div
      className="flex h-full min-w-0 w-full flex-col rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
              Sparegrad
            </span>
            <div className="relative shrink-0 flex items-start" ref={infoWrapRef}>
              <button
                type="button"
                onClick={() => setInfoOpen((o) => !o)}
                aria-expanded={infoOpen}
                aria-label="Mer om sparegrad"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <Info size={18} strokeWidth={2} aria-hidden />
              </button>
              {infoOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1.5 w-[min(calc(100vw-2rem),18rem)] max-w-[calc(100vw-2rem)] rounded-xl p-3 text-left shadow-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  role="region"
                >
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {INFO_TEXT}
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: 'var(--text)' }}>
            {aggregateRatePct === null ? '–' : `${aggregateRatePct.toFixed(1)} %`}
          </p>
          <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
            {periodLabel} · total for perioden
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#49505720' }}
        >
          <Percent size={20} style={{ color: '#495057' }} aria-hidden />
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <p className="mb-2 shrink-0 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Utvikling måned for måned
        </p>
        {!hasAnyPoint ? (
          <p
            className="flex min-h-[12rem] flex-1 items-center justify-center rounded-xl px-2 text-center text-sm"
            style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}
          >
            Ingen måneder med positiv inntekt i perioden — ingen graf å vise.
          </p>
        ) : (
          <div className="min-h-[200px] w-full min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6B7A99', fontSize: 11 }}
                  interval={trend.length > 8 ? 'preserveStartEnd' : 0}
                  angle={trend.length > 6 ? -30 : 0}
                  textAnchor={trend.length > 6 ? 'end' : 'middle'}
                  height={trend.length > 6 ? 52 : 30}
                />
                <YAxis
                  domain={domain}
                  tickFormatter={(v) => `${Math.round(v)}%`}
                  tick={{ fill: '#6B7A99', fontSize: 11 }}
                  width={40}
                />
                <Tooltip
                  formatter={(v) =>
                    v == null || v === '' || Number.isNaN(Number(v)) ? '–' : `${Number(v).toFixed(1)} %`
                  }
                  labelFormatter={(label) => `Måned: ${label}`}
                />
                <ReferenceLine y={0} stroke="#ADB5BD" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="sparegrad"
                  stroke="#495057"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#495057', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  name="Sparegrad"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
