import { neonomicsJson } from '@/lib/neonomics/client'
import type { NeonomicsRequestContext } from '@/lib/neonomics/client'

export async function createNeonomicsSession(
  ctx: NeonomicsRequestContext,
  bankId: string,
): Promise<{ sessionId: string }> {
  return neonomicsJson<{ sessionId: string }>('/ics/v3/session', ctx, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankId }),
  })
}
