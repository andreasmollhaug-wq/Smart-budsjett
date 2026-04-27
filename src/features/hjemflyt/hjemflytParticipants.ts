import type { HjemflytSettings } from './types'

/**
 * Profiler som inngår i HjemFlyt-poolen (f.eks. for «Alle kan ta den»).
 * `participantProfileIds === null` betyr alle profiler i husholdningen.
 */
export function effectiveHjemflytProfileIds(allProfileIds: string[], settings: HjemflytSettings): string[] {
  const valid = new Set(allProfileIds)
  const p = settings.participantProfileIds
  if (p == null || !Array.isArray(p) || p.length === 0) {
    return allProfileIds.slice()
  }
  const filtered = p.filter((id) => valid.has(id))
  if (filtered.length === 0) return allProfileIds.slice()
  return filtered
}
