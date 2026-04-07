import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'
import {
  currentYearMonthOslo,
  getBonusPackCredits,
  getBonusPackPriceNok,
  getMonthlyMessageLimit,
} from '@/lib/aiUsage'

export const dynamic = 'force-dynamic'

export async function GET() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const subStatus = await fetchUserSubscriptionStatus(supabase, user.id)
  const denied = subscriptionForbiddenUnlessAccess(subStatus)
  if (denied) return denied

  const limit = getMonthlyMessageLimit()
  const month = currentYearMonthOslo()

  const [{ data: row, error }, { data: bonusRow, error: bonusErr }] = await Promise.all([
    supabase
      .from('ai_monthly_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('year_month', month)
      .maybeSingle(),
    supabase.from('user_ai_bonus_credits').select('credits').eq('user_id', user.id).maybeSingle(),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (bonusErr) {
    return NextResponse.json({ error: bonusErr.message }, { status: 500 })
  }

  const used = row?.message_count ?? 0
  const bonusCredits = bonusRow?.credits ?? 0

  return NextResponse.json({
    used,
    limit,
    month,
    bonusCredits,
    bonusPackCredits: getBonusPackCredits(),
    bonusPackPriceNok: getBonusPackPriceNok(),
  })
}
