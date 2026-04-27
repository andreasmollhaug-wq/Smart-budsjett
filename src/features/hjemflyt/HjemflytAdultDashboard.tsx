'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { canAdministerHjemflyt } from './hjemflytPermissions'
import type { HjemflytAssignMode, HjemflytRecurrence } from './types'
import { poolForTask } from './hjemflytLogic'
import { effectiveHjemflytProfileIds } from './hjemflytParticipants'
import { HjemflytMemberSummaryCard } from './HjemflytMemberSummaryCard'
import { HjemflytPresetSection } from './HjemflytPresetSection'
import { buildHjemflytMemberSummaryRows } from './hjemflytSummaryRows'
import { periodLabelForWeek } from './hjemflytStats'

const NO_WEEKDAYS: { v: number; label: string }[] = [
  { v: 0, label: 'Søndag' },
  { v: 1, label: 'Mandag' },
  { v: 2, label: 'Tirsdag' },
  { v: 3, label: 'Onsdag' },
  { v: 4, label: 'Torsdag' },
  { v: 5, label: 'Fredag' },
  { v: 6, label: 'Lørdag' },
]

export function HjemflytAdultDashboard() {
  const hjemflyt = useStore((s) => s.hjemflyt)
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const hjemflytAddTask = useStore((s) => s.hjemflytAddTask)
  const hjemflytRemoveTask = useStore((s) => s.hjemflytRemoveTask)
  const hjemflytCompleteTask = useStore((s) => s.hjemflytCompleteTask)
  const hjemflytApproveCompletion = useStore((s) => s.hjemflytApproveCompletion)
  const hjemflytRejectCompletion = useStore((s) => s.hjemflytRejectCompletion)
  const setHjemflytSettings = useStore((s) => s.setHjemflytSettings)

  const [title, setTitle] = useState('')
  const [reward, setReward] = useState('')
  const [recurrence, setRecurrence] = useState<HjemflytRecurrence>({ type: 'none' })
  const [assignMode, setAssignMode] = useState<HjemflytAssignMode>('everyone')
  const [assignees, setAssignees] = useState<string[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [weeklyGoalDraft, setWeeklyGoalDraft] = useState('')

  const allIds = useMemo(() => profiles.map((p) => p.id), [profiles])
  const participantProfileIds = hjemflyt.settings.participantProfileIds
  const hfIds = useMemo(
    () => effectiveHjemflytProfileIds(allIds, hjemflyt.settings),
    // Kun deltakerlisten påvirker poolen; unngå ny `hfIds` ved andre hjemflyt-oppdateringer (ny array → useEffect-loop).
    [allIds, participantProfileIds],
  )
  const profilesInHjemflyt = useMemo(
    () => profiles.filter((p) => hfIds.includes(p.id)),
    [profiles, hfIds],
  )
  const canAdminister = useMemo(
    () => canAdministerHjemflyt(activeProfileId, profiles),
    [activeProfileId, profiles],
  )
  const pending = hjemflyt.completions.filter((c) => c.status === 'pending_approval')
  const nTasks = hjemflyt.tasks.length

  const now = useMemo(() => new Date(), [])
  const weekSubtitle = useMemo(() => `Poeng og oppgaver · ${periodLabelForWeek(now)}`, [now])

  const weeklyGoalStored = hjemflyt.settings.weeklyGoalPoints
  useEffect(() => {
    setWeeklyGoalDraft(weeklyGoalStored == null ? '' : String(weeklyGoalStored))
  }, [weeklyGoalStored])

  useEffect(() => {
    setAssignees((prev) => {
      const next = prev.filter((id) => hfIds.includes(id))
      if (prev.length === next.length && next.every((id, i) => id === prev[i])) return prev
      return next
    })
  }, [hfIds])

  function commitParticipantSelection(profileId: string, checked: boolean) {
    const all = allIds
    const cur = hjemflyt.settings.participantProfileIds
    const base = cur === null ? all.slice() : cur.filter((id) => all.includes(id))
    const next = checked
      ? [...new Set([...base, profileId])].filter((id) => all.includes(id))
      : base.filter((id) => id !== profileId)
    if (next.length === 0 || next.length >= all.length) {
      const r = setHjemflytSettings({ participantProfileIds: null })
      if (!r.ok) setMsg('Kun voksne kan endre innstillinger.')
      else setMsg(null)
    } else {
      const r = setHjemflytSettings({ participantProfileIds: next })
      if (!r.ok) setMsg('Kun voksne kan endre innstillinger.')
      else setMsg(null)
    }
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const rewardPoints = reward.trim() === '' ? null : Math.max(0, Math.round(Number(reward.replace(',', '.')) || 0))
    const res = hjemflytAddTask({
      title,
      rewardPoints: rewardPoints === 0 ? null : rewardPoints,
      recurrence,
      assignMode,
      assigneeProfileIds: assignMode === 'everyone' ? [] : assignees,
    })
    if (res.ok) {
      setTitle('')
      setReward('')
    } else setMsg('Kunne ikke legge til (sjekk at du er voksen profil).')
  }

  function commitWeeklyGoal() {
    const t = weeklyGoalDraft.trim()
    if (t === '') {
      const r = setHjemflytSettings({ weeklyGoalPoints: null })
      if (!r.ok) setMsg('Kun voksne kan endre innstillinger.')
      return
    }
    const n = Math.round(Number(t.replace(',', '.')) || 0)
    if (!Number.isFinite(n) || n <= 0) {
      const r = setHjemflytSettings({ weeklyGoalPoints: null })
      if (!r.ok) setMsg('Kun voksne kan endre innstillinger.')
      setWeeklyGoalDraft('')
      return
    }
    const r = setHjemflytSettings({ weeklyGoalPoints: Math.min(1_000_000, n) })
    if (!r.ok) setMsg('Kun voksne kan endre innstillinger.')
  }

  return (
    <div className="space-y-6 max-w-4xl min-w-0">
      <header className="space-y-1">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          HjemFlyt
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Oversikt og oppgaver for husholdningen. Poeng her er bare motivasjon i HjemFlyt og kobles ikke til budsjett
          eller transaksjoner.
        </p>
        <p
          className="text-sm font-medium mt-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--primary-pale)', color: 'var(--text)' }}
        >
          {nTasks === 0
            ? 'Ingen aktive oppgaver.'
            : nTasks === 1
              ? '1 oppgave i listen'
              : `${nTasks} oppgaver i listen`}
          {canAdminister && pending.length > 0
            ? ` · ${pending.length} ${pending.length === 1 ? 'oppgave' : 'oppgaver'} venter på godkjenning`
            : null}
        </p>
        {nTasks === 0 && canAdminister && (
          <p className="text-sm mt-2">
            <Link
              href="/hjemflyt/start"
              className="font-medium underline underline-offset-2 min-h-[44px] inline-flex items-center touch-manipulation"
              style={{ color: 'var(--primary)' }}
            >
              Slik kommer du i gang
            </Link>
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        {profilesInHjemflyt.map((p) => {
          const emoji = p.hjemflyt?.kind === 'child' ? p.hjemflyt.childEmoji : null
          const rows = buildHjemflytMemberSummaryRows(
            p.id,
            hjemflyt.completions,
            hjemflyt.settings.weeklyGoalPoints,
            now,
          )
          const total = hjemflyt.pointBalances[p.id] ?? 0
          return (
            <HjemflytMemberSummaryCard
              key={p.id}
              title={p.name}
              subtitle={weekSubtitle}
              emoji={emoji}
              rows={rows}
              footerPoints={total}
            />
          )
        })}
      </section>

      {canAdminister && pending.length > 0 && (
        <section
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Godkjenn fullføring
          </h2>
          <ul className="space-y-2">
            {pending.map((c) => {
              const task = hjemflyt.tasks.find((t) => t.id === c.taskId)
              const name = profiles.find((p) => p.id === c.completedByProfileId)?.name ?? 'Ukjent'
              return (
                <li
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b last:border-0 min-w-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
                      {task?.title ?? 'Oppgave'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {name}
                      {c.rewardPointsSnapshot != null && c.rewardPointsSnapshot > 0
                        ? ` · ${c.rewardPointsSnapshot} poeng`
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => hjemflytApproveCompletion(c.id)}
                      className="min-h-[44px] px-4 rounded-xl text-sm font-medium touch-manipulation"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      Godkjenn
                    </button>
                    <button
                      type="button"
                      onClick={() => hjemflytRejectCompletion(c.id)}
                      className="min-h-[44px] px-4 rounded-xl text-sm font-medium border touch-manipulation"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Avvis
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {canAdminister && (
        <section
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Innstillinger
          </h2>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
              Ukemål for alle (poeng, valgfritt)
            </label>
            <p className="text-xs mb-2 leading-snug" style={{ color: 'var(--text-muted)' }}>
              Mandag–søndag. La stå tomt for kun å vise opptjent uten målstrek.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <input
                value={weeklyGoalDraft}
                onChange={(e) => setWeeklyGoalDraft(e.target.value)}
                onBlur={() => commitWeeklyGoal()}
                inputMode="numeric"
                className="w-full sm:max-w-xs min-h-[44px] rounded-xl border px-3 text-sm min-w-0"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="F.eks. 50"
              />
              <button
                type="button"
                onClick={() => commitWeeklyGoal()}
                className="min-h-[44px] px-4 rounded-xl text-sm font-medium touch-manipulation shrink-0"
                style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
              >
                Lagre mål
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={hjemflyt.settings.showRewardForChildren}
              onChange={() => {
                const r = setHjemflytSettings({
                  showRewardForChildren: !hjemflyt.settings.showRewardForChildren,
                })
                if (!r.ok) setMsg('Kun voksne kan endre innstillinger.')
                else setMsg(null)
              }}
            />
            <span style={{ color: 'var(--text)' }}>Vis poeng i HjemFlyt for barn</span>
          </label>
          <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Deltar i HjemFlyt
            </p>
            <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
              Styrer hvem som er med i «Alle kan ta den»-poolen og hvem som vises i poengoversikten over. Profiler som
              ikke deltar kan fortsatt administrere oppgaver som voksen.
            </p>
            <ul className="space-y-2">
              {profiles.map((p) => {
                const checked =
                  hjemflyt.settings.participantProfileIds === null ||
                  hjemflyt.settings.participantProfileIds.includes(p.id)
                return (
                  <li key={p.id}>
                    <label className="flex items-center gap-2 text-sm min-h-[44px] cursor-pointer touch-manipulation">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => commitParticipantSelection(p.id, !checked)}
                      />
                      <span className="min-w-0 break-words" style={{ color: 'var(--text)' }}>
                        {p.name}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <HjemflytPresetSection
            tasks={hjemflyt.tasks}
            onAddPreset={(presetTitle, rewardPoints) => {
              const r = hjemflytAddTask({
                title: presetTitle.slice(0, 200),
                rewardPoints,
                recurrence: { type: 'none' },
                assignMode: 'everyone',
                assigneeProfileIds: [],
              })
              return { ok: r.ok }
            }}
            onFeedback={setMsg}
          />
        </section>
      )}

      {canAdminister && (
        <section
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Ny oppgave
          </h2>
          <form onSubmit={onAdd} className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Tittel
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border px-3 text-sm min-w-0"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="F.eks. Ta oppvasken"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Poeng (valgfritt)
              </label>
              <input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                inputMode="numeric"
                className="w-full min-h-[44px] rounded-xl border px-3 text-sm min-w-0"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Gjentakelse
              </label>
              <select
                value={recurrence.type}
                onChange={(e) => {
                  const t = e.target.value
                  if (t === 'none') setRecurrence({ type: 'none' })
                  else if (t === 'daily') setRecurrence({ type: 'daily' })
                  else if (t === 'weekly') setRecurrence({ type: 'weekly', weekday: 1 })
                  else setRecurrence({ type: 'monthly', dayOfMonth: 1 })
                }}
                className="w-full min-h-[44px] rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="none">Én gang (ingen gjentakelse)</option>
                <option value="daily">Daglig</option>
                <option value="weekly">Ukentlig</option>
                <option value="monthly">Månedlig</option>
              </select>
            </div>
            {recurrence.type === 'weekly' && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Hvilken ukedag
                </label>
                <select
                  value={recurrence.weekday}
                  onChange={(e) =>
                    setRecurrence({ type: 'weekly', weekday: Number(e.target.value) })
                  }
                  className="w-full min-h-[44px] rounded-xl border px-3 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  {NO_WEEKDAYS.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {recurrence.type === 'monthly' && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Dag i måneden (1–28)
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={recurrence.dayOfMonth}
                  onChange={(e) =>
                    setRecurrence({
                      type: 'monthly',
                      dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border px-3 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Fordeling
              </label>
              <select
                value={assignMode}
                onChange={(e) => setAssignMode(e.target.value as HjemflytAssignMode)}
                className="w-full min-h-[44px] rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="everyone">Alle kan ta den</option>
                <option value="fixed">Kun valgte</option>
                <option value="round_robin">Ruller mellom valgte</option>
              </select>
              <p className="text-xs mt-2 leading-snug" style={{ color: 'var(--text-muted)' }}>
                «Alle kan ta den» betyr alle som er markert som deltakere under Innstillinger. Velg «Kun valgte» eller
                «Ruller» når bare noen få skal gjøre jobben, og kryss av dem under.
              </p>
            </div>
            {assignMode !== 'everyone' && (
              <div className="flex flex-wrap gap-2">
                {profilesInHjemflyt.map((p) => (
                  <label key={p.id} className="inline-flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={assignees.includes(p.id)}
                      onChange={() =>
                        setAssignees((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                    />
                    <span style={{ color: 'var(--text)' }}>{p.name}</span>
                  </label>
                ))}
              </div>
            )}
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl font-medium touch-manipulation"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Legg til
            </button>
          </form>
        </section>
      )}

      <section
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Oppgaver
        </h2>
        {hjemflyt.tasks.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen oppgaver ennå.
            {canAdminister ? ' Legg til over.' : ' En voksen profil kan legge til oppgaver.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {hjemflyt.tasks.map((task) => {
              const pool = poolForTask(task, hfIds)
              const poolLen = pool.length
              const rr =
                task.assignMode === 'round_robin' && poolLen > 0
                  ? pool[task.roundRobinIndex % poolLen]!
                  : null
              const completeRes = () => hjemflytCompleteTask(task.id)
              const rec = task.recurrence
              const recLabel =
                rec.type === 'none'
                  ? 'Én gang'
                  : rec.type === 'daily'
                    ? 'Daglig'
                    : rec.type === 'weekly'
                      ? `Ukentlig (${NO_WEEKDAYS.find((d) => d.v === rec.weekday)?.label ?? 'ukedag'})`
                      : `Månedlig (dag ${rec.dayOfMonth})`
              return (
                <li
                  key={task.id}
                  className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words" style={{ color: 'var(--text)' }}>
                      {task.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {recLabel}{' '}
                      · {task.assignMode === 'everyone' ? 'Alle' : task.assignMode === 'fixed' ? 'Utvalgte' : 'Rullering'}
                      {rr ? ` · Neste: ${profiles.find((p) => p.id === rr)?.name ?? ''}` : ''}
                      {task.rewardPoints != null && task.rewardPoints > 0
                        ? ` · ${task.rewardPoints} poeng`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const r = completeRes()
                        if (r.ok) {
                          setMsg(null)
                          return
                        }
                        if (r.reason === 'not_assigned') setMsg('Ikke din tur / ikke tildelt deg.')
                        else if (r.reason === 'already_done') setMsg('Allerede fullført i denne perioden.')
                        else if (r.reason === 'duplicate_pending') setMsg('Venter allerede på godkjenning.')
                        else setMsg(null)
                      }}
                      className="min-h-[44px] px-4 rounded-xl text-sm font-medium touch-manipulation"
                      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                    >
                      Marker fullført
                    </button>
                    {canAdminister && (
                      <button
                        type="button"
                        onClick={() => hjemflytRemoveTask(task.id)}
                        className="min-h-[44px] px-3 rounded-xl text-sm border touch-manipulation"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                      >
                        Slett
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {msg && <p className="text-sm text-amber-700">{msg}</p>}
    </div>
  )
}
