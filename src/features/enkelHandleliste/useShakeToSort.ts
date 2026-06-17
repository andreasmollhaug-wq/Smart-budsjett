'use client'

import { useEffect, useRef } from 'react'

const SHAKE_THRESHOLD = 14
const SHAKE_COOLDOWN_MS = 1200

/**
 * Kaller `onShake` når enheten ristes (DeviceMotion), med cooldown.
 */
export function useShakeToSort(enabled: boolean, onShake: () => void): void {
  const lastShake = useRef(0)
  const onShakeRef = useRef(onShake)
  onShakeRef.current = onShake

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    if (!('DeviceMotionEvent' in window)) return

    let lastX = 0
    let lastY = 0
    let lastZ = 0

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return
      const dx = Math.abs(acc.x - lastX)
      const dy = Math.abs(acc.y - lastY)
      const dz = Math.abs(acc.z - lastZ)
      lastX = acc.x
      lastY = acc.y
      lastZ = acc.z
      if (dx + dy + dz < SHAKE_THRESHOLD) return
      const now = Date.now()
      if (now - lastShake.current < SHAKE_COOLDOWN_MS) return
      lastShake.current = now
      onShakeRef.current()
    }

    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [enabled])
}
