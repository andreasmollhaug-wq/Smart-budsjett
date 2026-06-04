import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import AdminAccessGate from '@/components/admin/AdminAccessGate'
import AdminMetricsDashboard from '@/components/admin/AdminMetricsDashboard'
import { requireAdminViewerAccess } from '@/lib/admin/adminViewerAccess'
import { getDisplayNameFromUser } from '@/lib/authDisplayName'
import { createClient } from '@/lib/supabase/server'

function AdminDashboardFallback() {
  return (
    <div className="mx-auto max-w-6xl min-w-0 px-[max(1rem,env(safe-area-inset-left))] py-12 sm:px-[max(1.5rem,env(safe-area-inset-left))]">
      <div className="animate-pulse space-y-6">
        <div className="h-32 rounded-2xl" style={{ background: 'var(--surface)' }} />
        <div className="h-12 rounded-2xl" style={{ background: 'var(--surface)' }} />
        <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  )
}

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
      return <AdminAccessGate reason="config" />
    }
    return <AdminAccessGate reason={access.reason} />
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const greetingName = getDisplayNameFromUser(user)

  return (
    <Suspense fallback={<AdminDashboardFallback />}>
      <AdminMetricsDashboard greetingName={greetingName} />
    </Suspense>
  )
}
