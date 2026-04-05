'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { ROADMAP_INVITE_NOTIFICATION_ID, ROADMAP_INVITE_VISIBLE_MS } from '@/lib/roadmapInvite'

const TICK_MS = 1000

/**
 * Teller akkumulert tid når dokumentet er synlig; leverer roadmap-varsel én gang.
 */
export function RoadmapVisibleTimeInvite() {
  const accumulatedMsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const s0 = useStore.getState()
    if (
      s0.deliveredAnnouncementIds.includes(ROADMAP_INVITE_NOTIFICATION_ID) ||
      s0.notifications.some((n) => n.id === ROADMAP_INVITE_NOTIFICATION_ID)
    ) {
      return
    }

    const deliverIfNeeded = () => {
      const s = useStore.getState()
      if (s.deliveredAnnouncementIds.includes(ROADMAP_INVITE_NOTIFICATION_ID)) return true
      if (s.notifications.some((n) => n.id === ROADMAP_INVITE_NOTIFICATION_ID)) return true
      return false
    }

    if (deliverIfNeeded()) return

    const clearIntervalSafe = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const tick = () => {
      if (deliverIfNeeded()) {
        clearIntervalSafe()
        return
      }
      if (document.visibilityState !== 'visible') return
      accumulatedMsRef.current += TICK_MS
      if (accumulatedMsRef.current >= ROADMAP_INVITE_VISIBLE_MS) {
        useStore.getState().deliverRoadmapInviteNotification()
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
  }, [])

  return null
}
