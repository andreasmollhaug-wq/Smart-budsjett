'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
import {
  copyMonthToNext,
  toggleDailyCompletion,
  toggleMonthlySlot,
  toggleWeeklyCompletion,
  updateDailyGoalTotal,
} from './actions'
import type { SmartvaneSerializableBundle } from './types'
import { smartvanePaths } from './paths'
import { weekRowDayRange } from './weekRow'
import { buildDailySummaryPoints } from './insights'
import { SmartvaneMonthHeatmap } from './SmartvaneMonthHeatmap'
import { smartvanePageInnerWide } from './layoutClasses'
import { dailyCompletedCountByDay, localTodayYmd } from './smartvaneBundleHelpers'

const MONTHS_NO = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
]

type Props = {
  bundle: SmartvaneSerializableBundle
  year: number
  month: number
  profileId: string
}

function prevNextMonth(y: number, m: number): { p: { y: number; m: number }; n: { y: number; m: number } } {
  let pm = m - 1
  let py = y
  if (pm < 1) {
    pm = 12
    py -= 1
  }
  let nm = m + 1
  let ny = y
  if (nm > 12) {
    nm = 1
    ny += 1
  }
  return { p: { y: py, m: pm }, n: { y: ny, m: nm } }
}

export default function SmartvaneMonthView({ bundle, year, month, profileId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const plan = bundle.plan
  if (!plan) return null

  const { p, n } = prevNextMonth(year, month)
  const dailyHabits = bundle.habits.filter((h) => h.kind === 'daily')
  const weeklyHabits = bundle.habits.filter((h) => h.kind === 'weekly')
  const monthlyHabits = bundle.habits.filter((h) => h.kind === 'monthly')

  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyIds = dailyHabits.map((h) => h.id)
  const completedMap = dailyCompletedCountByDay(dailyIds, bundle, year, month)

  const points = buildDailySummaryPoints({
    daysInMonth,
    year,
    month,
    completedCountByDay: completedMap,
    dailyHabitCount: Math.max(1, dailyIds.length),
    dailyGoalTotal: plan.daily_goal_total,
  })

  const chartData = points.map((pt) => ({
    day: String(new Date(pt.date + 'T12:00:00').getDate()),
    pct: Math.round(pt.ratio * 100),
    met: pt.dailyGoalMet,
  }))

  const totalDailySlots = Math.max(1, dailyIds.length * daysInMonth)
  let doneCells = 0
  for (const h of dailyHabits) {
    doneCells += (bundle.dailyCompleted[h.id] ?? []).filter((d) =>
      d.startsWith(`${year}-${String(month).padStart(2, '0')}`),
    ).length
  }
  const monthFrac = Math.min(1, doneCells / totalDailySlots)
  const monthPct = Math.round(monthFrac * 100)

  const pieData =
    monthPct >= 100
      ? [{ name: 'full', value: 100 }]
      : monthPct <= 0
        ? [{ name: 'empty', value: 100 }]
        : [
            { name: 'Fullført', value: Math.max(2, monthPct) },
            { name: 'Igjen', value: Math.max(2, 100 - monthPct) },
          ]

  const run = (fn: () => Promise<{ ok: boolean }>) => {
    startTransition(async () => {
      const r = await fn()
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className={smartvanePageInnerWide}>
      <div data-sv-tour="month-overview">
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-center sm:justify-end">
          <div data-sv-tour="month-nav" className="flex items-center gap-2 shrink-0">
            <Link
              href={`${smartvanePaths.month}?y=${p.y}&m=${p.m}`}
              aria-label="Forrige måned"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border text-sm font-medium touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              ←
            </Link>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {MONTHS_NO[month - 1]} {year}
            </span>
            <Link
              href={`${smartvanePaths.month}?y=${n.y}&m=${n.m}`}
              aria-label="Neste måned"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border text-sm font-medium touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              →
            </Link>
          </div>
        </div>

        <div data-sv-tour="month-charts" className="grid gap-4 md:grid-cols-[1fr_140px] min-w-0 mb-4">
        <div className="min-h-[220px] min-w-0 smartvane-recharts-no-focus">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                }}
                formatter={(v) => [`${Number(v ?? 0)} %`, 'Fullføring']}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      dailyIds.length === 0
                        ? 'var(--border)'
                        : entry.met
                          ? 'var(--success)'
                          : 'var(--warning)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-center justify-center min-w-0">
          <p className="text-xs font-medium m-0 mb-1" style={{ color: 'var(--text-muted)' }}>
            Måned totalt
          </p>
          <div className="w-[120px] h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={32}
                  outerRadius={52}
                  startAngle={90}
                  endAngle={-270}
                  stroke="var(--border)"
                >
                  {pieData.length === 1 ? (
                    <Cell fill={monthPct >= 100 ? 'var(--success)' : 'var(--primary-pale)'} />
                  ) : (
                    <>
                      <Cell fill="var(--success)" />
                      <Cell fill="var(--primary-pale)" />
                    </>
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs m-0 text-center tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {monthPct}% av daglige celler
          </p>
        </div>
        </div>

        <div
          data-sv-tour="month-heatmap"
          className="rounded-2xl border p-4 min-w-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <SmartvaneMonthHeatmap
            points={points}
            year={year}
            month={month}
            hasDailyHabits={dailyIds.length > 0}
            highlightYmd={
              localTodayYmd().startsWith(`${year}-${String(month).padStart(2, '0')}-`)
                ? localTodayYmd()
                : null
            }
          />
        </div>
      </div>

      <div
        data-sv-tour="month-settings-copy"
        className="rounded-2xl border p-3 mb-4 flex flex-wrap items-end gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <label className="text-sm flex flex-col gap-1 min-w-0">
          <span style={{ color: 'var(--text-muted)' }}>Daglig mål (antall vaner)</span>
          <input
            type="number"
            min={1}
            max={100}
            defaultValue={plan.daily_goal_total}
            disabled={pending}
            className="min-h-[44px] w-24 rounded-xl border px-2"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!Number.isNaN(v)) {
                run(() => updateDailyGoalTotal(plan.id, v, profileId))
              }
            }}
          />
        </label>
        {copyFeedback ? (
          <p
            className="text-sm m-0 basis-full"
            role="status"
            style={{
              color: copyFeedback.includes('kopiert') ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {copyFeedback}
          </p>
        ) : null}
        <button
          type="button"
          disabled={pending}
          className="min-h-[44px] rounded-xl border px-3 text-sm font-medium touch-manipulation max-sm:w-full"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          onClick={() => {
            setCopyFeedback(null)
            startTransition(async () => {
              const r = await copyMonthToNext(year, month, profileId)
              if (r.ok) {
                setCopyFeedback('Vaner er kopiert til neste måned. Åpne neste måned i månedsvy.')
                router.refresh()
              } else {
                setCopyFeedback(r.error)
              }
            })
          }}
        >
          Kopier vaner til neste måned
        </button>
      </div>

      <section data-sv-tour="month-daily-grid" className="mb-6 min-w-0">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Daglige vaner
        </h2>
        {dailyHabits.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Legg til vaner fra I dag, eller bruk knappen der.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="border-collapse text-xs min-w-max" style={{ color: 'var(--text)' }}>
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-10 min-w-[120px] p-1 text-left font-medium border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    Vane
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <th
                      key={d}
                      className="p-1 min-w-[40px] text-center font-medium border"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyHabits.map((h) => (
                  <tr key={h.id}>
                    <td
                      className="sticky left-0 z-10 p-1 border font-medium max-w-[140px]"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <span className="line-clamp-2">{h.name}</span>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                      const ymd = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                      const on = (bundle.dailyCompleted[h.id] ?? []).includes(ymd)
                      return (
                        <td key={d} className="p-0.5 border text-center" style={{ borderColor: 'var(--border)' }}>
                          <button
                            type="button"
                            disabled={pending}
                            aria-pressed={on}
                            className="min-h-[44px] min-w-[40px] w-full max-w-[48px] rounded-lg text-sm touch-manipulation"
                            style={{
                              background: on ? 'var(--primary)' : 'var(--bg)',
                              color: on ? '#fff' : 'var(--text-muted)',
                            }}
                            onClick={() => run(() => toggleDailyCompletion(h.id, ymd))}
                          >
                            {on ? '✓' : ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section data-sv-tour="month-weekly-grid" className="mb-6 min-w-0">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Ukentlige vaner
        </h2>
        {weeklyHabits.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen ukentlige vaner.
          </p>
        ) : (
          <div className="space-y-3">
            {weeklyHabits.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl border p-2"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <p className="text-sm font-medium m-0 mb-2" style={{ color: 'var(--text)' }}>
                  {h.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((wr) => {
                    const range = weekRowDayRange(wr, daysInMonth)
                    if (!range) return null
                    const on = (bundle.weeklyCompleted[h.id] ?? []).includes(wr)
                    return (
                      <button
                        key={wr}
                        type="button"
                        disabled={pending}
                        aria-pressed={on}
                        className="min-h-[44px] min-w-[44px] flex-1 rounded-xl border text-xs font-medium touch-manipulation sm:min-w-[72px]"
                        style={{
                          borderColor: 'var(--border)',
                          background: on ? 'var(--primary-pale)' : 'var(--bg)',
                          color: 'var(--text)',
                        }}
                        onClick={() => run(() => toggleWeeklyCompletion(h.id, wr))}
                      >
                        Uke {wr + 1}
                        <span
                          className="block text-[10px] font-normal opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {range.start}–{range.end}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section data-sv-tour="month-monthly-slots" className="mb-6 min-w-0">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Månedlige vaner
        </h2>
        {monthlyHabits.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen månedlige vaner.
          </p>
        ) : (
          monthlyHabits.map((h) => {
            const slots = bundle.monthlyCompleted[h.id] ?? []
            return (
              <div
                key={h.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl border p-2 mb-2"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <span className="text-sm font-medium min-w-[100px]" style={{ color: 'var(--text)' }}>
                  {h.name}
                </span>
                {([0, 1] as const).map((slot) => {
                  const on = slots.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={pending}
                      className="min-h-[44px] min-w-[44px] rounded-xl border text-sm touch-manipulation"
                      style={{
                        borderColor: 'var(--border)',
                        background: on ? 'var(--primary)' : 'var(--bg)',
                        color: on ? '#fff' : 'var(--text)',
                      }}
                      onClick={() => run(() => toggleMonthlySlot(h.id, slot))}
                    >
                      {slot + 1}
                    </button>
                  )
                })}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
