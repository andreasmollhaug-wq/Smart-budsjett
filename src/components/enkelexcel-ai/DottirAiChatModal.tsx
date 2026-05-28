'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import DottirAiChatPanel from '@/components/enkelexcel-ai/DottirAiChatPanel'
import { useDottirAi } from '@/components/enkelexcel-ai/DottirAiProvider'

export default function DottirAiChatModal() {
  const {
    isOpen,
    isMobileExpanded,
    close,
    collapseMobile,
    toggleMobileExpanded,
    assistantName,
  } = useDottirAi()
  const backdrop = useModalBackdropDismiss(close)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isMobileExpanded) collapseMobile()
      else close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isMobileExpanded, close, collapseMobile])

  if (!isOpen) return null

  const backdropHandlers = isMobileExpanded ? {} : backdrop

  return (
    <div
      className={`fixed inset-0 z-[55] flex justify-center p-0 sm:p-4 motion-safe:animate-none max-md:items-end sm:items-center ${
        isMobileExpanded ? 'max-md:items-stretch max-md:p-0' : ''
      }`}
      style={{
        background: isMobileExpanded ? 'var(--surface)' : 'rgba(0,0,0,0.45)',
      }}
      role="presentation"
      aria-hidden={false}
      {...backdropHandlers}
    >
      <div
        className={`flex w-full flex-col overflow-hidden shadow-xl motion-safe:transition-transform sm:max-w-3xl sm:rounded-2xl ${
          isMobileExpanded ? 'max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:rounded-none' : 'max-md:rounded-t-2xl'
        }`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          ...(isMobileExpanded
            ? {
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
              }
            : {
                maxHeight: 'min(92dvh, 720px)',
                height: 'min(92dvh, 720px)',
                paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
              }),
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
            <button
              type="button"
              onClick={toggleMobileExpanded}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium min-h-[36px] hover:opacity-90 md:hidden touch-manipulation"
              style={{ color: 'var(--primary)' }}
              aria-label={isMobileExpanded ? 'Minimer dottir AI' : 'Full skjerm for dottir AI'}
            >
              {isMobileExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Minimer
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Full skjerm
                </>
              )}
            </button>
            <Link
              href="/enkelexcel-ai"
              onClick={() => {
                close()
              }}
              className="hidden md:inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium min-h-[36px] hover:opacity-90"
              style={{ color: 'var(--primary)' }}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Åpne full skjerm
            </Link>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:opacity-90 touch-manipulation"
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
