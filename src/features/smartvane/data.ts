import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SmartvaneHabitRow, SmartvaneMonthPlanRow, SmartvaneSerializableBundle } from './types'
import { sanitizeSmartvaneProfileId } from './smartvaneProfileCookie'

export const SMARTVANE_MAX_DAILY = 30
export const SMARTVANE_MAX_WEEKLY = 15
export const SMARTVANE_MAX_MONTHLY = 15

export type SmartvaneMonthBundle = {
  plan: SmartvaneMonthPlanRow | null
  habits: SmartvaneHabitRow[]
  dailyByHabit: Map<string, Set<string>>
  weeklyByHabit: Map<string, Set<number>>
  monthlyByHabit: Map<string, Set<number>>
}

/** Oppretter måned om den mangler; returnerer plan-rad. */
export async function ensureMonthPlan(
  supabase: SupabaseClient,
  userId: string,
  profileIdRaw: string,
  year: number,
  month: number,
): Promise<SmartvaneMonthPlanRow> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)

  const { data: existing, error: readErr } = await supabase
    .from('smartvane_month_plan')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (readErr) throw new Error(readErr.message)
  if (existing) return existing as SmartvaneMonthPlanRow

  const { data: created, error: insErr } = await supabase
    .from('smartvane_month_plan')
    .insert({ user_id: userId, profile_id: profileId, year, month, daily_goal_total: 10 })
    .select('*')
    .single()

  if (!insErr && created) return created as SmartvaneMonthPlanRow

  if (insErr) {
    const { data: retry } = await supabase
      .from('smartvane_month_plan')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()
    if (retry) return retry as SmartvaneMonthPlanRow
    throw new Error(insErr.message)
  }

  throw new Error('Kunne ikke opprette måned')
}

export async function loadSmartvaneMonthBundle(
  supabase: SupabaseClient,
  userId: string,
  profileIdRaw: string,
  year: number,
  month: number,
): Promise<SmartvaneMonthBundle> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)

  const { data: planRow, error: planErr } = await supabase
    .from('smartvane_month_plan')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (planErr) throw new Error(planErr.message)

  if (!planRow) {
    return {
      plan: null,
      habits: [],
      dailyByHabit: new Map(),
      weeklyByHabit: new Map(),
      monthlyByHabit: new Map(),
    }
  }

  const plan = planRow as SmartvaneMonthPlanRow

  const { data: habits, error: habErr } = await supabase
    .from('smartvane_habit')
    .select('*')
    .eq('month_plan_id', plan.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (habErr) throw new Error(habErr.message)

  const habitList = (habits ?? []) as SmartvaneHabitRow[]
  const habitIds = habitList.map((h) => h.id)

  if (habitIds.length === 0) {
    return {
      plan,
      habits: habitList,
      dailyByHabit: new Map(),
      weeklyByHabit: new Map(),
      monthlyByHabit: new Map(),
    }
  }

  const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
    supabase.from('smartvane_completion_daily').select('habit_id, completed_on').eq('user_id', userId).in('habit_id', habitIds),
    supabase.from('smartvane_completion_weekly').select('habit_id, week_row').eq('user_id', userId).in('habit_id', habitIds),
    supabase.from('smartvane_completion_monthly').select('habit_id, slot').eq('user_id', userId).in('habit_id', habitIds),
  ])

  if (dailyRes.error) throw new Error(dailyRes.error.message)
  if (weeklyRes.error) throw new Error(weeklyRes.error.message)
  if (monthlyRes.error) throw new Error(monthlyRes.error.message)

  const dailyByHabit = new Map<string, Set<string>>()
  const weeklyByHabit = new Map<string, Set<number>>()
  const monthlyByHabit = new Map<string, Set<number>>()

  for (const row of dailyRes.data ?? []) {
    const hid = row.habit_id as string
    const d = row.completed_on as string
    if (!dailyByHabit.has(hid)) dailyByHabit.set(hid, new Set())
    dailyByHabit.get(hid)!.add(d)
  }
  for (const row of weeklyRes.data ?? []) {
    const hid = row.habit_id as string
    const wr = row.week_row as number
    if (!weeklyByHabit.has(hid)) weeklyByHabit.set(hid, new Set())
    weeklyByHabit.get(hid)!.add(wr)
  }
  for (const row of monthlyRes.data ?? []) {
    const hid = row.habit_id as string
    const sl = row.slot as number
    if (!monthlyByHabit.has(hid)) monthlyByHabit.set(hid, new Set())
    monthlyByHabit.get(hid)!.add(sl)
  }

  return {
    plan,
    habits: habitList,
    dailyByHabit,
    weeklyByHabit,
    monthlyByHabit,
  }
}

/**
 * Slår sammen alle `smartvane_completion_daily`-datoer for daglige vaner med samme `name`
 * på tvers av alle brukerens månedsplaner (ulike `habit_id`, samme logiske vane), **innen samme profil**.
 */
export async function loadMergedDailyCompletionDatesByHabitName(
  supabase: SupabaseClient,
  userId: string,
  profileIdRaw: string,
  names: string[],
): Promise<Map<string, string[]>> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  const out = new Map<string, string[]>()
  if (unique.length === 0) return out

  const { data: habits, error: hErr } = await supabase
    .from('smartvane_habit')
    .select('id, name, month_plan_id')
    .eq('user_id', userId)
    .eq('kind', 'daily')
    .in('name', unique)

  if (hErr) throw new Error(hErr.message)

  const habitRows = habits ?? []
  if (habitRows.length === 0) {
    for (const n of unique) {
      out.set(n, [])
    }
    return out
  }

  const planIds = [...new Set(habitRows.map((r) => r.month_plan_id as string))]
  const { data: plans, error: pErr } = await supabase
    .from('smartvane_month_plan')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .in('id', planIds)

  if (pErr) throw new Error(pErr.message)
  const allowedPlan = new Set((plans ?? []).map((p) => p.id as string))

  for (const n of unique) {
    out.set(n, [])
  }

  const idToName = new Map<string, string>()
  for (const row of habitRows) {
    const pid = row.month_plan_id as string
    if (!allowedPlan.has(pid)) continue
    idToName.set(row.id as string, row.name as string)
  }

  if (idToName.size === 0) {
    return out
  }

  const habitIds = [...idToName.keys()]

  const { data: completions, error: cErr } = await supabase
    .from('smartvane_completion_daily')
    .select('habit_id, completed_on')
    .eq('user_id', userId)
    .in('habit_id', habitIds)

  if (cErr) throw new Error(cErr.message)

  const byName = new Map<string, Set<string>>()
  for (const n of unique) {
    byName.set(n, new Set())
  }

  for (const row of completions ?? []) {
    const hid = row.habit_id as string
    const nm = idToName.get(hid)
    if (!nm) continue
    const raw = row.completed_on as string
    const ymd = typeof raw === 'string' ? raw.slice(0, 10) : String(raw).slice(0, 10)
    byName.get(nm)?.add(ymd)
  }

  for (const n of unique) {
    out.set(n, [...(byName.get(n) ?? [])].sort())
  }
  return out
}

export function bundleToSerializable(bundle: SmartvaneMonthBundle): SmartvaneSerializableBundle {
  const dailyCompleted: Record<string, string[]> = {}
  for (const [k, v] of bundle.dailyByHabit) {
    dailyCompleted[k] = [...v].sort()
  }
  const weeklyCompleted: Record<string, number[]> = {}
  for (const [k, v] of bundle.weeklyByHabit) {
    weeklyCompleted[k] = [...v].sort((a, b) => a - b)
  }
  const monthlyCompleted: Record<string, number[]> = {}
  for (const [k, v] of bundle.monthlyByHabit) {
    monthlyCompleted[k] = [...v].sort((a, b) => a - b)
  }
  return {
    plan: bundle.plan,
    habits: bundle.habits,
    dailyCompleted,
    weeklyCompleted,
    monthlyCompleted,
  }
}
