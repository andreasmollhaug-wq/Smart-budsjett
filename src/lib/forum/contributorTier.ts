/** Tråder vektes høyere enn svar — juster her ved behov. */
export const FORUM_CONTRIBUTOR_WEIGHTS = { thread: 3, reply: 1 } as const

/** Synkende liste: første treff er det brukeren har oppnådd. minScore er poeng (tråd/svar-vekter under). */
export const FORUM_CONTRIBUTOR_TIERS_DESC = [
  { id: 'veteran', labelNb: 'Veteran', minScore: 250, emoji: '🏆' },
  { id: 'established', labelNb: 'Etablert bidragsyter', minScore: 100, emoji: '✨' },
  { id: 'active', labelNb: 'Aktiv', minScore: 40, emoji: '💬' },
  { id: 'warming', labelNb: 'På vei', minScore: 12, emoji: '🌱' },
  { id: 'new', labelNb: 'Ny deltaker', minScore: 0, emoji: '👋' },
] as const

export type ForumContributorTier = (typeof FORUM_CONTRIBUTOR_TIERS_DESC)[number]

export function forumContributorScore(threadCount: number, replyCount: number): number {
  return threadCount * FORUM_CONTRIBUTOR_WEIGHTS.thread + replyCount * FORUM_CONTRIBUTOR_WEIGHTS.reply
}

export function forumContributorTier(score: number): ForumContributorTier {
  for (const t of FORUM_CONTRIBUTOR_TIERS_DESC) {
    if (score >= t.minScore) return t
  }
  return FORUM_CONTRIBUTOR_TIERS_DESC[FORUM_CONTRIBUTOR_TIERS_DESC.length - 1]
}
