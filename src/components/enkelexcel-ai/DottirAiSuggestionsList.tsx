'use client'

import { Lightbulb } from 'lucide-react'

type Props = {
  questions: string[]
  routeTailored: boolean
  disabled: boolean
  onSelect: (question: string) => void
  /** Mindre tekst i smal sidebar */
  dense?: boolean
}

export default function DottirAiSuggestionsList({
  questions,
  routeTailored,
  disabled,
  onSelect,
  dense = false,
}: Props) {
  if (questions.length === 0) return null

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <Lightbulb className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
        <p className={`font-semibold ${dense ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--text)' }}>
          Forslag
        </p>
      </div>
      {routeTailored ? (
        <p className="text-[11px] mb-2 leading-snug shrink-0" style={{ color: 'var(--text-muted)' }}>
          Tilpasset siden du står på
        </p>
      ) : null}
      <ul className={`flex flex-col min-h-0 overflow-y-auto overscroll-y-contain ${dense ? 'gap-1' : 'gap-1.5'}`}>
        {questions.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onSelect(q)}
              disabled={disabled}
              className={`w-full text-left rounded-xl leading-snug transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation break-words min-h-[44px] ${
                dense ? 'text-xs px-2.5 py-2' : 'text-xs sm:text-sm px-3 py-2.5'
              }`}
              style={{
                color: 'var(--text)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
