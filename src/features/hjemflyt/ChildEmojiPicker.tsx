'use client'

import { HJEMFLYT_CHILD_EMOJI_PALETTE } from './emojiPalette'

type Props = {
  value: string | null
  onChange: (emoji: string | null) => void
  /** id for aria-describedby */
  id?: string
}

export function ChildEmojiPicker({ value, onChange, id }: Props) {
  return (
    <div className="space-y-2" id={id}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Valgfri emoji (velg fra listen)
      </p>
      <div className="flex flex-wrap gap-1.5 max-w-md">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="min-h-[44px] min-w-[44px] rounded-xl text-sm font-medium border transition-opacity touch-manipulation flex items-center justify-center"
          style={{
            borderColor: value == null ? 'var(--primary)' : 'var(--border)',
            background: value == null ? 'var(--primary-pale)' : 'var(--surface)',
            color: 'var(--text-muted)',
          }}
          aria-label="Ingen emoji"
        >
          —
        </button>
        {HJEMFLYT_CHILD_EMOJI_PALETTE.map((emo) => (
          <button
            key={emo}
            type="button"
            onClick={() => onChange(emo)}
            className="min-h-[44px] min-w-[44px] rounded-xl text-xl leading-none flex items-center justify-center transition-transform active:scale-95 touch-manipulation"
            style={{
              border:
                value === emo ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: value === emo ? 'var(--primary-pale)' : 'var(--surface)',
            }}
            aria-label={`Velg emoji ${emo}`}
            aria-pressed={value === emo}
          >
            {emo}
          </button>
        ))}
      </div>
    </div>
  )
}
