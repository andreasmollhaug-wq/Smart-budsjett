'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect, type ReactNode } from 'react'

/** Tailwind `md` — Lenis kun på større skjermer (native scroll på mobil). */
const DESKTOP_MIN = '(min-width: 768px)'

type Props = { children: ReactNode }

export function DottirSmoothScroll({ children }: Props) {
  useEffect(() => {
    let lenis: Lenis | undefined

    const shouldUseLenis = () =>
      window.matchMedia(DESKTOP_MIN).matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sync = () => {
      lenis?.destroy()
      lenis = undefined
      if (!shouldUseLenis()) return
      lenis = new Lenis({
        autoRaf: true,
        anchors: true,
        allowNestedScroll: true,
        lerp: 0.085,
      })
    }

    sync()

    const mqDesktop = window.matchMedia(DESKTOP_MIN)
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    mqDesktop.addEventListener('change', sync)
    mqMotion.addEventListener('change', sync)

    return () => {
      mqDesktop.removeEventListener('change', sync)
      mqMotion.removeEventListener('change', sync)
      lenis?.destroy()
    }
  }, [])

  return <>{children}</>
}
