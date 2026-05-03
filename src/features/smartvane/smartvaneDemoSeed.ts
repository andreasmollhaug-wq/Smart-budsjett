import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureMonthPlan } from '@/features/smartvane/data'
import { sanitizeSmartvaneProfileId } from '@/features/smartvane/smartvaneProfileCookie'

/** Prefiks ved sletting av demostrømforsøk — skal ikke blandes vanlige navn inn under. */
export const SMARTVANE_DEMO_HABIT_NAME_PREFIX = 'Demo · ' as const

type ActionOk = { ok: true }
type ActionFail = { ok: false; error: string }
export type SmartvaneDemoSeedResult = (ActionOk | ActionFail) & { seeded?: boolean }

function shiftCalendarMonth(year: number, month: number, delta: number): { y: number; m: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

function isoDate(y: number, mon: number, day: number): string {
  return `${y}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(y: number, mon: number): number {
  return new Date(y, mon, 0).getDate()
}

async function monthPlanIdsForProfile(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('smartvane_month_plan')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => r.id as string)
}

async function demoHabitsExist(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
): Promise<boolean> {
  const planIds = await monthPlanIdsForProfile(supabase, userId, profileId)
  if (planIds.length === 0) return false
  const { data } = await supabase
    .from('smartvane_habit')
    .select('id')
    .eq('user_id', userId)
    .in('month_plan_id', planIds)
    .like('name', `${SMARTVANE_DEMO_HABIT_NAME_PREFIX}%`)
    .limit(1)
    .maybeSingle()
  return data != null
}

/** Bruker har vaner uten Demo-prefiks på denne profilen — ikke overstyr med demoinnhold. */
async function nonDemoHabitsExist(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
): Promise<boolean> {
  const planIds = await monthPlanIdsForProfile(supabase, userId, profileId)
  if (planIds.length === 0) return false
  const { data } = await supabase
    .from('smartvane_habit')
    .select('id')
    .eq('user_id', userId)
    .in('month_plan_id', planIds)
    .not('name', 'like', `${SMARTVANE_DEMO_HABIT_NAME_PREFIX}%`)
    .limit(1)
    .maybeSingle()
  return data != null
}

type HabitSeed = {
  sort_order: number
  kind: 'daily' | 'weekly' | 'monthly'
  title: string
  target_days: number | null
  dailyCompletionsPredicate?: (dom: number, dim: number, refDayInMonth: number) => boolean
  weekRowsCompleted?: readonly number[]
  monthlySlots?: readonly number[]
}

const SHARED_HABITS: HabitSeed[] = [
  {
    sort_order: 0,
    kind: 'daily',
    title: 'Tidlig ro',
    target_days: 22,
    dailyCompletionsPredicate: (dom, _dim, ref) => dom <= ref && dom >= Math.max(1, ref - 9),
  },
  {
    sort_order: 1,
    kind: 'daily',
    title: 'Gåtur',
    target_days: 24,
    dailyCompletionsPredicate: (dom) => dom % 2 === 1,
  },
  {
    sort_order: 2,
    kind: 'daily',
    title: 'Vann før måltid',
    target_days: 28,
    dailyCompletionsPredicate: (dom) => dom !== 15 && dom % 3 !== 0,
  },
  {
    sort_order: 3,
    kind: 'daily',
    title: 'Les 10 min',
    target_days: 20,
    dailyCompletionsPredicate: (dom) => [1, 2, 3, 4, 5, 10, 11, 12, 18, 19, 20, 25, 26, 27].includes(dom),
  },
  {
    sort_order: 4,
    kind: 'daily',
    title: 'Styrkerutine',
    target_days: 14,
    dailyCompletionsPredicate: (dom) => dom <= 21 && (dom === 7 || dom === 14 || dom === 21 || dom === 10),
  },
  {
    sort_order: 5,
    kind: 'daily',
    title: 'Søvn før 23',
    target_days: 18,
    dailyCompletionsPredicate: (dom, dim, ref) => dom <= ref && dom > dim - 12,
  },
  {
    sort_order: 6,
    kind: 'daily',
    title: 'Pusteøvelse',
    target_days: 24,
    dailyCompletionsPredicate: (dom, _dim, ref) => dom <= ref && dom % 2 === 0,
  },
  {
    sort_order: 7,
    kind: 'daily',
    title: 'Takk for i dag',
    target_days: 21,
    dailyCompletionsPredicate: (dom, dim) => dom >= Math.max(1, dim - 10),
  },
  {
    sort_order: 8,
    kind: 'weekly',
    title: 'Løping / bevegelse',
    target_days: null,
    weekRowsCompleted: [0, 2],
  },
  {
    sort_order: 9,
    kind: 'weekly',
    title: 'Skifte sengetøy',
    target_days: null,
    weekRowsCompleted: [1],
  },
  {
    sort_order: 10,
    kind: 'monthly',
    title: 'Gå gjennom abonnementskost',
    target_days: null,
    monthlySlots: [0],
  },
  {
    sort_order: 11,
    kind: 'monthly',
    title: 'Helgesjekk økonomi',
    target_days: null,
    monthlySlots: [0, 1],
  },
]

async function insertHabit(
  supabase: SupabaseClient,
  params: {
    userId: string
    monthPlanId: string
    kind: 'daily' | 'weekly' | 'monthly'
    sortOrder: number
    title: string
    target_days: number | null
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from('smartvane_habit')
    .insert({
      user_id: params.userId,
      month_plan_id: params.monthPlanId,
      kind: params.kind,
      sort_order: params.sortOrder,
      name: `${SMARTVANE_DEMO_HABIT_NAME_PREFIX}${params.title}`,
      note:
        params.kind === 'daily'
          ? 'Eksempel fra demodata — slettes eller erstattes når du vil bruke ekte vaner.'
          : 'Eksempel fra demodata.',
      target_days: params.target_days,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id as string
}

/** Foregående måned med lette kryss på vaner du vil vise kryss måned i innsikt. */
async function seedPreviousMonthBridging(params: {
  supabase: SupabaseClient
  userId: string
  profileId: string
  year: number
  month: number
}): Promise<void> {
  const { supabase, userId, profileId, year, month } = params
  const dim = daysInMonth(year, month)

  const plan = await ensureMonthPlan(supabase, userId, profileId, year, month)
  /** Justér daglig mål mot demoset (ufarlig før vaner eksisterer). */
  await supabase
    .from('smartvane_month_plan')
    .update({ daily_goal_total: 8, updated_at: new Date().toISOString() })
    .eq('id', plan.id)
    .eq('user_id', userId)

  const tidligRo = await insertHabit(supabase, {
    userId,
    monthPlanId: plan.id,
    kind: 'daily',
    sortOrder: 0,
    title: 'Tidlig ro',
    target_days: 22,
  })
  const gatur = await insertHabit(supabase, {
    userId,
    monthPlanId: plan.id,
    kind: 'daily',
    sortOrder: 1,
    title: 'Gåtur',
    target_days: 24,
  })

  if (!tidligRo) throw new Error('Kunne ikke opprette demovane (Tidlig ro)')
  if (!gatur) throw new Error('Kunne ikke opprette demovane (Gåtur)')

  {
    const start = Math.max(1, dim - 14)
    const rows = []
    for (let d = start; d <= dim; d++) {
      rows.push({ habit_id: tidligRo, completed_on: isoDate(year, month, d), user_id: userId })
    }
    const { error } = await supabase.from('smartvane_completion_daily').insert(rows)
    if (error) throw new Error(error.message)
  }
  {
    const rows = []
    for (let d = dim - 5; d <= dim; d += 2) {
      rows.push({ habit_id: gatur, completed_on: isoDate(year, month, Math.max(1, d)), user_id: userId })
    }
    const { error } = await supabase.from('smartvane_completion_daily').insert(rows)
    if (error) throw new Error(error.message)
  }
}

async function seedRichCurrentMonth(params: {
  supabase: SupabaseClient
  userId: string
  profileId: string
  year: number
  month: number
  nowY: number
  nowM: number
  nowD: number
}): Promise<void> {
  const { supabase, userId, profileId, year, month, nowY, nowM, nowD } = params
  const dim = daysInMonth(year, month)
  const refDayInMonth = year === nowY && month === nowM ? nowD : dim

  const plan = await ensureMonthPlan(supabase, userId, profileId, year, month)
  await supabase
    .from('smartvane_month_plan')
    .update({ daily_goal_total: 8, updated_at: new Date().toISOString() })
    .eq('id', plan.id)
    .eq('user_id', userId)

  const idByLabel = new Map<string, string>()
  for (const h of SHARED_HABITS) {
    const hid = await insertHabit(supabase, {
      userId,
      monthPlanId: plan.id,
      kind: h.kind,
      sortOrder: h.sort_order,
      title: h.title,
      target_days: h.kind === 'daily' ? h.target_days : null,
    })
    if (!hid) throw new Error(`Kunne ikke opprette demovane (${h.kind}: ${h.title})`)
    idByLabel.set(`${h.kind}:${h.title}`, hid)
  }

  for (const h of SHARED_HABITS.filter((x) => x.kind === 'daily')) {
    const id = idByLabel.get(`daily:${h.title}`)
    if (!id || !h.dailyCompletionsPredicate) continue
    const rows = []
    for (let d = 1; d <= dim; d++) {
      if (!h.dailyCompletionsPredicate(d, dim, refDayInMonth)) continue
      rows.push({ habit_id: id, completed_on: isoDate(year, month, d), user_id: userId })
    }
    if (rows.length === 0) continue
    const { error } = await supabase.from('smartvane_completion_daily').insert(rows)
    if (error) throw new Error(error.message)
  }

  for (const h of SHARED_HABITS.filter((x) => x.kind === 'weekly')) {
    const id = idByLabel.get(`weekly:${h.title}`)
    const wrs = h.weekRowsCompleted ?? []
    if (!id || wrs.length === 0) continue
    const { error } = await supabase
      .from('smartvane_completion_weekly')
      .insert(wrs.map((week_row) => ({ habit_id: id, week_row, user_id: userId })))
    if (error) throw new Error(error.message)
  }

  for (const h of SHARED_HABITS.filter((x) => x.kind === 'monthly')) {
    const id = idByLabel.get(`monthly:${h.title}`)
    const slots = h.monthlySlots ?? []
    if (!id || slots.length === 0) continue
    const { error } = await supabase.from('smartvane_completion_monthly').insert(
      slots.map((slot) => ({
        habit_id: id,
        slot: slot as number,
        user_id: userId,
      })),
    )
    if (error) throw new Error(error.message)
  }
}

export async function performSmartvaneDemoSeed(
  supabase: SupabaseClient,
  userId: string,
  profileIdRaw: string,
  nowArg: Date = new Date(),
): Promise<SmartvaneDemoSeedResult> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)
  try {
    if (await demoHabitsExist(supabase, userId, profileId)) {
      return { ok: true, seeded: false }
    }
    if (await nonDemoHabitsExist(supabase, userId, profileId)) {
      return { ok: true, seeded: false }
    }

    const nowY = nowArg.getFullYear()
    const nowM = nowArg.getMonth() + 1
    const nowD = nowArg.getDate()
    const prev = shiftCalendarMonth(nowY, nowM, -1)

    await seedPreviousMonthBridging({
      supabase,
      userId,
      profileId,
      year: prev.y,
      month: prev.m,
    })

    await seedRichCurrentMonth({
      supabase,
      userId,
      profileId,
      year: nowY,
      month: nowM,
      nowY,
      nowM,
      nowD,
    })

    return { ok: true, seeded: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Kunne ikke legge inn SmartVaner-demodata' }
  }
}

export async function performSmartvaneDemoClear(
  supabase: SupabaseClient,
  userId: string,
  profileIdRaw: string,
): Promise<SmartvaneDemoSeedResult> {
  const profileId = sanitizeSmartvaneProfileId(profileIdRaw)
  try {
    const planIds = await monthPlanIdsForProfile(supabase, userId, profileId)
    if (planIds.length === 0) return { ok: true, seeded: false }

    const { error } = await supabase
      .from('smartvane_habit')
      .delete()
      .eq('user_id', userId)
      .in('month_plan_id', planIds)
      .like('name', `${SMARTVANE_DEMO_HABIT_NAME_PREFIX}%`)
    if (error) return { ok: false, error: error.message }

    for (const pid of planIds) {
      const { count, error: cErr } = await supabase
        .from('smartvane_habit')
        .select('id', { count: 'exact', head: true })
        .eq('month_plan_id', pid)
      if (cErr) continue
      if ((count ?? 0) !== 0) continue
      await supabase.from('smartvane_month_plan').delete().eq('id', pid).eq('user_id', userId)
    }

    return { ok: true, seeded: false }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Kunne ikke rydde SmartVaner-demodata' }
  }
}
