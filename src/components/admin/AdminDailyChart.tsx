'use client'

import type { AdminMetricsPayload } from '@/lib/admin/types'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function AdminDailyChart({ daily }: { daily: AdminMetricsPayload['daily'] }) {
  if (daily.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        Ingen dagdata ennå.
      </p>
    )
  }

  const data = daily.map((d) => ({
    dag: d.isToday ? `${d.dayLabel} (i dag)` : d.dayLabel,
    registreringer: d.registrations,
    bekreftet: d.confirmed,
    checkout: d.checkouts,
  }))

  return (
    <div className="min-w-0">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="dag"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
            angle={-35}
            textAnchor="end"
            height={56}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 13,
            }}
            labelStyle={{ color: 'var(--text)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="registreringer"
            name="Registreringer"
            stroke="#3B5BDB"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="bekreftet"
            name="Bekreftet"
            stroke="#099268"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="checkout"
            name="Checkout"
            stroke="#7048E8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
