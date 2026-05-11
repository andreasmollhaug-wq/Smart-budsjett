'use client'

import type { FormEvent } from 'react'
import { useState, useTransition } from 'react'
import { forumSetProfileDisplayAction } from '@/lib/forum/actions'

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
          Vises ved innlegg. La stå tom for å bare bruke kort kode. Maks 80 tegn — ingen sensitiv eller offentlig
          identitet.
        </p>
        <input
          id="forum-display-name"
          disabled={pending}
          type="text"
          maxLength={80}
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
          className="w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          placeholder=""
        />
      </div>
      {msg ? (
        <p className="text-sm" role="status" style={{ color: 'var(--text)' }}>
          {msg}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center justify-center px-5 rounded-xl text-sm font-semibold text-white touch-manipulation"
        style={{ background: 'var(--cta-gradient)' }}
      >
        {pending ? 'Lagrer…' : 'Lagre'}
      </button>
    </form>
  )
}
