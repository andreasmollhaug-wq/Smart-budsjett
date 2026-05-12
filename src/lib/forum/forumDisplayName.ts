import type { SupabaseClient } from '@supabase/supabase-js'

export const FORUM_DISPLAY_NAME_REQUIRED_CODE = 'forum_display_name_required' as const

export type ForumDisplayNameRequiredCode = typeof FORUM_DISPLAY_NAME_REQUIRED_CODE

export const FORUM_DISPLAY_NAME_PARTICIPATION_ERROR =
  'Du må velge forumnavn på forumprofilen før du kan stemme eller skrive.'

/** Samme terskel som `forumAuthorDisplay`: visningsnavn fremfor kort kode. */
export function hasEligibleForumDisplayName(name: string | null | undefined): boolean {
  return typeof name === 'string' && name.trim().length >= 2
}

export type ForumDisplayNameBlock =
  | { ok: true }
  | { ok: false; error: string; code?: typeof FORUM_DISPLAY_NAME_REQUIRED_CODE }

export async function assertForumDisplayNameForParticipation(
  supabase: SupabaseClient,
  userId: string,
): Promise<ForumDisplayNameBlock> {
  const { data: row, error } = await supabase
    .from('forum_profile')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return {
      ok: false,
      error: error.message ? `Kunne ikke sjekke forumprofil (${error.message}).` : 'Kunne ikke sjekke forumprofil.',
    }
  }

  const dn =
    row && typeof (row as { display_name?: unknown }).display_name === 'string'
      ? (row as { display_name: string }).display_name
      : null

  if (!hasEligibleForumDisplayName(dn)) {
    return { ok: false, error: FORUM_DISPLAY_NAME_PARTICIPATION_ERROR, code: FORUM_DISPLAY_NAME_REQUIRED_CODE }
  }

  return { ok: true }
}
