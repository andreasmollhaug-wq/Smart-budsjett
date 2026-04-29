'use client'

import { useMemo, useState } from 'react'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { buildPieSlicesWithOther } from '@/lib/sparingAnalyseDerived'
import type { AnalyseGoalShareRow } from '@/lib/sparingAnalyseDerived'
import type { SavingsGoal } from '@/lib/store'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

/** Antall enkeltvise slisser i pai før resten slås til «Øvrige». */
const PIE_TOP_SLICES = 7
/** Antall tabellrader før «Vis alle». */
const TABLE_INITIAL_ROWS = 8

type PieDatum = {
  name: string
  value: number
  fill: string
  pctOfPositiveTotal: number
}

type Props = {
  goalShares: AnalyseGoalShareRow[]
  filteredGoals: SavingsGoal[]
  chartPrimary: string
}

function targetAmountForGoal(goals: SavingsGoal[], goalId: string): number | undefined {
  return goals.find((g) => g.id === goalId)?.targetAmount
}

export default function SparingAnalyseGoalDistribution({ goalShares, filteredGoals, chartPrimary }: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const [expanded, setExpanded] = useState(false)

  const { slices, totalPositive } = useMemo(
    () => buildPieSlicesWithOther(goalShares, PIE_TOP_SLICES),
    [goalShares],
  )

  const pieData: PieDatum[] = useMemo(
    () =>
      slices.map((s) => ({
        name: s.name,
        value: s.value,
        fill: s.color || chartPrimary,
        pctOfPositiveTotal: s.pctOfPositiveTotal,
      })),
    [slices, chartPrimary],
  )

  const sortedShares = useMemo(
    () => [...goalShares].sort((a, b) => b.effectiveNok - a.effectiveNok),
    [goalShares],
  )

  const tableRows = useMemo(
    () => (expanded ? sortedShares : sortedShares.slice(0, TABLE_INITIAL_ROWS)),
    [expanded, sortedShares],
  )

  const showExpandToggle = sortedShares.length > TABLE_INITIAL_ROWS

  if (pieData.length === 0 || totalPositive <= 0) {
    return (
      <div
        className="w-full min-w-0 rounded-2xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen positiv effektiv sparing å vise i diagrammet (nullstill mål eller legg til sparing).
        </p>
      </div>
    )
  }

  return (
    <div
      className="w-full min-w-0 rounded-2xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 flex flex-col items-center justify-start">
          <div className="relative mx-auto h-[260px] w-full max-w-[280px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="var(--surface)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatNOK(Number(value ?? 0))}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as PieDatum | undefined
                    const pct = p?.pctOfPositiveTotal
                    return pct != null ? `${label} (${pct} %)` : String(label)
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
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
              <div className="text-center">
                <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Totalt
                </div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNOK(totalPositive)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full min-w-0 border-collapse text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                    Mål
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    Spart
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    Andel
                  </th>
                  <th
                    scope="col"
                    className="hidden px-3 py-2 text-right font-semibold tabular-nums sm:table-cell"
                    style={{ color: 'var(--text)' }}
                  >
                    Målbeløp
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => {
                  const target = targetAmountForGoal(filteredGoals, r.goalId)
                  return (
                    <tr key={r.goalId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="max-w-[12rem] px-3 py-2 font-medium sm:max-w-none" style={{ color: 'var(--text)' }}>
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-sm border"
                            style={{ background: r.color || chartPrimary, borderColor: 'var(--border)' }}
                            aria-hidden
                          />
                          <span className="min-w-0 truncate" title={r.name}>
                            {r.name}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatNOK(r.effectiveNok)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {r.pctOfTotal} %
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                        {target != null ? formatNOK(target) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {showExpandToggle ? (
            <button
              type="button"
              className="mt-2 flex w-full min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{ color: 'var(--primary)', background: 'transparent' }}
              aria-expanded={expanded}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <>
                  Skjul
                  <ChevronUp className="size-4 shrink-0" aria-hidden />
                </>
              ) : (
                <>
                  Vis alle mål
                  <ChevronDown className="size-4 shrink-0" aria-hidden />
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
