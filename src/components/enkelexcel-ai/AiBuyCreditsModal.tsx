'use client'

import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { UsageState } from '@/components/enkelexcel-ai/useDottirAiChat'

type Props = {
  open: boolean
  usage: UsageState
  context: 'at_quota' | 'optional'
  checkoutLoading: boolean
  onClose: () => void
  onCheckout: () => void
}

export default function AiBuyCreditsModal({
  open,
  usage,
  context,
  checkoutLoading,
  onClose,
  onCheckout,
}: Props) {
  const backdrop = useModalBackdropDismiss(onClose)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="presentation"
      {...backdrop}
    >
      <div
        className="max-w-md w-full rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-buy-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ai-buy-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Kjøp flere AI-meldinger
        </h2>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {context === 'optional' ? (
            <>
              Du kan kjøpe{' '}
              <strong style={{ color: 'var(--text)' }}>{usage.bonusPackCredits} ekstra meldinger</strong> for{' '}
              <strong style={{ color: 'var(--text)' }}>{usage.bonusPackPriceNok} kr</strong> (engangsbetaling med
              kort via Stripe). Ekstra meldinger brukes når månedens inkluderte meldinger er brukt opp.
            </>
          ) : (
            <>
              Du har brukt alle inkluderte meldinger for denne måneden. Du kan kjøpe{' '}
              <strong style={{ color: 'var(--text)' }}>{usage.bonusPackCredits} ekstra meldinger</strong> for{' '}
              <strong style={{ color: 'var(--text)' }}>{usage.bonusPackPriceNok} kr</strong> (engangsbetaling med
              kort via Stripe).
            </>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            type="button"
            onClick={onCheckout}
            disabled={checkoutLoading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-70 min-h-[44px]"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            {checkoutLoading ? 'Åpner betaling…' : `Gå til betaling (${usage.bonusPackPriceNok} kr)`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-sm font-medium min-h-[44px]"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text)',
              background: 'var(--bg)',
            }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
