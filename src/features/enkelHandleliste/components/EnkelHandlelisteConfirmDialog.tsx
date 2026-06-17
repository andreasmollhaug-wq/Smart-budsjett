'use client'

import { EhSheet } from './EhSheet'
import { ehSecondaryBtnClass, ehSecondaryBtnStyle } from '../ehUi'

export function EnkelHandlelisteConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Avbryt',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <EhSheet
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      size="sm"
      zIndexClass="z-[110]"
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            className={`flex-1 ${ehSecondaryBtnClass}`}
            style={ehSecondaryBtnStyle}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="inline-flex min-h-[48px] flex-1 touch-manipulation items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition-[transform] active:scale-[0.98]"
            style={{
              background: danger ? 'var(--danger)' : 'var(--cta-gradient)',
              boxShadow: danger
                ? '0 6px 16px color-mix(in srgb, var(--danger) 30%, transparent)'
                : '0 6px 16px color-mix(in srgb, var(--primary) 32%, transparent)',
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="pb-1" />
    </EhSheet>
  )
}
