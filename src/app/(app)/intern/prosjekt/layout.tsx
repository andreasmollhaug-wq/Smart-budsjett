import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRenovationModuleStateForUser } from '@/lib/renovationProjectStateServer'
import { RenovationModuleProvider } from '@/features/renovation-project/RenovationModuleProvider'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Prosjekter (intern)',
  robots: { index: false, follow: false },
}

export default async function InternProsjektLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/logg-inn')
  }

  const initialState = await getRenovationModuleStateForUser(supabase, user.id)

  return (
    <RenovationModuleProvider initialState={initialState} userId={user.id}>
      {children}
    </RenovationModuleProvider>
  )
}
