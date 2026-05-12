'use client'

import { ThumbsUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { forumTogglePostUpvoteAction } from '@/lib/forum/actions'

export default function ForumPostUpvoteButton({
  postId,
  threadId,
  initialCount,
  initialUpvoted,
}: {
  postId: string
  threadId: string
  initialCount: number
  initialUpvoted: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [count, setCount] = useState(initialCount)
  const [upvoted, setUpvoted] = useState(initialUpvoted)

  useEffect(() => {
    setCount(initialCount)
    setUpvoted(initialUpvoted)
  }, [initialCount, initialUpvoted])

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        aria-pressed={upvoted}
        aria-label={upvoted ? 'Fjern tommel opp' : 'Tommel opp'}
        onPointerDown={() => {
          if (pending) return
          startTransition(async () => {
            const r = await forumTogglePostUpvoteAction(postId, threadId)
            if (r.ok) router.refresh()
          })
        }}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold touch-manipulation transition-colors disabled:opacity-60"
        style={{
          borderColor: upvoted ? 'var(--primary)' : 'var(--border)',
          background: upvoted ? 'var(--primary-pale)' : 'var(--bg)',
          color: upvoted ? 'var(--primary)' : 'var(--text)',
        }}
      >
        <ThumbsUp className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.2} fill={upvoted ? 'currentColor' : 'none'} />
        <span className="tabular-nums">{count}</span>
      </button>
    </div>
  )
}
