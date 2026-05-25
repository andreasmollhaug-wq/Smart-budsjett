'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import DottirAiChatPanel from '@/components/enkelexcel-ai/DottirAiChatPanel'
import { useDottirAi } from '@/components/enkelexcel-ai/DottirAiProvider'

export default function DottirAiChatModal() {
  const { isOpen, close, openFullPage, assistantName } = useDottirAi()
  const backdrop = useModalBackdropDismiss(close)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4 motion-safe:animate-none"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="presentation"
      aria-hidden={false}
      {...backdrop}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl shadow-xl motion-safe:transition-transform sm:max-w-3xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: 'min(92dvh, 720px)',
          height: 'min(92dvh, 720px)',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dottir-ai-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 id="dottir-ai-modal-title" className="text-base font-semibold truncate" style={{ color: 'var(--text)' }}>
            {assistantName}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/enkelexcel-ai"
              onClick={() => {
                close()
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium min-h-[36px] hover:opacity-90"
              style={{ color: 'var(--primary)' }}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden xs:inline sm:inline">Åpne full skjerm</span>
              <span className="xs:hidden sm:hidden">Full skjerm</span>
            </Link>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:opacity-90"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              aria-label="Lukk dottir AI"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
          <DottirAiChatPanel variant="compact" />
        </div>
      </div>
    </div>
  )
}
