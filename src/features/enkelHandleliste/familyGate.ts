import type { SubscriptionPlan } from '@/lib/store'

export function isFamilyCollaborationEnabled(
  subscriptionPlan: SubscriptionPlan,
  profileCount: number,
): boolean {
  return subscriptionPlan === 'family' && profileCount >= 2
}

/** Standard medlemmer: alle profiler unntatt eier. */
export function defaultMemberProfileIds(
  ownerProfileId: string,
  allProfileIds: string[],
): string[] {
  return allProfileIds.filter((id) => id !== ownerProfileId)
}

export function canEditList(
  list: { ownerProfileId: string; memberProfileIds: string[] },
  profileId: string,
): boolean {
  if (list.ownerProfileId === profileId) return true
  return list.memberProfileIds.includes(profileId)
}

export function isListOwner(list: { ownerProfileId: string }, profileId: string): boolean {
  return list.ownerProfileId === profileId
}
