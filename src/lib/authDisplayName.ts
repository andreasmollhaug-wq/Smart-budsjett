import type { User } from '@supabase/supabase-js'

function titleCaseLocalPart(local: string): string {
  if (!local) return ''
  return local.charAt(0).toUpperCase() + local.slice(1)
}

/**
 * Visningsnavn for velkomsthilsen: OAuth/metadata først, deretter lokal del av e-post.
 */
export function getDisplayNameFromUser(user: User | null | undefined): string {
  if (!user) return ''

  const meta = user.user_metadata as Record<string, unknown> | undefined
  const fromFull = meta?.full_name
  const fromName = meta?.name
  if (typeof fromFull === 'string' && fromFull.trim()) return fromFull.trim()
  if (typeof fromName === 'string' && fromName.trim()) return fromName.trim()

  const email = user.email
  if (!email) return ''
  const local = email.split('@')[0]?.trim()
  if (!local) return ''
  return titleCaseLocalPart(local)
}
