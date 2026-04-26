'use client'

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyBudgetActualPoint } from '@/lib/bankReportData'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

export default function BudgetDashboardMonthlyChart({
  series,
  year,
}: {
  series: MonthlyBudgetActualPoint[]
  year: number
}) {
  const { formatNOK } = useNokDisplayFormatters()
  const data = series.map((p) => {
    const netBudgeted = p.budgetedIncome - p.budgetedExpense
    const netActual = p.actualIncome - p.actualExpense
    return {
      ...p,
      netBudgeted,
      netActual,
      varianceNet: netActual - netBudgeted,
    }
  })

  return (
    <div className="w-full min-w-0" style={{ minHeight: 260 }}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => formatNOK(Number(value ?? 0))}
            labelFormatter={(label) => `${label} ${year}`}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="netBudgeted"
            name="Budsjettert netto"
            stroke="#3B5BDB"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="netActual"
            name="Faktisk netto"
            stroke="#0CA678"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="varianceNet"
            name="Netto avvik"
            stroke="#FD7E14"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
