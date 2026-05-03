export type SmartvaneHabitKind = 'daily' | 'weekly' | 'monthly'

export type SmartvaneMonthPlanRow = {
  id: string
  user_id: string
  /** Budsjettprofil (Zustand); `default` = hovedprofil. */
  profile_id: string
  year: number
  month: number
  daily_goal_total: number
  created_at: string
  updated_at: string
}

export type SmartvaneHabitRow = {
  id: string
  user_id: string
  month_plan_id: string
  kind: SmartvaneHabitKind
  sort_order: number
  name: string
  note: string | null
  target_days: number | null
  created_at: string
  updated_at: string
}

export type SmartvaneCompletionDailyRow = {
  habit_id: string
  completed_on: string
  user_id: string
  created_at: string
}

export type SmartvaneCompletionWeeklyRow = {
  habit_id: string
  week_row: number
  user_id: string
  created_at: string
}

export type SmartvaneCompletionMonthlyRow = {
  habit_id: string
  slot: number
  user_id: string
  created_at: string
}

/** Klient / RSC serialisering av månedspakke (uten Map). */
export type SmartvaneSerializableBundle = {
  plan: SmartvaneMonthPlanRow | null
  habits: SmartvaneHabitRow[]
  dailyCompleted: Record<string, string[]>
  weeklyCompleted: Record<string, number[]>
  monthlyCompleted: Record<string, number[]>
}
