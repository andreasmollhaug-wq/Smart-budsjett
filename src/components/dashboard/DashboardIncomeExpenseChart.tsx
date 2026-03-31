'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatNOK } from '@/lib/utils'

const monthlyData = [
  { month: 'okt', inntekt: 55000, utgift: 38000 },
  { month: 'nov', inntekt: 55000, utgift: 41000 },
  { month: 'des', inntekt: 62000, utgift: 52000 },
  { month: 'jan', inntekt: 55000, utgift: 36000 },
  { month: 'feb', inntekt: 55000, utgift: 39000 },
  { month: 'mar', inntekt: 55000, utgift: 37000 },
]

export default function DashboardIncomeExpenseChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={monthlyData}>
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
        <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fill: '#6B7A99', fontSize: 12 }} />
        <Tooltip formatter={(v) => formatNOK(v == null ? 0 : Number(v))} />
        <Area type="monotone" dataKey="inntekt" stroke="#3B5BDB" strokeWidth={2} fill="url(#income)" name="Inntekt" />
        <Area type="monotone" dataKey="utgift" stroke="#E03131" strokeWidth={2} fill="url(#expense)" name="Utgifter" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
