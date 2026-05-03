import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bundleToSerializable, ensureMonthPlan, loadSmartvaneMonthBundle } from '@/features/smartvane/data'
import { getSmartvaneProfileIdFromCookies } from '@/features/smartvane/smartvaneProfileCookieServer'
import { SmartvaneBellReminderSync } from '@/features/smartvane/SmartvaneBellReminderSync'
import SmartvaneMonthView from '@/features/smartvane/SmartvaneMonthView'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ y?: string; m?: string }>
}

export default async function SmartvaneMonthPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/logg-inn')

  const profileId = await getSmartvaneProfileIdFromCookies()
  const sp = await searchParams
  const now = new Date()
  let year = sp.y != null && sp.y !== '' ? parseInt(sp.y, 10) : now.getFullYear()
  let month = sp.m != null && sp.m !== '' ? parseInt(sp.m, 10) : now.getMonth() + 1
  if (Number.isNaN(year) || year < 2000 || year > 2100) year = now.getFullYear()
  if (Number.isNaN(month) || month < 1 || month > 12) month = now.getMonth() + 1

  await ensureMonthPlan(supabase, user.id, profileId, year, month)
  const bundle = await loadSmartvaneMonthBundle(supabase, user.id, profileId, year, month)
  const serial = bundleToSerializable(bundle)

  return (
    <>
      <SmartvaneBellReminderSync bundle={serial} year={year} month={month} profileId={profileId} />
      <SmartvaneMonthView bundle={serial} year={year} month={month} profileId={profileId} />
    </>
  )
}
