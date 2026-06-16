'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Circle, EyeOff } from 'lucide-react'
import {
  buildCreditorRegistryChecklist,
  countSequentialChecklistProgress,
  getNextCreditorRegistryChecklistStep,
  isChecklistStepEffectivelyDone,
  isChecklistStepUnlocked,
  isCreditorRegistryChecklistComplete,
  type CreditorRegistryChecklistCtaKind,
  type CreditorRegistryChecklistItem,
} from '@/lib/creditorRegistry/checklist'
import { normalizeCreditorRegistryPrefs } from '@/lib/creditorRegistry/prefs'
import type { CreditorRegistryChecklistStepId, CreditorRegistryState } from '@/lib/creditorRegistry/types'
import CreditorRegistryChecklistDetailModal from './CreditorRegistryChecklistDetailModal'
import CreditorRegistryInfoModal from './CreditorRegistryInfoModal'
import CreditorRegistryInfoTrigger from './CreditorRegistryInfoTrigger'

type Props = {
  state: CreditorRegistryState
  readOnly: boolean
  formatNOK: (n: number) => string
  onCta: (kind: CreditorRegistryChecklistCtaKind, item: CreditorRegistryChecklistItem) => void
  onManualComplete: (stepId: CreditorRegistryChecklistStepId) => void
  onDismiss: () => void
  onRestore: () => void
  onExpand: () => void
  onCollapse: () => void
}

export default function CreditorRegistrySetupChecklist({
  state,
  readOnly,
  formatNOK,
  onCta,
  onManualComplete,
  onDismiss,
  onRestore,
  onExpand,
  onCollapse,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [modalItem, setModalItem] = useState<CreditorRegistryChecklistItem | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const items = useMemo(() => buildCreditorRegistryChecklist(state), [state])
  const nextStep = useMemo(() => getNextCreditorRegistryChecklistStep(items), [items])
  const allDone = isCreditorRegistryChecklistComplete(items)
  const prefs = normalizeCreditorRegistryPrefs(state.prefs)
  const doneCount = countSequentialChecklistProgress(items)
  const progressPct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  const handleCta = (item: CreditorRegistryChecklistItem) => {
    if (readOnly) return
    onCta(item.ctaKind, item)
  }

  const infoModal = (
    <CreditorRegistryInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} formatNOK={formatNOK} />
  )

  const detailModal = (
    <CreditorRegistryChecklistDetailModal
      item={modalItem}
      readOnly={readOnly}
      unlocked={modalItem ? isChecklistStepUnlocked(items, modalItem.id) : false}
      onClose={() => setModalItem(null)}
      onCta={() => {
        if (modalItem) handleCta(modalItem)
      }}
      onManualComplete={
        modalItem?.allowManualComplete ? () => onManualComplete(modalItem.id) : undefined
      }
    />
  )

  if (prefs.checklistDismissed) {
    return (
      <>
        <div
          className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          aria-label="Kom i gang skjult"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              Kom i gang
              <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
                {' '}
                · {doneCount} av {items.length} fullført
                {!allDone && nextStep ? ` · Neste: ${nextStep.title}` : allDone ? ' · Ferdig' : ''}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <CreditorRegistryInfoTrigger compact onClick={() => setInfoOpen(true)} />
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium touch-manipulation shrink-0"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Vis kom i gang
            </button>
          </div>
        </div>
        {infoModal}
        {detailModal}
      </>
    )
  }

  if (prefs.checklistCollapsed) {
    return (
      <>
        <div
          className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          aria-label="Kom i gang minimert"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                Kom i gang · {doneCount}/{items.length}
              </p>
              <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                {progressPct}%
              </span>
            </div>
            {!allDone && nextStep && (
              <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                Neste: {nextStep.title}
              </p>
            )}
            {allDone && (
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Oppsettet er fullført.
              </p>
            )}
            <div
              className="h-1.5 rounded-full overflow-hidden min-w-0"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={items.length}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%`, background: 'var(--primary)' }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <CreditorRegistryInfoTrigger compact onClick={() => setInfoOpen(true)} />
            {!readOnly && !allDone && nextStep && (
              <button
                type="button"
                onClick={() => handleCta(nextStep)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium text-white touch-manipulation"
                style={{ background: 'var(--primary)' }}
              >
                {nextStep.ctaLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 text-sm font-medium border touch-manipulation"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              aria-label="Utvid kom i gang"
            >
              <ChevronDown size={20} aria-hidden />
            </button>
          </div>
        </div>
        {infoModal}
        {detailModal}
      </>
    )
  }

  return (
    <>
      <section
        className="rounded-2xl p-4 sm:p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        aria-label="Kom i gang med oversikt gjeld"
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                Kom i gang
              </h2>
              <CreditorRegistryInfoTrigger compact onClick={() => setInfoOpen(true)} />
            </div>
            <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Følg stegene for å bygge oversikten. Du kan minimere eller skjule når du vil jobbe videre.
            </p>
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onCollapse}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-2 touch-manipulation"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
              aria-label="Minimer kom i gang"
              title="Minimer"
            >
              <ChevronUp size={20} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium touch-manipulation"
              style={{
                color: 'var(--text)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
              aria-label="Skjul kom i gang"
              title="Skjul for nå"
            >
              <EyeOff size={18} aria-hidden />
              <span>Skjul</span>
            </button>
          </div>
        </div>

        {allDone ? (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Du har satt opp oversikt gjeld. Minimer eller skjul sjekklisten når du er ferdig med den.
            </p>
          </div>
        ) : nextStep ? (
          <div
            className="rounded-xl px-4 py-4 space-y-3"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Neste steg · {doneCount} av {items.length} fullført
            </p>
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>
              {nextStep.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {nextStep.recommendation}
            </p>
            {readOnly ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Bytt til én profil for å fullføre oppsettet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCta(nextStep)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-medium text-white touch-manipulation"
                  style={{ background: 'var(--primary)' }}
                >
                  {nextStep.ctaLabel}
                </button>
                {nextStep.allowManualComplete && (
                  <button
                    type="button"
                    onClick={() => onManualComplete(nextStep.id)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium border touch-manipulation"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    Marker som ferdig
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {doneCount} av {items.length} fullført
            </span>
            <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
              {progressPct}%
            </span>
          </div>
          <div
            className="mt-2 h-2 rounded-full overflow-hidden min-w-0"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={items.length}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%`, background: 'var(--primary)' }}
            />
          </div>

          <button
            type="button"
            className="mt-3 flex w-full items-center justify-between gap-3 min-h-[44px] rounded-xl px-3 py-2.5 text-left touch-manipulation"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((o) => !o)}
          >
            <span className="text-sm font-medium">{detailsOpen ? 'Skjul alle steg' : 'Vis alle steg'}</span>
            <ChevronDown
              size={22}
              className="shrink-0 transition-transform duration-200"
              style={{ color: 'var(--primary)', transform: detailsOpen ? 'rotate(180deg)' : undefined }}
              aria-hidden
            />
          </button>
        </div>

        {detailsOpen && (
          <ul className="space-y-2">
            {items.map((it) => {
              const unlocked = isChecklistStepUnlocked(items, it.id)
              const effectivelyDone = isChecklistStepEffectivelyDone(items, it.id)
              const isNext = nextStep?.id === it.id
              return (
                <li
                  key={it.id}
                  className="min-w-0 rounded-xl overflow-hidden"
                  style={{
                    background: isNext ? 'var(--primary-pale)' : 'var(--bg)',
                    border: '1px solid var(--border)',
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 min-w-0 py-3 px-3 text-left touch-manipulation min-h-[44px]"
                    onClick={() => setModalItem(it)}
                    aria-label={`Detaljer for ${it.title}`}
                  >
                    <div className="shrink-0" aria-hidden>
                      {effectivelyDone ? (
                        <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
                      ) : (
                        <Circle size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${effectivelyDone ? 'line-through opacity-70' : ''}`}
                        style={{ color: 'var(--text)' }}
                      >
                        {it.stepNumber}. {it.title}
                      </p>
                      {!unlocked && !effectivelyDone && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Fullfør forrige steg først
                        </p>
                      )}
                    </div>
                    <ChevronRight size={18} className="shrink-0 opacity-50" style={{ color: 'var(--text-muted)' }} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {infoModal}
      {detailModal}
    </>
  )
}
