'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { RenovationProject } from './types'
import { computeProjectKpis } from './kpis'
import { renovationProjectListMetaLine } from './renovationProjectListMeta'
import RenovationModalFrame, { renovationModalFooterClass, renovationModalScrollableMainClass } from './RenovationModalFrame'

const TITLE_ID = 'renovation-list-preview-title'

function templateLabel(templateKey?: RenovationProject['templateKey']): string {
  if (templateKey === 'bathroom') return 'Mal: Bad'
  if (templateKey === 'kitchen') return 'Mal: Kjøkken'
  return 'Mal: Egen'
}

type Props = {
  open: boolean
  project: RenovationProject | null
  /** Hovedprosjektet rommet hører under (når det finnes). */
  parent: RenovationProject | null
  onClose: () => void
  detailHref: string
}

export default function RenovationProjectListPreviewModal({
  open,
  project,
  parent,
  onClose,
  detailHref,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()

  const kpis = useMemo(() => (project ? computeProjectKpis(project) : null), [project])

  const remaining = useMemo(() => {
    if (!kpis) return null
    return kpis.totalBudgetedNok - kpis.totalActualNok
  }, [kpis])

  if (!open || !project || !kpis) return null

  const meta = renovationProjectListMetaLine(project)
  const utilPct =
    kpis.totalBudgetedNok > 0
      ? Math.min(100, (kpis.totalActualNok / kpis.totalBudgetedNok) * 100)
      : null

  return (
    <RenovationModalFrame onRequestClose={onClose} ariaLabelledBy={TITLE_ID} maxWidth="md">
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-5 min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id={TITLE_ID} className="text-lg font-semibold leading-snug break-words" style={{ color: 'var(--text)' }}>
              {project.name}
            </h2>
            {parent ? (
              <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                Rom / underprosjekt under{' '}
                <span className="font-medium" style={{ color: 'var(--text)' }}>
                  {parent.name}
                </span>
              </p>
            ) : (
              <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                Oppussingsprosjekt
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
            aria-label="Lukk"
            style={{ WebkitTapHighlightColor: 'transparent', color: 'var(--text-muted)' }}
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        <div className={`space-y-4 ${renovationModalScrollableMainClass}`}>
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
            <div className="rounded-xl border px-3 py-2.5 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Budsjett
              </p>
              <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                {formatNOK(kpis.totalBudgetedNok)}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-2.5 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Faktisk
              </p>
              <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                {formatNOK(kpis.totalActualNok)}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-2.5 min-w-0 min-[380px]:col-span-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Gjenstår (ifølge budsjett)
              </p>
              <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                {remaining != null ? formatNOK(remaining) : '—'}
              </p>
            </div>
          </div>

          {kpis.totalBudgetedNok > 0 && utilPct != null ? (
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Forbruk av budsjett
              </p>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--border)' }}
                aria-hidden
              >
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${utilPct}%`,
                    background: kpis.varianceNok > 0 ? '#E03131' : 'var(--text-muted)',
                  }}
                />
              </div>
              <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {utilPct.toFixed(1)} % brukt
                {kpis.variancePercentOfBudget != null && kpis.totalBudgetedNok > 0
                  ? ` · avvik ${formatNOK(kpis.varianceNok)}`
                  : null}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Sjekkliste
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {kpis.checklistTotal === 0
                ? 'Ingen punkter'
                : `${kpis.checklistDone} av ${kpis.checklistTotal} fullført`}
            </p>
            {kpis.checklistPercent != null && kpis.checklistTotal > 0 ? (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {kpis.checklistPercent.toFixed(0)} % ferdig
              </p>
            ) : null}
          </div>

          <div className="text-xs space-y-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <p>{templateLabel(project.templateKey)}</p>
            {meta ? <p>{meta}</p> : null}
          </div>
        </div>

        <div
          className={`flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 ${renovationModalFooterClass}`}
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-medium touch-manipulation w-full sm:w-auto sm:min-w-[120px]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={detailHref}
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white touch-manipulation w-full sm:w-auto sm:min-w-[140px] text-center"
            style={{ background: 'var(--primary)' }}
          >
            Se detaljer
          </Link>
        </div>
    </RenovationModalFrame>
  )
}
