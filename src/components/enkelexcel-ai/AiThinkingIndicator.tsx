'use client'

type Props = {
  assistantName?: string
}

export default function AiThinkingIndicator({ assistantName = 'dottir AI' }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        className="max-w-[85%] rounded-2xl p-4 text-sm"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={`${assistantName} tenker`}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>
          {assistantName}
        </p>
        <div className="mt-2 flex items-center gap-1.5 min-h-[20px]" aria-hidden>
          <span className="ai-thinking-dot" />
          <span className="ai-thinking-dot ai-thinking-dot--2" />
          <span className="ai-thinking-dot ai-thinking-dot--3" />
        </div>
      </div>
    </div>
  )
}
