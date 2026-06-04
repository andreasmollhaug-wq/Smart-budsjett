'use client'

import type { AdminMetricsPayload } from '@/lib/admin/types'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function AdminWeeklyChart({ weekly }: { weekly: AdminMetricsPayload['weekly'] }) {
  if (weekly.length === 0) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        Ingen ukedata ennå.
      </p>
    )
  }

  const data = weekly.map((w) => ({
    uke: w.weekLabel,
    registreringer: w.registrations,
    bekreftet: w.confirmed,
    checkout: w.checkouts,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="uke"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
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
        <Bar dataKey="registreringer" name="Registreringer" fill="#3B5BDB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="bekreftet" name="Bekreftet" fill="#099268" radius={[4, 4, 0, 0]} />
        <Bar dataKey="checkout" name="Checkout" fill="#7048E8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
