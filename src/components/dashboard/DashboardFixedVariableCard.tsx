'use client'

import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  fixed: number
  variable: number
  periodLabel: string
}

export default function DashboardFixedVariableCard({ fixed, variable, periodLabel }: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const total = fixed + variable
  const data = [
    { name: 'Fest', value: fixed, fill: '#4C6EF5' },
    { name: 'Variabelt', value: variable, fill: '#868E96' },
  ].filter((d) => d.value > 0)

  return (
    <div
      className="min-w-0 w-full max-w-[min(100%,20rem)] rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Fast og variabelt forbruk
      </h2>
      <p className="text-xs mb-3 leading-snug" style={{ color: 'var(--text-muted)' }}>
        Faktiske utgifter · {periodLabel}. <strong style={{ color: 'var(--text)' }}>Fast</strong> = faste poster og
        trekk; <strong style={{ color: 'var(--text)' }}>variabelt</strong> = øvrige utgifter.
      </p>

      {total <= 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen utgifter i perioden ennå.
        </p>
      ) : (
        <div className="flex flex-row items-center gap-3 sm:gap-4">
          <div className="h-[100px] w-[100px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.length > 0 ? data : [{ name: 'Tom', value: 1, fill: 'var(--border)' }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  paddingAngle={2}
                >
                  {(data.length > 0 ? data : [{ name: 'Tom', value: 1, fill: '#E9ECEF' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNOK(v == null ? 0 : Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-2.5 py-2" style={{ background: 'var(--bg)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Fast
              </span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: '#4C6EF5' }}>
                {formatNOK(fixed)}{' '}
                <span className="text-xs font-normal opacity-80">
                  ({total > 0 ? ((fixed / total) * 100).toFixed(0) : 0} %)
                </span>
              </span>
            </div>
            <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-2.5 py-2" style={{ background: 'var(--bg)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Variabelt
              </span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: '#868E96' }}>
                {formatNOK(variable)}{' '}
                <span className="text-xs font-normal opacity-80">
                  ({total > 0 ? ((variable / total) * 100).toFixed(0) : 0} %)
                </span>
              </span>
            </div>
            <p className="text-xs pt-0.5" style={{ color: 'var(--text-muted)' }}>
              Sum: {formatNOK(total)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
