import { createHash } from 'crypto'

/** Stable device id per user + profile (Neonomics x-device-id). */
export function deviceIdForUser(userId: string, profileId: string, prefix = 'dottir'): string {
  const hash = createHash('sha256').update(`${userId}:${profileId}`).digest('hex').slice(0, 32)
  return `${prefix}-${hash}`
}
