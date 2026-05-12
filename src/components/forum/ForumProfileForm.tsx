'use client'

import type { FormEvent } from 'react'
import { useState, useTransition } from 'react'
import { forumSetProfileDisplayAction } from '@/lib/forum/actions'

const MAX_DISPLAY = 20

export default function ForumProfileForm({ initialDisplayName }: { initialDisplayName: string }) {
  const [pending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const r = await forumSetProfileDisplayAction({ displayName })
      if (!r.ok) setMsg(r.error)
      else setMsg('Lagret.')
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 touch-manipulation min-w-0">
      <div>
        <label htmlFor="forum-display-name" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
          Visningsnavn (valgfritt)
        </label>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          Vises ved innlegg. La stå tom for å bare bruke kort kode. Maks {MAX_DISPLAY} tegn — ingen sensitiv eller offentlig
          identitet.
        </p>
        <input
          id="forum-display-name"
          disabled={pending}
          type="text"
          maxLength={MAX_DISPLAY}
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
          className="w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
          placeholder=""
          aria-describedby="forum-display-name-hint"
        />
        <p id="forum-display-name-hint" className="mt-1 text-[11px] tabular-nums text-right" style={{ color: 'var(--text-muted)' }}>
          {displayName.length}/{MAX_DISPLAY}
        </p>
      </div>
      {msg ? (
        <p className="text-sm" role="status" style={{ color: 'var(--text)' }}>
          {msg}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center px-5 rounded-xl text-sm font-semibold text-white touch-manipulation"
        style={{ background: 'var(--cta-gradient)' }}
      >
        {pending ? 'Lagrer…' : 'Lagre'}
      </button>
    </form>
  )
}
