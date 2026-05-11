/** Kompakt ikke-personlig merkelapp for anonyme UUID-er (kun forum-MVP). */
export function forumAuthorBadge(userId: string): string {
  const cleaned = userId.replace(/-/g, '')
  return cleaned.slice(0, 6).toUpperCase()
}

/** Visningsnavn fra forum_profile, ellers kort kode. */
export function forumAuthorDisplay(
  userId: string,
  profileDisplayByUserId: Record<string, string | null | undefined>,
): string {
  const name = profileDisplayByUserId[userId]?.trim()
  if (name && name.length >= 2) return name
  return forumAuthorBadge(userId)
}
