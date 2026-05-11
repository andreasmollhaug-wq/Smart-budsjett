'use client'

import type { MouseEventHandler } from 'react'
import { useRef } from 'react'
import { FORUM_ATTACH_MAX_PICK_UI, partitionForumAttachments, FORUM_ATTACH_ACCEPT } from '@/lib/forum/uploadAttachments'

/** Synlig også for skjemmer som trenger `accept`-attributt */
export const FORUM_ATTACH_ACCEPT_STRING = FORUM_ATTACH_ACCEPT

const MAX = FORUM_ATTACH_MAX_PICK_UI

type Props = {
  disabled?: boolean
  files: File[]
  onChangeFiles: (next: File[]) => void
  id?: string
}

export default function ForumAttachmentPicker({ disabled, files, onChangeFiles, id = 'forum-attachment-input' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addFromInput = (picked: FileList | null) => {
    if (!picked?.length || disabled) return
    const merged = [...files]
    const incoming = [...picked].slice(0, MAX)
    for (const f of incoming) {
      if (merged.length >= MAX) break
      merged.push(f)
    }
    const chk = partitionForumAttachments(merged)
    if (!chk.ok) {
      window.alert(chk.error)
      return
    }
    onChangeFiles(chk.files)
  }

  const removeAt: MouseEventHandler<HTMLButtonElement> = (ev) => {
    const idx = Number((ev.currentTarget as HTMLButtonElement).dataset.idx)
    if (Number.isNaN(idx)) return
    const next = files.filter((_, i) => i !== idx)
    onChangeFiles(next)
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          ref={inputRef}
          type="file"
          multiple
          accept={FORUM_ATTACH_ACCEPT}
          disabled={disabled}
          className="sr-only"
          onChange={(ev) => {
            addFromInput(ev.target.files)
            ev.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={disabled || files.length >= MAX}
          onPointerDown={() => inputRef.current?.click()}
          className="inline-flex min-h-[44px] items-center rounded-xl border px-4 text-xs font-semibold touch-manipulation outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          Legg til bilde / PDF
        </button>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Maks {MAX} filer, 5 MB hver (PNG, JPG, WebP, GIF, PDF)
        </span>
      </div>
      {files.length > 0 ? (
        <ul className="min-w-0 space-y-1 text-xs rounded-lg border p-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex min-w-0 items-center justify-between gap-2">
              <span className="truncate" style={{ color: 'var(--text)' }} title={f.name}>
                {f.name}{' '}
                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  ({Math.round(f.size / 1024)} kB)
                </span>
              </span>
              <button
                type="button"
                data-idx={i}
                disabled={disabled}
                onPointerDown={removeAt}
                className="min-h-[44px] shrink-0 touch-manipulation rounded-lg px-2 text-xs font-medium underline underline-offset-2"
                style={{ color: '#b91c1c' }}
              >
                Fjern
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
