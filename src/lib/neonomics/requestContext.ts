import type { NextRequest } from 'next/server'
import { deviceIdForUser } from '@/lib/neonomics/deviceId'
import { psuIdForBank } from '@/lib/neonomics/psu'
import type { NeonomicsRequestContext } from '@/lib/neonomics/client'
import { getNeonomicsConfig } from '@/lib/neonomics/config'

export function psuIpFromRequest(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return '127.0.0.1'
}

export function buildNeonomicsContext(
  userId: string,
  profileId: string,
  req?: Request | NextRequest | null,
  opts?: { sessionId?: string; psuIp?: string; bankId?: string },
): NeonomicsRequestContext & { sessionId?: string } {
  const { deviceIdPrefix } = getNeonomicsConfig()
  const psuIp = opts?.psuIp ?? (req ? psuIpFromRequest(req) : '127.0.0.1')
  const psuId = opts?.bankId ? psuIdForBank(opts.bankId) : undefined
  return {
    deviceId: deviceIdForUser(userId, profileId, deviceIdPrefix),
    sessionId: opts?.sessionId,
    psuIp,
    ...(psuId ? { psuId } : {}),
  }
}
