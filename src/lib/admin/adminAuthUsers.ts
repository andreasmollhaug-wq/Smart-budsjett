import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminAuthUserSnapshot } from '@/lib/admin/types'

export async function listAllAuthUserSnapshots(
  admin: SupabaseClient,
): Promise<AdminAuthUserSnapshot[]> {
  const out: AdminAuthUserSnapshot[] = []
  let page = 1
  const perPage = 1000

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data.users ?? []
    for (const user of users) {
      const confirmed =
        (user as { email_confirmed_at?: string | null }).email_confirmed_at ??
        (user as { confirmed_at?: string | null }).confirmed_at ??
        null
      out.push({
        createdAt: user.created_at ?? null,
        emailConfirmedAt: confirmed,
      })
    }
    if (users.length < perPage) break
    page += 1
  }

  return out
}
