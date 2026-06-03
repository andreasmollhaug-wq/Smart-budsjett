import { redirect } from 'next/navigation'
import AdminAccessGate from '@/components/admin/AdminAccessGate'
import AdminMetricsDashboard from '@/components/admin/AdminMetricsDashboard'
import { requireAdminViewerAccess } from '@/lib/admin/adminViewerAccess'
import { getDisplayNameFromUser } from '@/lib/authDisplayName'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const access = await requireAdminViewerAccess(supabase)

  if (!access.ok) {
    if (access.reason === 'unauthenticated') {
      redirect('/logg-inn?next=/admin')
    }
    if (access.reason === 'mfa_step_up_required') {
      redirect('/logg-inn/tofaktor?next=/admin')
    }
    if (access.reason === 'config') {
      return <AdminAccessGate reason="no_email" />
    }
    return <AdminAccessGate reason={access.reason} />
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const greetingName = getDisplayNameFromUser(user)

  return <AdminMetricsDashboard greetingName={greetingName} />
}
