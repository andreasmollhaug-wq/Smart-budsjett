'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from '@/lib/store'
import { APP_VERSION } from '@/lib/version'

const RELEASE_NOTIFICATION_ID = `release-${APP_VERSION}`

/**
 * Synlig varsel for siste release; skjules når brukeren lukker eller markerer varselet som lest (klokken).
 */
export default function ProductReleaseBanner() {
  const { unread, markRead } = useStore(
    useShallow((s) => {
      const n = s.notifications.find((x) => x.id === RELEASE_NOTIFICATION_ID)
      return {
        unread: n && !n.read ? n : null,
        markRead: s.markNotificationRead,
      }
    }),
  )

  if (!unread) return null

  return (
    <div
      className="w-full shrink-0 border-b px-4 py-2.5"
      style={{
        background: 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      role="status"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3 sm:items-center">
        <p className="min-w-0 flex-1 text-sm leading-snug">
          <span className="font-semibold">{unread.title}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {' '}
            Denne oppdateringen er ute på live. Åpne{' '}
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              klokken
            </span>{' '}
            øverst til høyre for hele meldingen, eller se{' '}
            <Link
              href="/produktflyt"
              className="font-medium underline underline-offset-2"
              style={{ color: 'var(--primary)' }}
            >
              produktflyt
            </Link>
            {' · '}
            <Link
              href="/konto/betalinger"
              className="font-medium underline underline-offset-2"
              style={{ color: 'var(--primary)' }}
            >
              betaling og abonnement
            </Link>
            .
          </span>
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 opacity-80 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: 'var(--primary)' }}
          aria-label="Lukk varsel"
          onClick={() => markRead(RELEASE_NOTIFICATION_ID)}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
