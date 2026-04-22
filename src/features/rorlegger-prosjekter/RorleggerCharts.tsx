'use client'

import { formatNOKChartLabel } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const BAR_COLORS = ['#4C6EF5', '#15AABF', '#40C057', '#FAB005']

type RegionRow = { name: string; actualNok: number; budgetNok: number }

export function RorleggerRegionBarChart({ data }: { data: RegionRow[] }) {
  return (
    <div
      className="min-w-0 w-full rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="mb-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--text)' }}>
        Faktisert per region
      </h2>
      <p className="mb-4 text-xs leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        Summer av faktisk kostnad (demo) — søyler viser faktisert beløp per region.
      </p>
      <div className="h-[220px] min-h-[220px] w-full sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={(v) => formatNOKChartLabel(Number(v))}
            />
            <Tooltip
              formatter={(value) => {
                if (value == null) return '—'
                const n = typeof value === 'number' ? value : Number(value)
                return Number.isFinite(n) ? `${formatNOKChartLabel(n)} kr` : String(value)
              }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                color: 'var(--text)',
              }}
            />
            <Bar dataKey="actualNok" name="Faktisert" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

type ContractSlice = { name: string; value: number; key: string }

export function RorleggerContractPieChart({ data }: { data: ContractSlice[] }) {
  const fills = ['#4C6EF5', '#868E96']
  const total = data.reduce((a, d) => a + d.value, 0)

  return (
    <div
      className="min-w-0 w-full rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="mb-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--text)' }}>
        Avtaleform (antall prosjekter)
      </h2>
      <p className="mb-4 text-xs leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        Fordeling mellom fastpris og løpende regning.
      </p>
      {total <= 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen data.
        </p>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
          <div className="h-[140px] w-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={62}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={fills[i % fills.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => (v == null ? ['—', 'Antall'] : [v, 'Antall'])}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="w-full max-w-xs space-y-2 text-sm" style={{ color: 'var(--text)' }}>
            {data.map((d, i) => (
              <li key={d.key} className="flex min-h-[44px] items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: fills[i % fills.length] }}
                    aria-hidden
                  />
                  {d.name}
                </span>
                <span className="font-semibold tabular-nums">
                  {d.value}
                  {total > 0 ? ` (${((d.value / total) * 100).toFixed(0)} %)` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
