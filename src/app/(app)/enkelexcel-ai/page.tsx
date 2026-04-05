'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { generateId } from '@/lib/utils'
import { shouldShowHalfUsageInfo } from '@/lib/aiUsage'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type UsageState = {
  used: number
  limit: number
  bonusCredits: number
  bonusPackCredits: number
  bonusPackPriceNok: number
}

export default function EnkelExcelAiPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const assistantName = 'EnkelExcel AI'

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: generateId(),
        role: 'assistant',
        content:
          `Hei! Jeg er ${assistantName}. Jeg kan hjelpe deg med budsjett, sparing og gjeld.`,
      },
    ],
    [],
  )

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [usage, setUsage] = useState<UsageState | null>(null)
  const [usageLoadError, setUsageLoadError] = useState<string | null>(null)
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/enkelexcel-ai/usage')
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? `Kunne ikke hente bruk (${res.status})`)
      }
      const data = (await res.json()) as UsageState
      setUsage({
        used: data.used,
        limit: data.limit,
        bonusCredits: data.bonusCredits ?? 0,
        bonusPackCredits: data.bonusPackCredits ?? 100,
        bonusPackPriceNok: data.bonusPackPriceNok ?? 29,
      })
      setUsageLoadError(null)
      const noMessagesLeft = data.used >= data.limit && (data.bonusCredits ?? 0) <= 0
      if (noMessagesLeft) {
        setQuotaMessage(
          `Du har brukt alle ${data.limit} inkluderte meldingene denne måneden og har ingen ekstra meldinger igjen.`,
        )
      } else {
        setQuotaMessage(null)
        setBuyModalOpen(false)
      }
    } catch (e) {
      setUsageLoadError(e instanceof Error ? e.message : 'Kunne ikke hente bruk')
    }
  }, [])

  useEffect(() => {
    void loadUsage()
  }, [loadUsage])

  useEffect(() => {
    const onFocus = () => void loadUsage()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadUsage])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('ai_credits') === 'success') {
      void loadUsage()
      setQuotaMessage(null)
      setBuyModalOpen(false)
      window.history.replaceState({}, '', '/enkelexcel-ai')
    } else if (params.get('ai_credits') === 'canceled') {
      window.history.replaceState({}, '', '/enkelexcel-ai')
    }
  }, [loadUsage])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const atQuota = usage !== null && usage.used >= usage.limit && usage.bonusCredits <= 0
  const showHalfInfo =
    usage !== null && shouldShowHalfUsageInfo(usage.used, usage.limit) && !atQuota

  const messagesLeft =
    usage !== null
      ? Math.max(0, usage.limit - usage.used) + usage.bonusCredits
      : null

  async function startAiCreditsCheckout() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/ai-credits-checkout', { method: 'POST' })
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!res.ok) {
        throw new Error(data?.error ?? 'Kunne ikke starte betaling.')
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('Manglende betalingslenke.')
    } catch (e) {
      setQuotaMessage(e instanceof Error ? e.message : 'Betaling kunne ikke startes.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading || atQuota) return

    setQuotaMessage(null)
    setIsLoading(true)
    const userMessage: ChatMessage = { id: generateId(), role: 'user', content: text }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')

    try {
      const resp = await fetch('/api/enkelexcel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (resp.status === 429) {
        const err = (await resp.json().catch(() => null)) as {
          error?: string
          usage?: Partial<UsageState>
        } | null
        setMessages((prev) => prev.slice(0, -1))
        setInput(text)
        setQuotaMessage(err?.error ?? 'Månedskvoten er brukt.')
        if (err?.usage?.used !== undefined && err?.usage?.limit !== undefined) {
          setUsage((prev) =>
            prev
              ? {
                  ...prev,
                  used: err.usage!.used!,
                  limit: err.usage!.limit!,
                  bonusCredits: err.usage!.bonusCredits ?? 0,
                }
              : null,
          )
        }
        setBuyModalOpen(true)
        return
      }

      if (!resp.ok) {
        const err = await resp.json().catch(() => null)
        throw new Error(err?.error ?? `Feil fra server (${resp.status})`)
      }

      const data = (await resp.json()) as {
        reply?: string
        usage?: Partial<UsageState>
      }
      const reply = data.reply
      if (!reply) throw new Error('Ingen svar fra EnkelExcel AI.')

      if (data.usage) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                used: data.usage!.used ?? prev.used,
                limit: data.usage!.limit ?? prev.limit,
                bonusCredits: data.usage!.bonusCredits ?? prev.bonusCredits,
              }
            : null,
        )
      }
      setMessages((prev) => [...prev, { id: generateId(), role: 'assistant', content: reply }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ukjent feil'
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'assistant', content: `Beklager: ${msg}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <Header title={assistantName} subtitle="Din økonomiassistent" />

      <div className="flex flex-1 flex-col min-h-0 px-4 py-4 md:px-8 w-full max-w-2xl mx-auto">
        {usageLoadError ? (
          <p className="text-xs mb-2" style={{ color: 'var(--danger)' }}>
            {usageLoadError}
          </p>
        ) : null}

        {showHalfInfo && usage ? (
          <p
            className="text-xs mb-3 rounded-xl px-3 py-2"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            Du har brukt {usage.used} av {usage.limit} inkluderte meldinger denne måneden.
            {usage.bonusCredits > 0 ? ` Du har også ${usage.bonusCredits} ekstra meldinger.` : ''}
          </p>
        ) : null}

        {usage && usage.bonusCredits > 0 && usage.used >= usage.limit ? (
          <p
            className="text-xs mb-3 rounded-xl px-3 py-2"
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
                onClick={() => setBuyModalOpen(true)}
                className="text-sm font-medium underline"
                style={{ color: 'var(--primary)' }}
              >
                Kjøp {usage.bonusPackCredits} meldinger til for {usage.bonusPackPriceNok} kr
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          className="flex flex-1 flex-col min-h-0 rounded-2xl p-4 md:p-6"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            minHeight: 0,
            maxHeight: 'min(70dvh, calc(100dvh - 11rem))',
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={m.id}
                  className="space-y-2"
                  style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed"
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
                    <p className="mt-1">{m.content}</p>
                  </div>
                </div>
              )
            })}
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  className="rounded-2xl p-4 text-sm"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {assistantName} tenker...
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="shrink-0 pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={atQuota ? 'Ingen meldinger igjen — kjøp flere eller vent til neste måned' : `Skriv til ${assistantName}...`}
                disabled={atQuota || isLoading}
                className="flex-1 px-3 py-2 rounded-xl text-sm disabled:opacity-60"
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
                    handleSend()
                  }
                }}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || atQuota}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
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

            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Tips: Spør om budsjett, sparing, gjeld, eller hvordan du kan prioritere neste steg.
            </p>
          </div>
        </div>
      </div>

      {buyModalOpen && usage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          role="presentation"
          onClick={() => setBuyModalOpen(false)}
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
              Du har brukt alle inkluderte meldinger for denne måneden. Du kan kjøpe{' '}
              <strong style={{ color: 'var(--text)' }}>{usage.bonusPackCredits} ekstra meldinger</strong>{' '}
              for <strong style={{ color: 'var(--text)' }}>{usage.bonusPackPriceNok} kr</strong> (engangsbetaling
              med kort via Stripe).
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                type="button"
                onClick={() => void startAiCreditsCheckout()}
                disabled={checkoutLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-70"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                {checkoutLoading ? 'Åpner betaling…' : `Gå til betaling (${usage.bonusPackPriceNok} kr)`}
              </button>
              <button
                type="button"
                onClick={() => setBuyModalOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium"
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
      ) : null}
    </div>
  )
}
