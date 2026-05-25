'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  enkelexcelAiChatStorageKey,
  parseStoredAiChatMessages,
  trimStoredMessages,
} from '@/lib/enkelexcelAiChatStorage'
import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'
import { shouldShowHalfUsageInfo } from '@/lib/aiUsage'
import { useActivePersonFinance } from '@/lib/store'
import {
  buildAllSuggestedQuestions,
  DOTTIR_AI_ASSISTANT_NAME,
  dottirAiWelcomeMessage,
} from '@/lib/dottirAiSuggestedQuestions'
import { mergeContextualSuggestions } from '@/lib/dottirAiRouteSuggestions'
import { useDottirAiUserSnapshot } from '@/components/enkelexcel-ai/useDottirAiUserSnapshot'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export type UsageState = {
  used: number
  limit: number
  bonusCredits: number
  bonusPackCredits: number
  bonusPackPriceNok: number
}

export function useDottirAiChat() {
  const pathname = usePathname()
  const assistantName = DOTTIR_AI_ASSISTANT_NAME

  const suggestedQuestions = useMemo(() => buildAllSuggestedQuestions(), [])
  const userSnapshot = useDottirAiUserSnapshot()
  const contextualSuggestions = useMemo(
    () => mergeContextualSuggestions(pathname, userSnapshot, suggestedQuestions, 8),
    [pathname, userSnapshot, suggestedQuestions],
  )
  const compactSuggestions = useMemo(
    () => mergeContextualSuggestions(pathname, userSnapshot, suggestedQuestions, 6),
    [pathname, userSnapshot, suggestedQuestions],
  )

  const { isHouseholdAggregate, profiles, activeProfileId } = useActivePersonFinance()
  const activeProfileName = profiles.find((p) => p.id === activeProfileId)?.name?.trim() || 'Aktiv profil'
  const dataScopeLine = isHouseholdAggregate
    ? 'Grunnlag: samlet husholdning (alle profiler).'
    : `Grunnlag: kun ${activeProfileName}. Bytt profil eller Husholdning i profilvelgeren til venstre.`

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: generateId(),
        role: 'assistant',
        content: dottirAiWelcomeMessage(assistantName),
      },
    ],
    [assistantName],
  )

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [buyModalContext, setBuyModalContext] = useState<'at_quota' | 'optional'>('at_quota')
  const [userId, setUserId] = useState<string | null>(null)
  const [chatHydrated, setChatHydrated] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [usage, setUsage] = useState<UsageState | null>(null)
  const [usageLoadError, setUsageLoadError] = useState<string | null>(null)
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

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
        setBuyModalContext('at_quota')
      }
    } catch (e) {
      setUsageLoadError(e instanceof Error ? e.message : 'Kunne ikke hente bruk')
    }
  }, [])

  useEffect(() => {
    void loadUsage()
  }, [loadUsage])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (cancelled) return
        if (!user) {
          setMessages(initialMessages)
          setChatHydrated(true)
          return
        }
        setUserId(user.id)
        const raw =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(enkelexcelAiChatStorageKey(user.id))
            : null
        const parsed = parseStoredAiChatMessages(raw)
        if (parsed && parsed.length > 0) {
          setMessages(trimStoredMessages(parsed))
        } else {
          setMessages(initialMessages)
        }
      } catch {
        if (!cancelled) setMessages(initialMessages)
      } finally {
        if (!cancelled) setChatHydrated(true)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [initialMessages])

  useEffect(() => {
    if (!chatHydrated || !userId || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        enkelexcelAiChatStorageKey(userId),
        JSON.stringify(trimStoredMessages(messages)),
      )
    } catch (e) {
      console.error('[enkelexcel-ai] lagring av samtale', e)
    }
  }, [messages, userId, chatHydrated])

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
      setBuyModalContext('at_quota')
      const path = window.location.pathname
      window.history.replaceState({}, '', path)
    } else if (params.get('ai_credits') === 'canceled') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loadUsage])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const atQuota = usage !== null && usage.used >= usage.limit && usage.bonusCredits <= 0
  const showHalfInfo =
    usage !== null && shouldShowHalfUsageInfo(usage.used, usage.limit) && !atQuota

  const messagesLeft =
    usage !== null ? Math.max(0, usage.limit - usage.used) + usage.bonusCredits : null

  const hasUsageBanner =
    showHalfInfo ||
    (usage !== null && usage.bonusCredits > 0 && usage.used >= usage.limit) ||
    quotaMessage !== null

  const clearConversation = useCallback(() => {
    setInput('')
    setMessages([
      {
        id: generateId(),
        role: 'assistant',
        content: dottirAiWelcomeMessage(assistantName),
      },
    ])
  }, [assistantName])

  const startAiCreditsCheckout = useCallback(async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/ai-credits-checkout', { method: 'POST' })
      const data = (await res.json().catch(() => null)) as {
        url?: string
        error?: string
        stripeRequestId?: string
      } | null
      if (!res.ok) {
        const msg = data?.error ?? 'Kunne ikke starte betaling.'
        const ref = data?.stripeRequestId
        throw new Error(ref ? `${msg} Teknisk referanse (Stripe): ${ref}` : msg)
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
  }, [])

  const applyUsageFromResponse = useCallback((partial: Partial<UsageState>) => {
    setUsage((prev) =>
      prev
        ? {
            ...prev,
            used: partial.used ?? prev.used,
            limit: partial.limit ?? prev.limit,
            bonusCredits: partial.bonusCredits ?? prev.bonusCredits,
          }
        : null,
    )
  }, [])

  const handleQuota429 = useCallback(
    async (resp: Response, text: string) => {
      const err = (await resp.json().catch(() => null)) as {
        error?: string
        usage?: Partial<UsageState>
      } | null
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
      setQuotaMessage(err?.error ?? 'Månedskvoten er brukt.')
      if (err?.usage?.used !== undefined && err?.usage?.limit !== undefined) {
        applyUsageFromResponse(err.usage)
      }
      setBuyModalOpen(true)
    },
    [applyUsageFromResponse],
  )

  const sendMessages = useCallback(
    async (nextMessages: ChatMessage[]) => {
      const payload = nextMessages.map((m) => ({ role: m.role, content: m.content }))
      const assistantId = generateId()

      try {
        const streamResp = await fetch('/api/enkelexcel-ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payload }),
        })

        if (streamResp.status === 429) {
          const lastUser = [...nextMessages].reverse().find((m) => m.role === 'user')
          await handleQuota429(streamResp, lastUser?.content ?? '')
          return
        }

        if (streamResp.ok && streamResp.body) {
          setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

          const reader = streamResp.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let fullText = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6).trim()
              if (!jsonStr || jsonStr === '[DONE]') continue
              try {
                const chunk = JSON.parse(jsonStr) as {
                  delta?: string
                  done?: boolean
                  usage?: Partial<UsageState>
                  error?: string
                }
                if (chunk.error) throw new Error(chunk.error)
                if (chunk.delta) {
                  fullText += chunk.delta
                  const text = fullText
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m)),
                  )
                }
                if (chunk.done && chunk.usage) {
                  applyUsageFromResponse(chunk.usage)
                }
              } catch (parseErr) {
                if (parseErr instanceof Error && !parseErr.message.includes('JSON')) {
                  throw parseErr
                }
              }
            }
          }

          if (!fullText.trim()) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: 'dottir AI sendte ingen tekst.' } : m,
              ),
            )
          }
          return
        }

        const resp = await fetch('/api/enkelexcel-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payload }),
        })

        if (resp.status === 429) {
          const lastUser = [...nextMessages].reverse().find((m) => m.role === 'user')
          await handleQuota429(resp, lastUser?.content ?? '')
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
        if (!reply) throw new Error('Ingen svar fra dottir AI.')

        if (data.usage) applyUsageFromResponse(data.usage)
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: reply }])
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ukjent feil'
        setMessages((prev) => {
          const withoutEmpty = prev.filter(
            (m) => !(m.id === assistantId && m.role === 'assistant' && !m.content),
          )
          return [
            ...withoutEmpty,
            { id: generateId(), role: 'assistant', content: `Beklager: ${msg}` },
          ]
        })
      }
    },
    [applyUsageFromResponse, handleQuota429],
  )

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading || atQuota || !chatHydrated) return

      setQuotaMessage(null)
      setIsLoading(true)
      const userMessage: ChatMessage = { id: generateId(), role: 'user', content: trimmed }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setInput('')

      try {
        await sendMessages(nextMessages)
      } finally {
        setIsLoading(false)
      }
    },
    [atQuota, chatHydrated, isLoading, messages, sendMessages],
  )

  const handleSend = useCallback(async () => {
    await sendText(input)
  }, [input, sendText])

  const applySuggestedQuestion = useCallback(
    (text: string) => {
      void sendText(text)
    },
    [sendText],
  )

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      if (isLoading || atQuota || !chatHydrated) return

      const idx = messages.findIndex((m) => m.id === messageId)
      if (idx < 0 || messages[idx].role !== 'assistant') return

      let userIdx = idx - 1
      while (userIdx >= 0 && messages[userIdx].role !== 'user') userIdx--
      if (userIdx < 0) return

      const trimmed = messages.slice(0, userIdx + 1)
      setQuotaMessage(null)
      setIsLoading(true)
      setMessages(trimmed)

      try {
        await sendMessages(trimmed)
      } finally {
        setIsLoading(false)
      }
    },
    [atQuota, chatHydrated, isLoading, messages, sendMessages],
  )

  return {
    assistantName,
    dataScopeLine,
    suggestedQuestions,
    contextualSuggestions,
    compactSuggestions,
    input,
    setInput,
    isLoading,
    checkoutLoading,
    buyModalOpen,
    setBuyModalOpen,
    buyModalContext,
    setBuyModalContext,
    chatHydrated,
    messages,
    usage,
    usageLoadError,
    quotaMessage,
    endRef,
    textareaRef,
    applySuggestedQuestion,
    loadUsage,
    atQuota,
    showHalfInfo,
    messagesLeft,
    hasUsageBanner,
    clearConversation,
    startAiCreditsCheckout,
    handleSend,
    regenerateMessage,
  }
}

export type DottirAiChatState = ReturnType<typeof useDottirAiChat>
