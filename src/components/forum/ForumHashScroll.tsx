'use client'

import { useEffect } from 'react'

/** Ved dyplenke #post-{uuid} rulles mållekken inn ved lasting. */
export default function ForumHashScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hash?.slice(1)
    if (!h) return
    const el = document.getElementById(h)
    if (el) {
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [])
  return null
}
