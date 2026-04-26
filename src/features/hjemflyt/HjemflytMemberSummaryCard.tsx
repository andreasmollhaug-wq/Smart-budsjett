'use client'

import type { HjemflytSummaryRow } from './hjemflytSummaryRows'

export type { HjemflytSummaryRow }

type Props = {
  title: string
  subtitle: string
  emoji?: string | null
  rows: HjemflytSummaryRow[]
  footerPoints: number
  footerHint?: string
}

export function HjemflytMemberSummaryCard({
  title,
  subtitle,
  emoji,
  rows,
  footerPoints,
  footerHint = 'Totalt opptjent',
}: Props) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-2 min-w-0 mb-1">
        {emoji ? (
          <span className="text-2xl leading-none shrink-0" aria-hidden>
            {emoji}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold truncate" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          <p className="text-xs leading-snug break-words mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {rows.map((row, i) =>
          row.type === 'simple' ? (
            <div key={`${row.label}-${i}`} className="min-w-0 flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {row.label}
              </p>
              <p className="shrink-0 text-right">
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {row.valueBold}
                </span>
                {row.valueMuted ? (
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {row.valueMuted}
                  </span>
                ) : null}
              </p>
            </div>
          ) : (
            <div key={`${row.label}-${i}`} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {row.label}
                </p>
                <p className="text-sm tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {row.targetRight}
                </p>
              </div>
              <div
                className="mt-2 h-2.5 rounded-full overflow-hidden min-w-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={row.displayPct}
                aria-label={row.progressAriaLabel}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${row.displayPct}%`, background: row.fill }}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3 min-w-0 text-sm">
                <p className="min-w-0">
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    {row.bottomLeftBold}
                  </span>
                  <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                    {row.bottomLeftMuted}
                  </span>
                </p>
                <p className="shrink-0 text-right min-w-0">
                  {row.bottomRightMutedOnly != null ? (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {row.bottomRightMutedOnly}
                    </span>
                  ) : (
                    <>
                      {row.bottomRightBold != null ? (
                        <span
                          className="font-semibold tabular-nums"
                          style={{ color: row.bottomRightColor ?? 'var(--text-muted)' }}
                        >
                          {row.bottomRightBold}
                        </span>
                      ) : null}
                      {row.bottomRightSub != null ? (
                        <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {row.bottomRightSub}
                        </span>
                      ) : null}
                    </>
                  )}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      <div
        className="mt-5 pt-4 border-t min-w-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {footerHint}
        </p>
        <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--success)' }}>
          {footerPoints.toLocaleString('nb-NO')} poeng
        </p>
      </div>
    </div>
  )
}
