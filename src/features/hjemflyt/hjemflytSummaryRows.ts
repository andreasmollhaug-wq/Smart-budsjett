import type { HjemflytCompletion } from './types'
import {
  approvedPointsThisWeek,
  pendingPointsThisWeek,
  weekGoalProgressPercent,
} from './hjemflytStats'

export type HjemflytSummaryRow =
  | {
      type: 'progress'
      label: string
      targetRight: string
      displayPct: number
      fill: string
      progressAriaLabel: string
      bottomLeftBold: string
      bottomLeftMuted: string
      bottomRightBold?: string
      bottomRightSub?: string
      bottomRightColor?: string
      bottomRightMutedOnly?: string
    }
  | {
      type: 'simple'
      label: string
      valueBold: string
      valueMuted?: string
    }

export function buildHjemflytMemberSummaryRows(
  profileId: string,
  completions: HjemflytCompletion[],
  weeklyGoalPoints: number | null,
  at: Date,
): HjemflytSummaryRow[] {
  const approved = approvedPointsThisWeek(profileId, completions, at)
  const pending = pendingPointsThisWeek(profileId, completions, at)
  const goal = weeklyGoalPoints
  const rows: HjemflytSummaryRow[] = []

  if (goal != null && goal > 0) {
    const pct = weekGoalProgressPercent(approved, goal) ?? 0
    const over = approved > goal
    const remainder = over ? approved - goal : goal - approved
    rows.push({
      type: 'progress',
      label: 'Denne uken',
      targetRight: `${goal.toLocaleString('nb-NO')} poeng mål`,
      displayPct: pct,
      fill: over ? 'var(--success)' : 'var(--primary)',
      progressAriaLabel: `Denne uken: ${pct} prosent av ukemålet`,
      bottomLeftBold: approved.toLocaleString('nb-NO'),
      bottomLeftMuted: 'poeng godkjent',
      bottomRightBold: remainder.toLocaleString('nb-NO'),
      bottomRightSub: over ? 'over mål' : 'gjenstår',
      bottomRightColor: 'var(--success)',
    })
  } else {
    rows.push({
      type: 'simple',
      label: 'Denne uken',
      valueBold: `${approved.toLocaleString('nb-NO')} poeng`,
      valueMuted: 'godkjent',
    })
  }

  if (pending > 0) {
    rows.push({
      type: 'simple',
      label: 'Venter på godkjenning',
      valueBold: `${pending.toLocaleString('nb-NO')} poeng`,
      valueMuted: 'avventer voksen',
    })
  }

  return rows
}
