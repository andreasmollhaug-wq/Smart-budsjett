'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  SMARTVANE_MAX_DAILY,
  SMARTVANE_MAX_MONTHLY,
  SMARTVANE_MAX_WEEKLY,
  loadSmartvaneMonthBundle,
} from './data'
import { ROUTINE_PRESET_BATCH_MAX, getRoutinePresetById } from './routinePresets'
import { smartvanePaths } from './paths'
import { performSmartvaneDemoClear, performSmartvaneDemoSeed } from './smartvaneDemoSeed'
import type { SmartvaneHabitKind } from './types'
import { DEFAULT_SMARTVANE_PROFILE_ID, sanitizeSmartvaneProfileId } from './smartvaneProfileCookie'
import { getSmartvaneProfileIdFromCookies } from './smartvaneProfileCookieServer'

export type ActionResult = { ok: true } | { ok: false; error: string }

export type PresetBatchSkip = { presetId: string; reason: string }

export type AddHabitsFromPresetIdsResult =
  | { ok: false; error: string }
  | { ok: true; added: number; skipped: PresetBatchSkip[] }

function revalidateSmartvane() {
  revalidatePath(smartvanePaths.root, 'layout')
}

export async function getOrCreateMonthPlan(
  year: number,
  month: number,
  profileIdRaw?: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const profileId =
      profileIdRaw !== undefined
        ? sanitizeSmartvaneProfileId(profileIdRaw)
        : await getSmartvaneProfileIdFromCookies()

    const { data: existing } = await supabase
      .from('smartvane_month_plan')
      .select('id')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    if (existing) {
      revalidateSmartvane()
      return { ok: true }
    }

    const { error } = await supabase.from('smartvane_month_plan').insert({
      user_id: user.id,
      profile_id: profileId,
      year,
      month,
      daily_goal_total: 10,
    })

    if (error) return { ok: false, error: error.message }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function updateDailyGoalTotal(
  planId: string,
  dailyGoalTotal: number,
  profileIdRaw: string,
): Promise<ActionResult> {
  if (dailyGoalTotal < 1 || dailyGoalTotal > 100) {
    return { ok: false, error: 'Daglig mål må være 1–100' }
  }
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { error } = await supabase
      .from('smartvane_month_plan')
      .update({ daily_goal_total: dailyGoalTotal, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('user_id', user.id)
      .eq('profile_id', profileId)

    if (error) return { ok: false, error: error.message }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function addHabit(params: {
  profileId: string
  monthPlanId: string
  kind: SmartvaneHabitKind
  name: string
  note?: string | null
  targetDays?: number | null
}): Promise<ActionResult> {
  const name = params.name.trim()
  if (!name) return { ok: false, error: 'Navn kan ikke være tomt' }
  const profileId = sanitizeSmartvaneProfileId(params.profileId)

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { data: planOk } = await supabase
      .from('smartvane_month_plan')
      .select('id')
      .eq('id', params.monthPlanId)
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (!planOk) return { ok: false, error: 'Ugyldig måned' }

    const { data: habits } = await supabase
      .from('smartvane_habit')
      .select('kind')
      .eq('month_plan_id', params.monthPlanId)
      .eq('user_id', user.id)

    const counts = { daily: 0, weekly: 0, monthly: 0 }
    for (const h of habits ?? []) {
      const k = h.kind as SmartvaneHabitKind
      counts[k] += 1
    }

    if (params.kind === 'daily' && counts.daily >= SMARTVANE_MAX_DAILY) {
      return { ok: false, error: `Maks ${SMARTVANE_MAX_DAILY} daglige vaner` }
    }
    if (params.kind === 'weekly' && counts.weekly >= SMARTVANE_MAX_WEEKLY) {
      return { ok: false, error: `Maks ${SMARTVANE_MAX_WEEKLY} ukentlige vaner` }
    }
    if (params.kind === 'monthly' && counts.monthly >= SMARTVANE_MAX_MONTHLY) {
      return { ok: false, error: `Maks ${SMARTVANE_MAX_MONTHLY} månedlige vaner` }
    }

    let sortOrder = 0
    const { data: maxSort } = await supabase
      .from('smartvane_habit')
      .select('sort_order')
      .eq('month_plan_id', params.monthPlanId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (maxSort && typeof maxSort.sort_order === 'number') {
      sortOrder = maxSort.sort_order + 1
    }

    const targetDays =
      params.kind === 'daily' && params.targetDays != null && params.targetDays >= 1
        ? Math.min(31, params.targetDays)
        : null

    const { error } = await supabase.from('smartvane_habit').insert({
      user_id: user.id,
      month_plan_id: params.monthPlanId,
      kind: params.kind,
      sort_order: sortOrder,
      name,
      note: params.note?.trim() || null,
      target_days: targetDays,
    })

    if (error) return { ok: false, error: error.message }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function addHabitsFromPresetIds(params: {
  profileId: string
  monthPlanId: string
  presetIds: string[]
}): Promise<AddHabitsFromPresetIdsResult> {
  const profileId = sanitizeSmartvaneProfileId(params.profileId)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const seenIds = new Set<string>()
    const presetIdsOrdered: string[] = []
    for (const raw of params.presetIds) {
      const id = raw.trim()
      if (!id || seenIds.has(id)) continue
      seenIds.add(id)
      presetIdsOrdered.push(id)
    }

    if (presetIdsOrdered.length === 0) {
      return { ok: false, error: 'Ingen rutiner er valgt' }
    }

    if (presetIdsOrdered.length > ROUTINE_PRESET_BATCH_MAX) {
      return { ok: false, error: `Velg høyst ${ROUTINE_PRESET_BATCH_MAX} rutiner om gangen` }
    }

    const { data: planOk } = await supabase
      .from('smartvane_month_plan')
      .select('id')
      .eq('id', params.monthPlanId)
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (!planOk) return { ok: false, error: 'Ugyldig måned' }

    const { data: habits } = await supabase
      .from('smartvane_habit')
      .select('kind')
      .eq('month_plan_id', params.monthPlanId)
      .eq('user_id', user.id)

    const counts = { daily: 0, weekly: 0, monthly: 0 }
    for (const h of habits ?? []) {
      const k = h.kind as SmartvaneHabitKind
      counts[k] += 1
    }

    const { data: maxSortRow } = await supabase
      .from('smartvane_habit')
      .select('sort_order')
      .eq('month_plan_id', params.monthPlanId)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    let sortOrder =
      maxSortRow && typeof maxSortRow.sort_order === 'number' ? maxSortRow.sort_order + 1 : 0

    const skipped: PresetBatchSkip[] = []
    let added = 0

    for (const presetId of presetIdsOrdered) {
      const preset = getRoutinePresetById(presetId)
      if (!preset) {
        skipped.push({ presetId, reason: 'Ukjent rutine' })
        continue
      }

      const kind = preset.kind as SmartvaneHabitKind
      if (kind === 'daily' && counts.daily >= SMARTVANE_MAX_DAILY) {
        skipped.push({ presetId, reason: `Maks ${SMARTVANE_MAX_DAILY} daglige vaner` })
        continue
      }
      if (kind === 'weekly' && counts.weekly >= SMARTVANE_MAX_WEEKLY) {
        skipped.push({ presetId, reason: `Maks ${SMARTVANE_MAX_WEEKLY} ukentlige vaner` })
        continue
      }
      if (kind === 'monthly' && counts.monthly >= SMARTVANE_MAX_MONTHLY) {
        skipped.push({ presetId, reason: `Maks ${SMARTVANE_MAX_MONTHLY} månedlige vaner` })
        continue
      }

      const targetDaysNormalized =
        kind === 'daily' && preset.targetDays != null && preset.targetDays >= 1
          ? Math.min(31, preset.targetDays)
          : null

      const { error } = await supabase.from('smartvane_habit').insert({
        user_id: user.id,
        month_plan_id: params.monthPlanId,
        kind: preset.kind,
        sort_order: sortOrder,
        name: preset.name.trim(),
        note: preset.note?.trim() || null,
        target_days: targetDaysNormalized,
      })

      if (error) {
        skipped.push({ presetId, reason: error.message })
        continue
      }

      counts[kind] += 1
      sortOrder += 1
      added += 1
    }

    if (added > 0) revalidateSmartvane()

    return { ok: true, added, skipped }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function updateHabit(params: {
  habitId: string
  name: string
  note?: string | null
  targetDays?: number | null
}): Promise<ActionResult> {
  const name = params.name.trim()
  if (!name) return { ok: false, error: 'Navn kan ikke være tomt' }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { data: habit } = await supabase
      .from('smartvane_habit')
      .select('kind')
      .eq('id', params.habitId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!habit) return { ok: false, error: 'Vane ikke funnet' }

    const targetDays =
      habit.kind === 'daily' && params.targetDays != null && params.targetDays >= 1
        ? Math.min(31, params.targetDays)
        : null

    const { error } = await supabase
      .from('smartvane_habit')
      .update({
        name,
        note: params.note?.trim() || null,
        target_days: habit.kind === 'daily' ? targetDays : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.habitId)
      .eq('user_id', user.id)

    if (error) return { ok: false, error: error.message }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function deleteHabit(habitId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { error } = await supabase.from('smartvane_habit').delete().eq('id', habitId).eq('user_id', user.id)

    if (error) return { ok: false, error: error.message }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function toggleDailyCompletion(habitId: string, completedOn: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { data: existing } = await supabase
      .from('smartvane_completion_daily')
      .select('habit_id')
      .eq('habit_id', habitId)
      .eq('completed_on', completedOn)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('smartvane_completion_daily')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_on', completedOn)
        .eq('user_id', user.id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase.from('smartvane_completion_daily').insert({
        habit_id: habitId,
        completed_on: completedOn,
        user_id: user.id,
      })
      if (error) return { ok: false, error: error.message }
    }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function toggleWeeklyCompletion(habitId: string, weekRow: number): Promise<ActionResult> {
  if (weekRow < 0 || weekRow > 4) return { ok: false, error: 'Ugyldig uke' }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { data: existing } = await supabase
      .from('smartvane_completion_weekly')
      .select('habit_id')
      .eq('habit_id', habitId)
      .eq('week_row', weekRow)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('smartvane_completion_weekly')
        .delete()
        .eq('habit_id', habitId)
        .eq('week_row', weekRow)
        .eq('user_id', user.id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase.from('smartvane_completion_weekly').insert({
        habit_id: habitId,
        week_row: weekRow,
        user_id: user.id,
      })
      if (error) return { ok: false, error: error.message }
    }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function toggleMonthlySlot(habitId: string, slot: 0 | 1): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { data: existing } = await supabase
      .from('smartvane_completion_monthly')
      .select('habit_id')
      .eq('habit_id', habitId)
      .eq('slot', slot)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('smartvane_completion_monthly')
        .delete()
        .eq('habit_id', habitId)
        .eq('slot', slot)
        .eq('user_id', user.id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase.from('smartvane_completion_monthly').insert({
        habit_id: habitId,
        slot,
        user_id: user.id,
      })
      if (error) return { ok: false, error: error.message }
    }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function copyMonthToNext(
  sourceYear: number,
  sourceMonth: number,
  profileIdRaw: string,
): Promise<ActionResult> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    let ny = sourceMonth + 1
    let y = sourceYear
    if (ny > 12) {
      ny = 1
      y += 1
    }

    const bundle = await loadSmartvaneMonthBundle(supabase, user.id, profileId, sourceYear, sourceMonth)
    if (!bundle.plan) return { ok: false, error: 'Ingen plan å kopiere fra' }

    const { data: target } = await supabase
      .from('smartvane_month_plan')
      .select('id')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .eq('year', y)
      .eq('month', ny)
      .maybeSingle()

    if (target) {
      return { ok: false, error: 'Måneden finnes allerede — åpne den i stedet' }
    }

    const { data: newPlan, error: insErr } = await supabase
      .from('smartvane_month_plan')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        year: y,
        month: ny,
        daily_goal_total: bundle.plan.daily_goal_total,
      })
      .select('id')
      .single()

    if (insErr || !newPlan) return { ok: false, error: insErr?.message ?? 'Kunne ikke opprette måned' }

    const newPlanId = newPlan.id as string

    for (const h of bundle.habits) {
      const { error: hErr } = await supabase.from('smartvane_habit').insert({
        user_id: user.id,
        month_plan_id: newPlanId,
        kind: h.kind,
        sort_order: h.sort_order,
        name: h.name,
        note: h.note,
        target_days: h.target_days,
      })
      if (hErr) return { ok: false, error: hErr.message }
    }

    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function seedSmartvaneDemoIfNeeded(): Promise<ActionResult & { seeded?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const profileId = await getSmartvaneProfileIdFromCookies()
    const r = await performSmartvaneDemoSeed(supabase, user.id, profileId)
    if (r.ok) revalidateSmartvane()
    return r
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

export async function clearSmartvaneDemoData(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const profileId = await getSmartvaneProfileIdFromCookies()
    const r = await performSmartvaneDemoClear(supabase, user.id, profileId)
    if (r.ok) {
      revalidateSmartvane()
      return { ok: true }
    }
    return r
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}

/**
 * Sletter alle SmartVane-månedsplaner (og vaner/fullføringer via cascade) for én budsjettprofil.
 * Kun for profilfjerning — ikke for hovedprofil.
 */
export async function deleteSmartvaneDataForProfile(profileIdRaw: string): Promise<ActionResult> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)
  if (profileId === DEFAULT_SMARTVANE_PROFILE_ID) {
    return { ok: false, error: 'Kan ikke slette SmartVane for hovedprofilen' }
  }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Ikke innlogget' }

    const { error } = await supabase
      .from('smartvane_month_plan')
      .delete()
      .eq('user_id', user.id)
      .eq('profile_id', profileId)

    if (error) return { ok: false, error: error.message }
    revalidateSmartvane()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ukjent feil' }
  }
}
