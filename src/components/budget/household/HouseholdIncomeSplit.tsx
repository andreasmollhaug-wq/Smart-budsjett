'use client'

import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { HouseholdMemberPeriodTotals } from '@/lib/householdDashboardData'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { useStore } from '@/lib/store'
import { chartColorsForUiPalette } from '@/lib/uiColorPalette'

const REST_COLORS = ['#0CA678', '#F08C00', '#AE3EC9', '#7048E8', '#E03131']

type Row = { name: string; value: number; fill: string }

export default function HouseholdIncomeSplit({ members }: { members: HouseholdMemberPeriodTotals[] }) {
  const { formatNOK } = useNokDisplayFormatters()
  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const sliceColors = useMemo(() => {
    const { primary } = chartColorsForUiPalette(uiColorPalette)
    return [primary, ...REST_COLORS]
  }, [uiColorPalette])
  const data: Row[] = members
    .filter((m) => m.budgetedIncome > 0)
    .map((m, i) => ({
      name: m.name,
      value: m.budgetedIncome,
      fill: sliceColors[i % sliceColors.length]!,
    }))

  if (data.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        Ingen budsjettert inntekt i perioden.
      </p>
    )
  }

  return (
    <div className="w-full min-w-0" style={{ minHeight: 220 }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={44}
            outerRadius={78}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatNOK(Number(value ?? 0))}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-1.5 space-y-0.5 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        {members.map((m) => (
          <li key={m.profileId} className="flex justify-between gap-2 tabular-nums">
            <span className="truncate min-w-0">{m.name}</span>
            <span>
              {formatNOK(m.budgetedIncome)}
              {m.incomeShareOfHousehold > 0 && (
                <span className="ml-2 opacity-80">({(m.incomeShareOfHousehold * 100).toFixed(0)} %)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
