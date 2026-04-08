'use client'

import { useLayoutEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** Vises når bruker sendes hit fra /tilbakestill-passord uten PASSWORD_RECOVERY (vanlig innlogget økt). */
export default function SecurityRedirectNotice() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  /** Etter at `info` er fjernet fra URL, hold banneret synlig likevel. */
  const [seenInfoParam, setSeenInfoParam] = useState(false)

  const show =
    seenInfoParam || searchParams.get('info') === 'passord-konto'

  useLayoutEffect(() => {
    if (searchParams.get('info') !== 'passord-konto') return
    setSeenInfoParam(true)
    const next = new URLSearchParams(searchParams.toString())
    next.delete('info')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [pathname, router, searchParams])

  if (!show) return null

  return (
    <div
      className="mb-6 rounded-xl px-4 py-3 text-sm"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      role="status"
    >
      Du er allerede innlogget. Endre passord med skjemaet under «Passord», eller logg ut og bruk lenken i
      e-posten for tilbakestilling.
    </div>
  )
}
