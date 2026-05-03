'use client'

import { useRouter } from 'next/navigation'
import { Children, useState, useTransition } from 'react'
import { addHabit, toggleDailyCompletion, toggleMonthlySlot, toggleWeeklyCompletion } from './actions'
import type { SmartvaneSerializableBundle } from './types'
import { dayOfMonthToWeekRow, weekRowDayRange } from './weekRow'
import { motivationMessage } from './motivation'
import {
  dailyCompletedCountByDay,
  localTodayYmd,
  parseYmdToDay,
} from './smartvaneBundleHelpers'
import { buildDailySummaryPoints } from './insights'
import { SmartvaneCircularProgress } from './SmartvaneCircularProgress'
import { SmartvaneRoutinePicker } from './SmartvaneRoutinePicker'
import { smartvanePageInner } from './layoutClasses'

type Props = {
  bundle: SmartvaneSerializableBundle
  year: number
  month: number
  profileId: string
}

export default function SmartvaneTodayView({ bundle, year, month, profileId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const todayYmd = localTodayYmd()
  const { y: ty, m: tm, d: td } = parseYmdToDay(todayYmd)
  const inMonth = ty === year && tm === month

  const plan = bundle.plan
  if (!plan) return null

  const dailyHabits = bundle.habits.filter((h) => h.kind === 'daily')
  const weeklyHabits = bundle.habits.filter((h) => h.kind === 'weekly')
  const monthlyHabits = bundle.habits.filter((h) => h.kind === 'monthly')

  const daysInMonth = new Date(year, month, 0).getDate()
  const weekRow =
    inMonth && td >= 1 && td <= daysInMonth ? dayOfMonthToWeekRow(td) : null
  const weekRange =
    weekRow != null ? weekRowDayRange(weekRow, daysInMonth) : null

  const dailyIds = dailyHabits.map((h) => h.id)
  const completedMap = dailyCompletedCountByDay(dailyIds, bundle, year, month)
  const points = buildDailySummaryPoints({
    daysInMonth,
    year,
    month,
    completedCountByDay: completedMap,
    dailyHabitCount: dailyIds.length,
    dailyGoalTotal: plan.daily_goal_total,
  })
  const todayPoint = inMonth ? points[td - 1] : null
  const monthMeanRatio =
    points.length > 0 ? points.reduce((s, p) => s + p.ratio, 0) / points.length : 0
  const todayProgress =
    dailyIds.length > 0
      ? Math.min(1, (todayPoint?.dailyCompletedCount ?? 0) / plan.daily_goal_total)
      : 0

  const msg = motivationMessage({ todayProgress, monthMeanRatio })

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const r = await fn()
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className={smartvanePageInner}>
      <div data-sv-tour="today-overview">
        <p
          className="text-sm rounded-2xl border px-3 py-3 mb-4"
          style={{ background: 'var(--primary-pale)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {msg}
        </p>

        {inMonth && todayPoint && dailyHabits.length > 0 ? (
          <div
            className="rounded-2xl border p-3 mb-4 flex flex-wrap items-center justify-between gap-3 min-w-0"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Daglig mål: {todayPoint.dailyCompletedCount} av {plan.daily_goal_total} vaner
              </span>
              <span
                className="text-xs font-medium rounded-full px-2 py-0.5 whitespace-nowrap"
                style={{
                  background: todayPoint.dailyGoalMet ? 'var(--success)' : 'var(--warning)',
                  color: '#fff',
                }}
              >
                {todayPoint.dailyGoalMet ? 'Oppnådd' : 'Fortsett'}
              </span>
            </div>
            <SmartvaneCircularProgress value={Number.isFinite(todayProgress) ? todayProgress : 0} caption="i dag" size={76} stroke={7} />
          </div>
        ) : null}
      </div>

      <div data-sv-tour="today-daily-section">
        <HabitSection title="Daglige vaner" empty="Ingen daglige vaner ennå — trykk «Legg til vane» under.">
          {dailyHabits.map((h) => {
            const done = inMonth && (bundle.dailyCompleted[h.id] ?? []).includes(todayYmd)
            return (
              <CheckRow
                key={h.id}
                label={h.name}
                subtitle={h.note ?? undefined}
                disabled={!inMonth || pending}
                pressed={!!done}
                onPress={() => run(() => toggleDailyCompletion(h.id, todayYmd))}
              />
            )
          })}
        </HabitSection>
      </div>

      <div data-sv-tour="today-non-daily">
        {weekRow != null && weekRange ? (
          <HabitSection
            title="Ukentlige (denne uken)"
            empty=""
          >
            {weeklyHabits.map((h) => {
              const wr = weekRow
              const done = (bundle.weeklyCompleted[h.id] ?? []).includes(wr)
              return (
                <CheckRow
                  key={h.id}
                  label={h.name}
                  subtitle={`Uke ${wr + 1} · dag ${weekRange.start}–${weekRange.end}`}
                  disabled={!inMonth || pending}
                  pressed={done}
                  onPress={() => run(() => toggleWeeklyCompletion(h.id, wr))}
                />
              )
            })}
          </HabitSection>
        ) : null}

        <HabitSection title="Månedlige vaner" empty="">
          {monthlyHabits.map((h) => {
            const slots = bundle.monthlyCompleted[h.id] ?? []
            return (
              <div
                key={h.id}
                className="flex flex-col gap-2 rounded-2xl border p-3 mb-2"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <p className="text-sm font-medium m-0" style={{ color: 'var(--text)' }}>
                  {h.name}
                </p>
                <div className="flex gap-2">
                  {([0, 1] as const).map((slot) => {
                    const on = slots.includes(slot)
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!inMonth || pending}
                        aria-pressed={on}
                        className="min-h-[44px] min-w-[44px] flex-1 rounded-xl border text-sm font-medium touch-manipulation"
                        style={{
                          borderColor: 'var(--border)',
                          background: on ? 'var(--primary-pale)' : 'var(--bg)',
                          color: 'var(--text)',
                        }}
                        onClick={() => run(() => toggleMonthlySlot(h.id, slot))}
                      >
                        Kryss {slot + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </HabitSection>
      </div>

      <div data-sv-tour="today-add-habit">
        <QuickAddHabit profileId={profileId} monthPlanId={plan.id} onDone={() => router.refresh()} disabled={pending} />
      </div>
    </div>
  )
}

function HabitSection({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const isEmpty = Children.count(children) === 0
  return (
    <section className="mb-6 min-w-0">
      <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {isEmpty ? (
        empty ? (
          <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
            {empty}
          </p>
        ) : null
      ) : (
        children
      )}
    </section>
  )
}

function CheckRow({
  label,
  subtitle,
  pressed,
  disabled,
  onPress,
}: {
  label: string
  subtitle?: string
  pressed: boolean
  disabled: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onPress}
      className={`mb-2 flex w-full min-h-[48px] items-start gap-3 rounded-2xl border px-3 py-2 text-left touch-manipulation min-w-0 transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'
      }`}
      style={{
        borderColor: 'var(--border)',
        background: pressed ? 'var(--primary-pale)' : 'var(--surface)',
        color: 'var(--text)',
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
        style={{
          background: pressed ? 'var(--primary)' : 'var(--bg)',
          color: pressed ? '#fff' : 'var(--text-muted)',
        }}
        aria-hidden
      >
        {pressed ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {subtitle ? (
          <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </button>
  )
}

function QuickAddHabit({
  profileId,
  monthPlanId,
  onDone,
  disabled,
}: {
  profileId: string
  monthPlanId: string
  onDone: () => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [target, setTarget] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="pb-8">
      {!open ? (
        <>
          <button
            type="button"
            disabled={disabled}
            className="w-full min-h-[44px] rounded-2xl font-medium text-white touch-manipulation"
            style={{ background: 'var(--cta-gradient)' }}
            onClick={() => {
              setOpen(true)
              setError(null)
            }}
          >
            Legg til vane
          </button>
          <button
            type="button"
            disabled={disabled}
            className="mt-2 w-full min-h-[44px] rounded-2xl border text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            onClick={() => {
              setPresetOpen(true)
              setError(null)
            }}
          >
            Fra bibliotek …
          </button>
        </>
      ) : (
        <div
          className="rounded-2xl border p-3 space-y-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Navn
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full min-h-[44px] rounded-xl border px-3 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </label>
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Type
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className="min-h-[44px] rounded-xl border text-xs font-medium touch-manipulation px-1"
                  style={{
                    borderColor: 'var(--border)',
                    background: kind === k ? 'var(--primary-pale)' : 'var(--bg)',
                    color: kind === k ? 'var(--primary)' : 'var(--text)',
                  }}
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                >
                  {k === 'daily' ? 'Daglig' : k === 'weekly' ? 'Ukentlig' : 'Månedlig'}
                </button>
              ))}
            </div>
          </fieldset>
          {kind === 'daily' ? (
            <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Mål dager i måneden (valgfritt)
              <input
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="f.eks. 20"
                className="mt-1 w-full min-h-[44px] rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </label>
          ) : null}
          {error ? (
            <p className="text-sm m-0" role="alert" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 min-h-[44px] rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              onClick={() => {
                setOpen(false)
                setName('')
                setTarget('')
                setError(null)
              }}
            >
              Avbryt
            </button>
            <button
              type="button"
              className="flex-1 min-h-[44px] rounded-xl font-medium text-white"
              style={{ background: 'var(--primary)' }}
              onClick={async () => {
                setError(null)
                const td = target.trim() ? parseInt(target, 10) : undefined
                const r = await addHabit({
                  profileId,
                  monthPlanId,
                  kind,
                  name,
                  targetDays: kind === 'daily' && td && !Number.isNaN(td) ? td : null,
                })
                if (r.ok) {
                  setOpen(false)
                  setName('')
                  setTarget('')
                  onDone()
                } else {
                  setError(r.error)
                }
              }}
            >
              Lagre
            </button>
          </div>
        </div>
      )}
      <SmartvaneRoutinePicker
        profileId={profileId}
        monthPlanId={monthPlanId}
        open={presetOpen}
        onOpenChange={setPresetOpen}
        onDone={onDone}
      />
    </div>
  )
}
