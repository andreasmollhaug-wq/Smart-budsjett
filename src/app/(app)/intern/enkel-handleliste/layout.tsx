import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEnkelHandlelisteStateForUser } from '@/lib/enkelHandlelisteStateServer'
import { EnkelHandlelisteProvider } from '@/features/enkelHandleliste/EnkelHandlelisteProvider'
import EnkelHandlelisteInternLayoutClient from '@/features/enkelHandleliste/EnkelHandlelisteInternLayoutClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Enkel handleliste (intern)',
  robots: { index: false, follow: false },
}

export default async function EnkelHandlelisteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/logg-inn')
  }

  const initialState = await getEnkelHandlelisteStateForUser(supabase, user.id)

  return (
    <EnkelHandlelisteProvider initialState={initialState} userId={user.id}>
      <EnkelHandlelisteInternLayoutClient>{children}</EnkelHandlelisteInternLayoutClient>
    </EnkelHandlelisteProvider>
  )
}
