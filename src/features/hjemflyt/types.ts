/**
 * HjemFlyt: husholdningsoppgaver — adskilt fra budsjett/transaksjoner.
 * Modulgrense: ingen import av `addTransaction`, budsjett-API eller `PersonData.transactions` fra features/hjemflyt.
 */

export const HJEMFLYT_STATE_VERSION = 2

export type HjemflytRecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly'

export type HjemflytRecurrence =
  | { type: 'none' }
  | { type: 'daily' }
  | { type: 'weekly'; weekday: number } // 0–6, 0 = søndag
  | { type: 'monthly'; dayOfMonth: number } // 1–28

export type HjemflytAssignMode = 'everyone' | 'fixed' | 'round_robin'

export interface HjemflytTask {
  id: string
  title: string
  /** Poeng ved godkjenning; null/0 = ingen poengpremie, autogodkjent fullføring når logikken tillater det. */
  rewardPoints: number | null
  recurrence: HjemflytRecurrence
  assignMode: HjemflytAssignMode
  assigneeProfileIds: string[]
  roundRobinIndex: number
  lastCompletedAt: string | null
  lastCompletedPeriodKey: string | null
  createdAt: string
  createdByProfileId: string
}

export type HjemflytCompletionStatus = 'done' | 'pending_approval' | 'rejected' | 'approved'

export interface HjemflytCompletion {
  id: string
  taskId: string
  completedAt: string
  completedByProfileId: string
  status: HjemflytCompletionStatus
  periodKey: string | null
  rewardPointsSnapshot: number | null
}

export interface HjemflytSettings {
  showRewardForChildren: boolean
  /** Felles ukemål i poeng (mandag–søndag); null = ikke satt. */
  weeklyGoalPoints: number | null
  /**
   * Hvilke profiler som deltar i HjemFlyt-poolen.
   * `null` = alle profiler i husholdningen (standard).
   */
  participantProfileIds: string[] | null
}

export interface HjemFlytState {
  version: number
  tasks: HjemflytTask[]
  completions: HjemflytCompletion[]
  pointBalances: Record<string, number>
  settings: HjemflytSettings
}

export type HjemflytProfileKind = 'adult' | 'child'

export interface HjemflytProfileMeta {
  kind: HjemflytProfileKind
  childEmoji?: string
}
