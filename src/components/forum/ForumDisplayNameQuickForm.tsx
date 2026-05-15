'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useId, useState, useTransition } from 'react'
import { forumSetProfileDisplayAction } from '@/lib/forum/actions'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'
import { hasEligibleForumDisplayName } from '@/lib/forum/forumDisplayName'

const MAX_DISPLAY = 20
const profilHref = `${FORUM_BASE_PATH}/profil`

/**
 * Kompakt registrering av forumvisningsnavn (samme validering som profilsiden).
 * Brukes i «forumnavn kreves»-dialog og under tråd-svar.
 */
export default function ForumDisplayNameQuickForm({
  initialDisplayName = '',
  onSaved,
  onCancel,
  showFullProfileLink = true,
  submitLabel = 'Lagre og fortsett',
  density = 'comfortable',
  className = '',
}: {
  initialDisplayName?: string
  onSaved: () => void
  onCancel?: () => void
  showFullProfileLink?: boolean
  submitLabel?: string
  density?: 'comfortable' | 'compact'
  className?: string
}) {
  const router = useRouter()
  const inputId = useId()
  const hintId = useId()
  const [pending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [msg, setMsg] = useState<string | null>(null)

  const gap = density === 'compact' ? 'space-y-2' : 'space-y-3'

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const t = displayName.trim()
    if (!hasEligibleForumDisplayName(t)) {
      setMsg('Skriv minst 2 tegn — dette blir navnet ditt i forumet.')
      return
    }
    startTransition(async () => {
      const r = await forumSetProfileDisplayAction({ displayName })
      if (!r.ok) {
        setMsg(r.error)
        return
      }
      setMsg(null)
      router.refresh()
      onSaved()
    })
  }

  return (
    <form onSubmit={onSubmit} className={['min-w-0 touch-manipulation', gap, className].filter(Boolean).join(' ')}>
      <div>
        <label htmlFor={inputId} className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Ditt forumnavn
        </label>
        <p id={hintId} className="mb-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Minst to tegn. Maks {MAX_DISPLAY} tegn — vises offentlig, unngå sensitiv eller direkte identifiserende
          informasjon.
        </p>
        <input
          id={inputId}
          disabled={pending}
          type="text"
          maxLength={MAX_DISPLAY}
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
          className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
          placeholder="F.eks. Kari82"
          autoComplete="nickname"
          aria-invalid={msg ? true : undefined}
          aria-describedby={hintId}
        />
        <p className="mt-1 text-right text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {displayName.length}/{MAX_DISPLAY}
        </p>
      </div>
      {msg ? (
        <p className="text-sm leading-snug" role="alert" style={{ color: 'var(--text)' }}>
          {msg}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-white touch-manipulation disabled:opacity-60"
          style={{ background: 'var(--cta-gradient)' }}
        >
          {pending ? 'Lagrer…' : submitLabel}
        </button>
      </div>
      {showFullProfileLink ? (
        <p className="text-center text-xs sm:text-left" style={{ color: 'var(--text-muted)' }}>
          <Link
            href={profilHref}
            className="font-medium underline underline-offset-2 touch-manipulation"
            style={{ color: 'var(--primary)' }}
          >
            Mer på forumprofil-siden
          </Link>{' '}
          (bidragsnivå m.m.)
        </p>
      ) : null}
    </form>
  )
}
