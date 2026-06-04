import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getDisplayNameFromUser } from '@/lib/authDisplayName'
import type { AdminAuthUserDirectoryEntry, AdminAuthUserSnapshot } from '@/lib/admin/types'

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

/** E-post og visningsnavn per bruker-id — kun for admin subscriber-liste. */
export async function listAuthUserDirectory(
  admin: SupabaseClient,
): Promise<Map<string, AdminAuthUserDirectoryEntry>> {
  const out = new Map<string, AdminAuthUserDirectoryEntry>()
  let page = 1
  const perPage = 1000

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data.users ?? []
    for (const user of users) {
      const email = user.email?.trim().toLowerCase() ?? ''
      if (!email) continue
      out.set(user.id, {
        email,
        displayName: getDisplayNameFromUser(user as User) || null,
        registeredAt: user.created_at ?? null,
      })
    }
    if (users.length < perPage) break
    page += 1
  }

  return out
}
