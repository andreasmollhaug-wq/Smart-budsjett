'use client'

type Props = {
  options: string[]
  disabled?: boolean
  onSelect: (text: string) => void
}

export default function AiQuickReplyButtons({ options, disabled = false, onSelect }: Props) {
  if (options.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Hurtigsvar">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className="inline-flex min-h-[36px] touch-manipulation items-center rounded-full px-3 py-1.5 text-xs font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            color: 'var(--primary)',
            background: 'var(--primary-pale)',
            border: '1px solid var(--border)',
          }}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
