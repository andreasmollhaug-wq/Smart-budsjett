'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { poolForTask } from './hjemflytLogic'
import { HjemflytMemberSummaryCard } from './HjemflytMemberSummaryCard'
import { buildHjemflytMemberSummaryRows } from './hjemflytSummaryRows'
import { periodLabelForWeek } from './hjemflytStats'

type Props = {
  /** Profilen barnevisningen viser data for (barn selv eller forhåndsvisning). */
  viewProfileId: string
  /** True når en voksen ser på uten å ha byttet til barneprofilen – fullføring er deaktivert. */
  isPreviewMode?: boolean
}

export function HjemflytBarnDashboard({ viewProfileId, isPreviewMode = false }: Props) {
  const hjemflyt = useStore((s) => s.hjemflyt)
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const hjemflytCompleteTask = useStore((s) => s.hjemflytCompleteTask)
  const subject = profiles.find((p) => p.id === viewProfileId)
  const emoji = subject?.hjemflyt?.childEmoji
  const showPoints = hjemflyt.settings.showRewardForChildren
  const [msg, setMsg] = useState<string | null>(null)

  const allIds = profiles.map((p) => p.id)
  const myTotal = hjemflyt.pointBalances[viewProfileId] ?? 0
  const now = useMemo(() => new Date(), [])
  const weekSubtitle = useMemo(() => `Poeng og oppgaver · ${periodLabelForWeek(now)}`, [now])
  const summaryRows = useMemo(
    () =>
      buildHjemflytMemberSummaryRows(
        viewProfileId,
        hjemflyt.completions,
        hjemflyt.settings.weeklyGoalPoints,
        now,
      ),
    [viewProfileId, hjemflyt.completions, hjemflyt.settings.weeklyGoalPoints, now],
  )

  const canCompleteTasks = !isPreviewMode && activeProfileId === viewProfileId

  return (
    <div className="space-y-6 max-w-lg min-w-0 mx-auto px-1">
      {isPreviewMode && (
        <div
          className="rounded-2xl px-3 py-3 text-sm leading-snug"
          style={{ background: 'var(--primary-pale)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <p className="font-medium">Forhåndsvisning som {subject?.name ?? 'barn'}</p>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Bytt til barneprofilen i profilvelgeren for å fullføre oppgaver og tjene poeng som barnet.
          </p>
        </div>
      )}

      <header className="text-center space-y-2">
        <div className="text-5xl leading-none" aria-hidden>
          {emoji ?? '🌱'}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Hei{subject?.name ? `, ${subject.name}` : ''}!
        </h1>
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>
          Her ser du det som skal gjøres hjemme
          {hjemflyt.tasks.length > 0
            ? ` — ${hjemflyt.tasks.length} ${hjemflyt.tasks.length === 1 ? 'oppgave' : 'oppgaver'}.`
            : '.'}
        </p>
      </header>

      {showPoints && (
        <HjemflytMemberSummaryCard
          title={subject?.name ?? 'Deg'}
          subtitle={weekSubtitle}
          emoji={emoji}
          rows={summaryRows}
          footerPoints={myTotal}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-center" style={{ color: 'var(--text)' }}>
          Oppgaver
        </h2>
        {hjemflyt.tasks.length === 0 ? (
          <p className="text-center text-base" style={{ color: 'var(--text-muted)' }}>
            Ingen oppgaver akkurat nå. Slapp av!
          </p>
        ) : (
          <ul className="space-y-3">
            {hjemflyt.tasks.map((task) => {
              const pool = poolForTask(task, allIds)
              const nextName =
                task.assignMode === 'round_robin' && pool.length > 0
                  ? profiles.find((p) => p.id === pool[task.roundRobinIndex % pool.length])?.name
                  : null
              return (
                <li
                  key={task.id}
                  className="rounded-2xl p-4 space-y-3 min-w-0"
                  style={{
                    background: 'var(--surface)',
                    border: '2px solid var(--border)',
                  }}
                >
                  <p className="text-xl font-bold text-center" style={{ color: 'var(--text)' }}>
                    {task.title}
                  </p>
                  {showPoints && task.rewardPoints != null && task.rewardPoints > 0 && (
                    <p className="text-center text-lg font-semibold" style={{ color: 'var(--primary)' }}>
                      +{task.rewardPoints} poeng
                    </p>
                  )}
                  {nextName && (
                    <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      Neste i kø: {nextName}
                    </p>
                  )}
                  {canCompleteTasks ? (
                    <button
                      type="button"
                      onClick={() => {
                        const r = hjemflytCompleteTask(task.id)
                        if (!r.ok) {
                          if (r.reason === 'not_assigned') setMsg('Dette er ikke din oppgave akkurat nå.')
                          else if (r.reason === 'already_done') setMsg('Allerede gjort.')
                          else if (r.reason === 'duplicate_pending') setMsg('Venter på at en voksen godkjenner.')
                          else setMsg('Kunne ikke fullføre.')
                        } else {
                          setMsg(null)
                        }
                      }}
                      className="w-full min-h-[52px] rounded-2xl text-lg font-bold touch-manipulation active:scale-[0.99] transition-transform"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      Jeg har gjort det!
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        {isPreviewMode
                          ? 'Fullføring er bare tilgjengelig når barnet er innlogget på sin profil.'
                          : 'Bytt til riktig profil for å fullføre.'}
                      </p>
                      {isPreviewMode && (
                        <Link
                          href="/konto/profiler"
                          className="w-full min-h-[48px] rounded-2xl text-base font-semibold touch-manipulation inline-flex items-center justify-center"
                          style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                        >
                          Administrer profiler
                        </Link>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {msg && (
        <p className="text-center text-base rounded-xl p-3" style={{ background: 'var(--primary-pale)', color: 'var(--text)' }}>
          {msg}
        </p>
      )}
    </div>
  )
}
