'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Copy, ChevronDown, ChevronUp, Lightbulb, RefreshCw, Trash2 } from 'lucide-react'
import AiChatMarkdown from '@/components/enkelexcel-ai/AiChatMarkdown'
import AiQuickReplyButtons from '@/components/enkelexcel-ai/AiQuickReplyButtons'
import AiThinkingIndicator from '@/components/enkelexcel-ai/AiThinkingIndicator'
import DottirAiSuggestionsList from '@/components/enkelexcel-ai/DottirAiSuggestionsList'
import { prepareAiReplyForDisplay } from '@/lib/aiReplyDisplay'
import { parseAiReplyQuickReplies } from '@/lib/aiReplyQuickReplies'
import { hasRouteSpecificSuggestions } from '@/lib/dottirAiRouteSuggestions'
import { useDottirAi } from '@/components/enkelexcel-ai/DottirAiProvider'

type Variant = 'compact' | 'full'

type Props = {
  variant: Variant
  showClearInHeader?: boolean
}

function AssistantMessageActions({
  content,
  messageId,
  disabled,
  onRegenerate,
}: {
  content: string
  messageId: string
  disabled: boolean
  onRegenerate: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyText() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={() => void copyText()}
        disabled={!content.trim()}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium min-h-[32px] disabled:opacity-40"
        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg)' }}
        title="Kopier svar"
      >
        <Copy className="h-3 w-3 shrink-0" aria-hidden />
        {copied ? 'Kopiert' : 'Kopier'}
      </button>
      <button
        type="button"
        onClick={() => onRegenerate(messageId)}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium min-h-[32px] disabled:opacity-40"
        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg)' }}
        title="Regenerer svar (teller som ny melding mot kvoten)"
      >
        <RefreshCw className="h-3 w-3 shrink-0" aria-hidden />
        Regenerer
      </button>
    </div>
  )
}

export default function DottirAiChatPanel({ variant, showClearInHeader = variant === 'compact' }: Props) {
  const pathname = usePathname()
  const chat = useDottirAi()
  const {
    assistantName,
    dataScopeLine,
    suggestedQuestions,
    contextualSuggestions,
    compactSuggestions,
    input,
    setInput,
    isLoading,
    chatHydrated,
    messages,
    usage,
    usageLoadError,
    quotaMessage,
    endRef,
    textareaRef,
    applySuggestedQuestion,
    atQuota,
    showHalfInfo,
    messagesLeft,
    hasUsageBanner,
    clearConversation,
    handleSend,
    regenerateMessage,
    setBuyModalContext,
    setBuyModalOpen,
  } = chat

  const chips = variant === 'compact' ? compactSuggestions.slice(0, 4) : []
  const sidebarQuestions = variant === 'full' ? contextualSuggestions : suggestedQuestions
  const routeTailored = hasRouteSpecificSuggestions(pathname)
  const suggestionsDisabled = atQuota || !chatHydrated || isLoading
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false)

  const pickSuggestion = useCallback(
    (q: string) => {
      applySuggestedQuestion(q)
      setMobileSuggestionsOpen(false)
    },
    [applySuggestedQuestion],
  )

  const compactSuggestionsPanel =
    variant === 'compact' && chips.length > 0 ? (
      <DottirAiSuggestionsList
        questions={chips}
        routeTailored={routeTailored}
        disabled={suggestionsDisabled}
        onSelect={pickSuggestion}
        dense
      />
    ) : null

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  return (
    <>
      <div
        className={
          variant === 'full'
            ? 'flex flex-1 flex-col min-h-0 min-w-0 max-w-2xl lg:h-full lg:min-h-[min(70dvh,calc(100dvh-11rem))]'
            : 'flex flex-1 flex-col min-h-0 min-w-0 md:flex-row md:min-h-0'
        }
      >
        <div className={variant === 'compact' ? 'flex flex-1 flex-col min-h-0 min-w-0' : 'contents'}>
        {variant === 'compact' ? (
          <p
            className="text-xs rounded-xl px-2.5 py-2 mb-3 leading-snug break-words shrink-0"
            style={{
              color: 'var(--text)',
              background: 'var(--primary-pale)',
              border: '1px solid var(--border)',
            }}
            role="status"
          >
            {dataScopeLine}
          </p>
        ) : null}

        {usageLoadError ? (
          <div className="text-xs mb-2 space-y-1.5 shrink-0">
            <p style={{ color: 'var(--danger)' }}>{usageLoadError}</p>
            {/\b500\b/.test(usageLoadError) ? (
              <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Bruksdata kunne ikke lastes fra serveren (HTTP 500). Oppdater siden og prøv igjen.
              </p>
            ) : null}
          </div>
        ) : null}

        <div
          className={
            variant === 'full'
              ? 'flex flex-1 flex-col min-h-0 h-full rounded-2xl p-4 md:p-6'
              : 'flex flex-1 flex-col min-h-0 min-w-0 h-full'
          }
          style={
            variant === 'full'
              ? {
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  minHeight: 0,
                  maxHeight: 'min(70dvh, calc(100dvh - 11rem))',
                }
              : { minHeight: 0 }
          }
        >
          {showClearInHeader && chatHydrated ? (
            <div className="flex justify-end shrink-0 mb-3">
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
            </div>
          ) : null}

          <div
            className={`flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 ${variant === 'compact' ? 'overscroll-y-contain' : ''}`}
          >
            {!chatHydrated ? (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                Laster samtale…
              </p>
            ) : null}
            {chatHydrated
              ? messages.map((m, i) => {
                  const isUser = m.role === 'user'
                  const isLastAssistant =
                    !isUser && m.id === lastAssistantMessageId && !isLoading
                  const { body, quickReplies } = !isUser
                    ? parseAiReplyQuickReplies(m.content)
                    : { body: m.content, quickReplies: [] as string[] }
                  const showActions =
                    !isUser && body.trim() && !(isLastAssistant && isLoading)
                  return (
                    <div
                      key={m.id}
                      className="space-y-2 group"
                      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${isUser ? 'whitespace-pre-wrap' : ''}`}
                        style={{
                          background: isUser ? 'var(--primary-pale)' : 'var(--bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                      >
                        <p
                          className="font-semibold"
                          style={{ color: isUser ? 'var(--primary)' : 'var(--text-muted)' }}
                        >
                          {isUser ? 'Du' : assistantName}
                        </p>
                        {isUser ? (
                          <p className="mt-1">{m.content}</p>
                        ) : body ? (
                          <AiChatMarkdown text={prepareAiReplyForDisplay(body)} />
                        ) : (
                          <AiThinkingIndicator assistantName={assistantName} />
                        )}
                        {isLastAssistant && quickReplies.length > 0 ? (
                          <AiQuickReplyButtons
                            options={quickReplies}
                            disabled={suggestionsDisabled}
                            onSelect={pickSuggestion}
                          />
                        ) : null}
                        {showActions ? (
                          <AssistantMessageActions
                            content={body}
                            messageId={m.id}
                            disabled={isLoading || atQuota}
                            onRegenerate={regenerateMessage}
                          />
                        ) : null}
                      </div>
                    </div>
                  )
                })
              : null}
            {isLoading && messages[messages.length - 1]?.role === 'user' ? (
              <AiThinkingIndicator assistantName={assistantName} />
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="shrink-0 pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
            {variant === 'compact' && chips.length > 0 ? (
              <button
                type="button"
                onClick={() => setMobileSuggestionsOpen((open) => !open)}
                className="md:hidden mb-3 flex w-full min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
                style={{
                  color: 'var(--primary)',
                  background: 'var(--primary-pale)',
                  border: '1px solid var(--border)',
                }}
                aria-expanded={mobileSuggestionsOpen}
              >
                <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
                {mobileSuggestionsOpen ? 'Skjul forslag' : `Vis forslag (${chips.length})`}
                {mobileSuggestionsOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                )}
              </button>
            ) : null}

            {variant === 'compact' && mobileSuggestionsOpen && chips.length > 0 ? (
              <div
                className="md:hidden mb-3 max-h-[min(38dvh,260px)] overflow-hidden rounded-xl border p-3 flex flex-col min-h-0"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                {compactSuggestionsPanel}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  !chatHydrated
                    ? 'Laster…'
                    : atQuota
                      ? 'Ingen meldinger igjen — kjøp flere eller vent til neste måned'
                      : `Skriv til ${assistantName}...`
                }
                disabled={atQuota || isLoading || !chatHydrated}
                className="min-w-0 flex-1 px-3 py-2 rounded-xl text-sm disabled:opacity-60 w-full"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  resize: 'none',
                  minHeight: '48px',
                  maxHeight: '140px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading || atQuota || !chatHydrated}
                className="shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-70 w-full min-[400px]:w-auto min-h-[44px] touch-manipulation"
                style={{ background: 'var(--primary)', color: 'white', whiteSpace: 'nowrap' }}
              >
                Send
              </button>
            </div>

            {usage && !atQuota && messagesLeft !== null ? (
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                {messagesLeft} melding{messagesLeft === 1 ? '' : 'er'} igjen (inkludert + ekstra).
              </p>
            ) : null}

            {variant === 'full' ? (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Klikk et forslag til høyre for å sende det med én gang.
              </p>
            ) : null}

            {variant === 'compact' ? (
              <p className="text-xs mt-2 hidden md:block" style={{ color: 'var(--text-muted)' }}>
                Forslag til spørsmål vises til høyre. Ctrl+K åpner chatten raskt.
              </p>
            ) : null}
          </div>
        </div>

        {hasUsageBanner ? (
          <div className="w-full shrink-0 space-y-2 mt-3">
            {showHalfInfo && usage ? (
              <div className="space-y-2">
                <p
                  className="text-xs rounded-xl px-3 py-2"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Du har brukt {usage.used} av {usage.limit} inkluderte meldinger denne måneden.
                  {usage.bonusCredits > 0 ? ` Du har også ${usage.bonusCredits} ekstra meldinger.` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBuyModalContext('optional')
                    setBuyModalOpen(true)
                  }}
                  className="text-xs font-medium rounded-xl px-3 py-2 transition-opacity hover:opacity-95 min-h-[44px]"
                  style={{
                    color: 'var(--primary)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    width: 'fit-content',
                  }}
                >
                  Kjøp mer tilgang
                </button>
              </div>
            ) : null}

            {usage && usage.bonusCredits > 0 && usage.used >= usage.limit ? (
              <p
                className="text-xs rounded-xl px-3 py-2"
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                Månedens inkluderte meldinger er brukt. Du bruker nå {usage.bonusCredits} ekstra
                melding{usage.bonusCredits === 1 ? '' : 'er'}.
              </p>
            ) : null}

            {quotaMessage ? (
              <div className="mb-3 space-y-2">
                <p
                  className="text-sm rounded-xl px-3 py-2"
                  style={{
                    color: 'var(--text)',
                    background: 'var(--primary-pale)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {quotaMessage}
                </p>
                {atQuota && usage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBuyModalContext('at_quota')
                      setBuyModalOpen(true)
                    }}
                    className="text-sm font-medium underline min-h-[44px]"
                    style={{ color: 'var(--primary)' }}
                  >
                    Kjøp {usage.bonusPackCredits} meldinger til for {usage.bonusPackPriceNok} kr
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        </div>

        {variant === 'compact' && chips.length > 0 ? (
          <aside
            className="hidden md:flex md:flex-col md:w-52 lg:w-56 shrink-0 min-h-0 min-w-0 border-l pl-3 pt-1 overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Forslag til spørsmål"
          >
            {compactSuggestionsPanel}
          </aside>
        ) : null}
      </div>

      {variant === 'full' ? (
        <aside
          className="shrink-0 w-full lg:w-64 xl:w-72 mt-4 lg:mt-0 lg:self-start lg:sticky lg:top-4 lg:max-h-[min(70dvh,calc(100dvh-8rem))] flex flex-col rounded-2xl p-3 sm:p-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          aria-label="Forslag til spørsmål"
        >
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Lightbulb className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Forslag til spørsmål
            </p>
          </div>
          <p className="text-xs mb-2 sm:mb-3 leading-relaxed break-words" style={{ color: 'var(--text-muted)' }}>
            Klikk for å sende med én gang — tilpasset der du er i appen og hva du har registrert.
          </p>
          <ul className="space-y-1.5 sm:space-y-2 overflow-y-auto min-h-0 pr-0.5">
            {sidebarQuestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => applySuggestedQuestion(q)}
                  disabled={atQuota || !chatHydrated || isLoading}
                  className="w-full text-left text-xs sm:text-sm rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 leading-snug transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 break-words min-h-[44px]"
                  style={{
                    color: 'var(--text)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </>
  )
}
