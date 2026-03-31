import type { FormuebyggerResult, MilestoneHit } from './types'
import { MILESTONE_AMOUNTS } from './types'

export function computeMilestones(result: FormuebyggerResult): MilestoneHit[] {
  return MILESTONE_AMOUNTS.map((amount) => {
    const hit = result.months.find((row) => row.ub >= amount)
    if (!hit) {
      return { amount, yearReached: null, monthIndexReached: null }
    }
    return {
      amount,
      yearReached: hit.yearIndex + 1,
      monthIndexReached: hit.globalMonthIndex,
    }
  })
}
