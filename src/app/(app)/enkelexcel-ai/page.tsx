'use client'

import Header from '@/components/layout/Header'
import DottirAiChatPanel from '@/components/enkelexcel-ai/DottirAiChatPanel'
import { useDottirAi } from '@/components/enkelexcel-ai/DottirAiProvider'
import { Trash2, Minimize2 } from 'lucide-react'
import { DOTTIR_AI_ASSISTANT_NAME } from '@/lib/dottirAiSuggestedQuestions'

export default function EnkelExcelAiPage() {
  const { open, clearConversation, isLoading, messages, chatHydrated, dataScopeLine } = useDottirAi()
  const assistantName = DOTTIR_AI_ASSISTANT_NAME

  return (
    <div
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <Header title={assistantName} subtitle="Din økonomiassistent" />

      <div className="flex flex-1 flex-col min-h-0 min-w-0 px-4 py-4 md:px-8 w-full max-w-6xl overflow-hidden">
        <div className="w-full max-w-2xl mb-3 flex flex-wrap items-start justify-between gap-2">
          <p
            className="text-xs sm:text-sm rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 leading-snug break-words flex-1 min-w-0"
            style={{
              color: 'var(--text)',
              background: 'var(--primary-pale)',
              border: '1px solid var(--border)',
            }}
            role="status"
          >
            {dataScopeLine}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => open()}
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 min-h-[36px] touch-manipulation"
              style={{
                color: 'var(--primary)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
              }}
            >
              <Minimize2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Minimer
            </button>
            {chatHydrated ? (
              <button
                type="button"
                onClick={clearConversation}
                disabled={isLoading || messages.length <= 1}
                className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
                style={{
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                }}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Tøm samtale
              </button>
            ) : null}
          </div>
        </div>

        <div className="w-full max-w-2xl mb-3">
          <p className="text-xs leading-relaxed break-words" style={{ color: 'var(--text-muted)' }}>
            Assistenten får med et strukturert utdrag fra appen din i hver melding (bl.a. tjenesteabonnementer,
            transaksjoner, kort om planlagt oppfølging, budsjettkategorier, sparemål, gjeld og investeringer — avhengig av
            hva som er registrert og av om du ser én profil eller samlet husholdning). Svært store datasett kan avkortes
            teknisk.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-6 flex-1 min-h-0 w-full">
          <DottirAiChatPanel variant="full" showClearInHeader={false} />
        </div>
      </div>
    </div>
  )
}
