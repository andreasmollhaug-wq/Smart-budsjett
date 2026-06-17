'use client'

import { useEffect, useRef, useState } from 'react'

export type WakeLockStatus = 'active' | 'unsupported' | 'denied' | 'released'

/**
 * Holder skjermen våken mens `enabled` (butikkmodus).
 * Safari/iOS har begrenset støtte — vis `unsupported` i UI ved behov.
 */
export function useScreenWakeLock(enabled: boolean): WakeLockStatus {
  const [status, setStatus] = useState<WakeLockStatus>('released')
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled) {
      void wakeLockRef.current?.release()
      wakeLockRef.current = null
      setStatus('released')
      return
    }

    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      setStatus('unsupported')
      return
    }

    let cancelled = false

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock!.request('screen')
        if (cancelled) {
          await sentinel.release()
          return
        }
        wakeLockRef.current = sentinel
        setStatus('active')
        sentinel.addEventListener('release', () => {
          if (!cancelled) setStatus('released')
        })
      } catch {
        if (!cancelled) setStatus('denied')
      }
    }

    void acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) void acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void wakeLockRef.current?.release()
      wakeLockRef.current = null
      setStatus('released')
    }
  }, [enabled])

  return status
}
