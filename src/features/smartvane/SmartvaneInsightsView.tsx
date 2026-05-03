'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { currentStreakUpto, longestStreak } from './streaks'
import type { SmartvaneSerializableBundle } from './types'
import {
  buildDailySummaryPoints,
  strongestAndWeakestWeekday,
  trend7Vs7,
  weekdayStrengthInMonth,
} from './insights'
import { smartvanePageInner } from './layoutClasses'
import { dailyCompletedCountByDay } from './smartvaneBundleHelpers'

type Props = {
  bundle: SmartvaneSerializableBundle
  year: number
  month: number
  /** Alle avkrysninger (YYYY-MM-DD) for daglig vane med dette navnet, på tvers av måneder (samme navn = samme logiske vane). */
  dailyCompletionDatesByHabitName: Record<string, string[]>
}

/** Siste dag i måneden (ISO) */
function lastDayOfMonthYmd(year: number, month: number): string {
  const d = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function SmartvaneInsightsView({
  bundle,
  year,
  month,
  dailyCompletionDatesByHabitName,
}: Props) {
  const plan = bundle.plan
  if (!plan) return null

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

  const trend = trend7Vs7(points)
  const wdRows = weekdayStrengthInMonth(points)
  const { strongest, weakest } = strongestAndWeakestWeekday(wdRows)

  const ranking = dailyHabits
    .map((h) => {
      const dates = bundle.dailyCompleted[h.id] ?? []
      const inMonth = dates.filter((d) => d.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      const target = h.target_days ?? daysInMonth
      const pct = target > 0 ? Math.min(100, Math.round((inMonth.length / target) * 100)) : 0
      return { id: h.id, name: h.name, count: inMonth.length, target, pct }
    })
    .sort((a, b) => b.pct - a.pct)

  const trendLabel = trend === 'up' ? '↑ Bedre' : trend === 'down' ? '↓ Svakere' : '→ Uendret'

  const monthEnd = lastDayOfMonthYmd(year, month)

  const monthlyActivityPoints = dailyHabits.length > 0
    ? points.map((p) => ({
        dag: Number(p.date.slice(8, 10)),
        pct: Math.round(p.ratio * 100),
      }))
    : []

  const weekdaysOrderedMonFirst = wdRows.slice().sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))
  const ukedagKort: Record<number, string> = {
    1: 'Ma',
    2: 'Ti',
    3: 'On',
    4: 'To',
    5: 'Fr',
    6: 'Lø',
    0: 'Søn',
  }
  const weekdayStrengthBars = weekdaysOrderedMonFirst.map((r) => ({
    key: `${r.weekday}`,
    ukedag: ukedagKort[r.weekday] ?? '?',
    pct: Math.round(r.rate * 100),
    oppnadd: r.met,
    mulig: r.total,
  }))

  return (
    <div className={smartvanePageInner}>
      <div data-sv-tour="insights-overview">
        <div
          data-sv-tour="insights-trend"
          className="rounded-2xl border p-3 mb-3 space-y-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm m-0 font-medium" style={{ color: 'var(--text)' }}>
            Trend (siste 7 dager vs forrige 7): {trendLabel}
          </p>
          {strongest && weakest ? (
            <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
              Sterkeste dag: <strong style={{ color: 'var(--text)' }}>{strongest.labelNo}</strong> · Svakeste:{' '}
              <strong style={{ color: 'var(--text)' }}>{weakest.labelNo}</strong>
            </p>
          ) : (
            <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
              Logg noen dager for å se ukedaganalyse.
            </p>
          )}
        </div>

        {monthlyActivityPoints.length >= 1 ? (
          <div
            data-sv-tour="insights-month-curve"
            className="rounded-2xl border p-3 mb-3 smartvane-recharts-no-focus min-w-0"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm m-0 font-medium mb-2" style={{ color: 'var(--text)' }}>
              Dag-for-dag (andel daglig kryss vs antall vaner)
            </p>
            <div className="h-[148px] w-full min-w-0 touch-pan-x">
              <ResponsiveContainer width="100%" height={148}>
                <AreaChart data={monthlyActivityPoints} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="smartvaneInsightCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" opacity={0.55} vertical={false} />
                  <XAxis
                    dataKey="dag"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    tickMargin={6}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [`${value as number}%`, 'Fullføring']}
                    labelFormatter={(d) => `Dag ${d}`}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pct"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#smartvaneInsightCurve)"
                    dot={{ r: 2, strokeWidth: 1, stroke: 'var(--primary)', fill: 'var(--surface)' }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {dailyHabits.length > 0 ? (
          <div
            data-sv-tour="insights-weekday-bars"
            className="rounded-2xl border p-3 mb-3 smartvane-recharts-no-focus min-w-0"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm m-0 font-medium mb-2" style={{ color: 'var(--text)' }}>
              Ukedager andel dager mål ble nådd
            </p>
            <p className="text-xs m-0 mb-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              For hver ukedag: hvor stor andel av forekomster i måneden som oppfyller daglig mål totalt (alle vaner).
            </p>
            <div className="h-[220px] w-full min-w-0 touch-pan-x">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={weekdayStrengthBars}
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="smartvaneWdBarFill" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="color-mix(in srgb, var(--primary) 70%, transparent)" />
                      <stop offset="100%" stopColor="var(--primary)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" horizontal stroke="var(--border)" opacity={0.45} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="ukedag" width={52} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, _name, entry) => {
                      const payload = entry?.payload as { oppnadd?: number; mulig?: number } | undefined
                      return [
                        `${Number(value ?? 0)} %`,
                        `${payload?.oppnadd ?? 0}/${payload?.mulig ?? 0} dager med målet nådd`,
                      ]
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="pct"
                    fill="url(#smartvaneWdBarFill)"
                    radius={[0, 10, 10, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

      <section data-sv-tour="insights-streak" className="mb-5 min-w-0">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Daglige vaner (streak)
        </h2>
        <p className="text-xs m-0 mb-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Lengste rekke bruker full historikk fra avkrysninger med samme vannenavn på tvers av måneder. «Nå» er rekken
          innenfor valgt måned (MVP).
        </p>
        {dailyHabits.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen daglige vaner ennå.
          </p>
        ) : (
          <ul className="list-none m-0 p-0 space-y-2">
            {dailyHabits.map((h) => {
              const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
              const mergedSorted =
                dailyCompletionDatesByHabitName[h.name] ?? bundle.dailyCompleted[h.id] ?? []
              const inMonthOnly = mergedSorted.filter((d) => d.startsWith(monthPrefix))
              const cur = currentStreakUpto(inMonthOnly, monthEnd)
              const longAllTime = longestStreak(mergedSorted)
              const longInMonth = longestStreak(inMonthOnly)
              const isMonthBest = cur > 0 && cur === longInMonth && longInMonth > 0
              return (
                <li
                  key={h.id}
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {h.name}
                  </span>
                  <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Nå: {cur} {cur >= 3 ? '🔥' : ''} (måned) · Lengste totalt: {longAllTime}{' '}
                    {longAllTime > 0 ? '🏆' : ''}
                    {isMonthBest ? ' · Topp-rekke i måneden' : longInMonth > cur ? ` · Best i måned: ${longInMonth}` : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section data-sv-tour="insights-top" className="mb-5 min-w-0">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Toppliste (daglig)
        </h2>
        {ranking.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            —
          </p>
        ) : (
          <ol className="m-0 pl-4 space-y-1 text-sm" style={{ color: 'var(--text)' }}>
            {ranking.slice(0, 10).map((r, i) => (
              <li key={r.id}>
                {i + 1}. {r.name} — {r.pct}% ({r.count}/{r.target})
              </li>
            ))}
          </ol>
        )}
      </section>

      <section data-sv-tour="insights-summary" className="mb-5 min-w-0">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Oppsummering
        </h2>
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Daglige: {dailyHabits.length} · Ukentlige: {weeklyHabits.length} · Månedlige:{' '}
          {monthlyHabits.length}
        </p>
      </section>
      </div>
    </div>
  )
}
