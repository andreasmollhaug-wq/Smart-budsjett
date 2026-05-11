'use client'

import type { ForumPostAttachmentRow } from '@/lib/forum/types'
import { forumAttachmentPublicUrl } from '@/lib/forum/uploadAttachments'

export default function ForumPostAttachmentsDisplay({ attachments }: { attachments: ForumPostAttachmentRow[] }) {
  if (!attachments.length) return null

  return (
    <ul className="mt-3 flex min-w-0 flex-col gap-3" aria-label="Vedlegg">
      {attachments.map((a) => {
        const href = a.href ?? forumAttachmentPublicUrl(a.storage_path)
        const isImg = a.mime_type.startsWith('image/')
        return (
          <li key={a.id} className="min-w-0 rounded-xl border p-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            {isImg ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="block min-w-0">
                <img
                  src={href}
                  alt={a.file_name}
                  className="max-h-56 w-auto max-w-full rounded-lg object-contain"
                  loading="lazy"
                />
                <span className="mt-1 block truncate text-xs font-medium" style={{ color: 'var(--primary)' }}>
                  {a.file_name} · åpne i full størrelse
                </span>
              </a>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] min-w-0 flex-wrap items-center gap-2 touch-manipulation rounded-lg px-1 py-1 text-sm font-semibold underline-offset-2 hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                <span className="rounded-md border px-2 py-1 text-xs font-bold" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                  PDF
                </span>
                <span className="min-w-0 truncate">{a.file_name}</span>
                <span className="tabular-nums text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  ({Math.max(1, Math.round(a.bytes / 1024))} kB)
                </span>
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
