'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatNOK } from '@/lib/utils'

/** Premium palett med tydelig kontrast (blå, grønn, bær, gull …), fortsatt dempet metning. */
const COLORS = [
  '#3D63B8',
  '#2F8F78',
  '#B8893A',
  '#7D5BA8',
  '#3D7BA3',
  '#C45C6A',
  '#5A7D6E',
  '#8B6F4A',
]

export type SubscriptionDonutRow = {
  profileId: string
  name: string
  monthly: number
  yearly: number
}

type ChartRow = { name: string; value: number; fill: string; yearly: number }

export default function SubscriptionHouseholdDonut({
  rows,
  totalMonthly,
}: {
  rows: SubscriptionDonutRow[]
  totalMonthly: number
}) {
  if (totalMonthly <= 0) {
    return (
      <p className="text-sm py-6 text-center rounded-2xl border px-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        Ingen kostnad å fordele.
      </p>
    )
  }

  if (rows.length === 1) {
    const r = rows[0]!
    return (
      <div
        className="rounded-2xl border px-4 py-4 text-center text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
      >
        Hele beløpet ({formatNOK(totalMonthly)} / mnd · {formatNOK(r.yearly)} / år) er knyttet til{' '}
        <strong style={{ color: 'var(--text)' }}>{r.name}</strong>.
      </div>
    )
  }

  const chartData: ChartRow[] = rows
    .filter((r) => r.monthly > 0)
    .map((r, i) => ({
      name: r.name,
      value: r.monthly,
      yearly: r.yearly,
      fill: COLORS[i % COLORS.length]!,
    }))

  if (chartData.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        Ingen fordeling å vise.
      </p>
    )
  }

  return (
    <div className="w-full min-w-0">
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>
        Fordeling av månedskostnad
      </p>
      <div className="h-[200px] w-full sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={82}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, item) => {
                const v = Number(value ?? 0)
                const pct = totalMonthly > 0 ? (v / totalMonthly) * 100 : 0
                const payload = item?.payload as ChartRow | undefined
                const y = payload?.yearly
                const yPart = y !== undefined ? ` · ${formatNOK(y)} / år` : ''
                const label = typeof name === 'string' ? name : String(name ?? '')
                return [`${formatNOK(v)} / mnd (${pct.toFixed(pct >= 10 ? 0 : 1)} %)${yPart}`, label]
              }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        {chartData.map((row) => {
          const pct = totalMonthly > 0 ? (row.value / totalMonthly) * 100 : 0
          return (
            <li
              key={row.name}
              className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center tabular-nums py-0.5 sm:py-1"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.fill }} aria-hidden />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="shrink-0 text-left sm:text-right pl-7 sm:pl-0">
                {formatNOK(row.value)} / mnd
                <span className="opacity-80 ml-1">({pct.toFixed(pct >= 10 ? 0 : 1)} %)</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
