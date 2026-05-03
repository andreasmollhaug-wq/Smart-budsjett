'use client'

type Props = {
  /** 0–1 */
  value: number
  size?: number
  stroke?: number
  /** sentrert i sirkelen */
  caption?: string
}

export function SmartvaneCircularProgress({ value, size = 72, stroke = 6, caption }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - value * c

  return (
    <div
      className="relative shrink-0 inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
      aria-label={`Fremdrift ${pct} prosent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.35s ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-xs font-bold tabular-nums leading-none"
        style={{ color: 'var(--text)' }}
      >
        <span>{pct}%</span>
        {caption ? (
          <span className="text-[9px] font-medium mt-0.5 opacity-80" style={{ color: 'var(--text-muted)' }}>
            {caption}
          </span>
        ) : null}
      </span>
    </div>
  )
}
