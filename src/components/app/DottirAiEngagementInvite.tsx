'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import {
  DOTTIR_AI_ENGAGEMENT_NOTIFICATION_ID,
  DOTTIR_AI_ENGAGEMENT_VISIBLE_MS,
  hasUserUsedDottirAi,
} from '@/lib/dottirAiEngagementInvite'

const TICK_MS = 1000

type Props = {
  userId: string
}

/**
 * Teller akkumulert synlig tid i appen; leverer dottir AI-varsel én gang
 * når brukeren ikke allerede har tatt chatten i bruk.
 */
export function DottirAiEngagementInvite({ userId }: Props) {
  const pathname = usePathname()
  const accumulatedMsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (pathname.startsWith('/enkelexcel-ai')) return
    if (hasUserUsedDottirAi(userId)) return

    const s0 = useStore.getState()
    if (
      s0.deliveredAnnouncementIds.includes(DOTTIR_AI_ENGAGEMENT_NOTIFICATION_ID) ||
      s0.notifications.some((n) => n.id === DOTTIR_AI_ENGAGEMENT_NOTIFICATION_ID)
    ) {
      return
    }

    const alreadyDelivered = () => {
      const s = useStore.getState()
      if (s.deliveredAnnouncementIds.includes(DOTTIR_AI_ENGAGEMENT_NOTIFICATION_ID)) return true
      if (s.notifications.some((n) => n.id === DOTTIR_AI_ENGAGEMENT_NOTIFICATION_ID)) return true
      if (hasUserUsedDottirAi(userId)) return true
      return false
    }

    if (alreadyDelivered()) return

    const clearIntervalSafe = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const tick = () => {
      if (alreadyDelivered()) {
        clearIntervalSafe()
        return
      }
      if (document.visibilityState !== 'visible') return
      accumulatedMsRef.current += TICK_MS
      if (accumulatedMsRef.current >= DOTTIR_AI_ENGAGEMENT_VISIBLE_MS) {
        useStore.getState().deliverDottirAiEngagementNotification()
        clearIntervalSafe()
      }
    }

    const start = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(tick, TICK_MS)
    }

    const stop = () => {
      clearIntervalSafe()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearIntervalSafe()
    }
  }, [pathname, userId])

  return null
}
