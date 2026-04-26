import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'HjemFlyt (intern)',
  robots: { index: false, follow: false },
}

/**
 * HjemFlyt: intern forhåndsversjon, ikke i sidefelt.
 * Egen husholdningsmodul, ingen kobling til transaksjoner/budsjett.
 */
export default async function InternHjemflytLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/logg-inn')
  }
  return <>{children}</>
}
