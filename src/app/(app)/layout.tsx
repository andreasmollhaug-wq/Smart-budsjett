import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { AppStateProvider } from '@/components/app/AppStateProvider'
import { AppUserProvider } from '@/components/app/AppUserContext'
import OnboardingHost from '@/components/onboarding/OnboardingHost'
import DemoModeBanner from '@/components/app/DemoModeBanner'
import SubscriptionPastDueBanner from '@/components/app/SubscriptionPastDueBanner'
import ProductReleaseBanner from '@/components/app/ProductReleaseBanner'
import { SubscriptionReadOnlyProvider } from '@/components/app/SubscriptionReadOnlyProvider'
import { createClient } from '@/lib/supabase/server'
import { getDisplayNameFromUser } from '@/lib/authDisplayName'
import { getOrCreateUserAppState } from '@/lib/userAppStateServer'

/** Auth + Supabase-data krever server-request; unngår statisk prerender uten miljøvariabler. */
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/logg-inn')
  }

  const { state, wasCreated } = await getOrCreateUserAppState(supabase, user.id, user.email)
  const displayName = getDisplayNameFromUser(user)

  return (
    <AppStateProvider initialState={state} wasCreated={wasCreated} userId={user.id}>
      <AppUserProvider displayName={displayName} isFirstAppState={wasCreated}>
        <SubscriptionReadOnlyProvider>
          <OnboardingHost />
          <div className="flex min-h-screen-dvh flex-col">
            <SubscriptionPastDueBanner />
            <ProductReleaseBanner />
            <DemoModeBanner />
            <AppShell>{children}</AppShell>
          </div>
        </SubscriptionReadOnlyProvider>
      </AppUserProvider>
    </AppStateProvider>
  )
}
