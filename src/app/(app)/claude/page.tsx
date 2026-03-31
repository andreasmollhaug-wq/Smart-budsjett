'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { generateId } from '@/lib/utils'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export default function ClaudePage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    setIsLoading(true)
    const userMessage: ChatMessage = { id: generateId(), role: 'user', content: text }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')

    try {
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => null)
        throw new Error(err?.error ?? `Feil fra server (${resp.status})`)
      }

      const data: unknown = await resp.json()
      const reply = (data as { reply?: string })?.reply
      if (!reply) throw new Error('Ingen svar fra EnkelExcel AI.')

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
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title={assistantName} subtitle="Din økonomiassistent" />

      <div className="p-8 space-y-6">
        <div
          className="rounded-2xl p-6 flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '60vh' }}
        >
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={m.id}
                  className="space-y-2"
                  style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    className="max-w-[80%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed"
                    style={{
                      background: isUser ? 'var(--primary-pale)' : 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    <p className="font-semibold" style={{ color: isUser ? 'var(--primary)' : 'var(--text-muted)' }}>
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
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  {assistantName} tenker...
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Skriv til ${assistantName}...`}
                className="flex-1 px-3 py-2 rounded-xl text-sm"
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
                onClick={handleSend}
                disabled={isLoading}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                style={{ background: 'var(--primary)', color: 'white', whiteSpace: 'nowrap' }}
              >
                Send
              </button>
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Tips: Spør om budsjett, sparing, gjeld, eller hvordan du kan prioritere neste steg.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

