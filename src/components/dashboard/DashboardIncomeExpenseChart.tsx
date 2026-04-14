'use client'

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatNOK } from '@/lib/utils'

export type DashboardIncomeExpensePoint = { month: string; inntekt: number; utgift: number; netto: number }

export default function DashboardIncomeExpenseChart({ data }: { data: DashboardIncomeExpensePoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        Ingen måneder i vinduet for valgt budsjettår.
      </p>
    )
  }

  const maxIncomeExpense = Math.max(1, ...data.flatMap((d) => [d.inntekt, d.utgift]))
  const minNet = Math.min(0, ...data.map((d) => d.netto))
  const maxNet = Math.max(0, ...data.map((d) => d.netto))
  const yMax = Math.max(maxIncomeExpense * 1.05, maxNet * 1.05)
  const yMin = Math.min(0, minNet * 1.05)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B5BDB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3B5BDB" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E03131" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#E03131" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
        <XAxis dataKey="month" tick={{ fill: '#6B7A99', fontSize: 12 }} />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          tick={{ fill: '#6B7A99', fontSize: 12 }}
        />
        <Tooltip
          formatter={(v, name) => [formatNOK(v == null ? 0 : Number(v)), String(name)]}
          labelFormatter={(label) => `Måned: ${label}`}
        />
        <ReferenceLine y={0} stroke="#ADB5BD" strokeDasharray="4 4" />
        <Area type="monotone" dataKey="inntekt" stroke="#3B5BDB" strokeWidth={2} fill="url(#income)" name="Inntekt" />
        <Area type="monotone" dataKey="utgift" stroke="#E03131" strokeWidth={2} fill="url(#expense)" name="Utgifter" />
        <Line
          type="monotone"
          dataKey="netto"
          stroke="#0CA678"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#0CA678', strokeWidth: 0 }}
          name="Netto (inntekt − utgift)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
