import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bundleToSerializable, ensureMonthPlan, loadSmartvaneMonthBundle } from '@/features/smartvane/data'
import { getSmartvaneProfileIdFromCookies } from '@/features/smartvane/smartvaneProfileCookieServer'
import { SmartvaneBellReminderSync } from '@/features/smartvane/SmartvaneBellReminderSync'
import SmartvaneTodayView from '@/features/smartvane/SmartvaneTodayView'

export const dynamic = 'force-dynamic'

export default async function SmartvaneTodayPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/logg-inn')

  const profileId = await getSmartvaneProfileIdFromCookies()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  await ensureMonthPlan(supabase, user.id, profileId, year, month)
  const bundle = await loadSmartvaneMonthBundle(supabase, user.id, profileId, year, month)
  const serial = bundleToSerializable(bundle)

  return (
    <>
      <SmartvaneBellReminderSync bundle={serial} year={year} month={month} profileId={profileId} />
      <SmartvaneTodayView bundle={serial} year={year} month={month} profileId={profileId} />
    </>
  )
}
