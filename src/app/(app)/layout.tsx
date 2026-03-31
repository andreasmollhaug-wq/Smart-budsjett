import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { AppStateProvider } from '@/components/app/AppStateProvider'
import { AppUserProvider } from '@/components/app/AppUserContext'
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

  const { state, wasCreated } = await getOrCreateUserAppState(supabase, user.id)
  const displayName = getDisplayNameFromUser(user)

  return (
    <AppStateProvider initialState={state} wasCreated={wasCreated} userId={user.id}>
      <AppUserProvider displayName={displayName} isFirstAppState={wasCreated}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex min-h-screen flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </AppUserProvider>
    </AppStateProvider>
  )
}
