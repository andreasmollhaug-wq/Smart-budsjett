'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { useDottirAi } from '@/components/enkelexcel-ai/DottirAiProvider'

const INTRO_STORAGE_KEY = 'dottir-ai-intro-seen-v1'

type Props = {
  className?: string
}

export default function DottirAiHeaderButton({ className = '' }: Props) {
  const pathname = usePathname()
  const { open } = useDottirAi()
  const [showIntro, setShowIntro] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (pathname === '/enkelexcel-ai') return
    if (typeof window === 'undefined') return
    const seen = window.localStorage.getItem(INTRO_STORAGE_KEY)
    if (!seen) setShowIntro(true)
  }, [pathname])

  if (pathname === '/enkelexcel-ai') return null

  function dismissIntro() {
    setShowIntro(false)
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  function handleOpen() {
    dismissIntro()
    open()
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors touch-manipulation"
        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        aria-label="Åpne dottir AI"
        title="dottir AI (Ctrl+K)"
      >
        <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
      </button>

      {showIntro ? (
        <div
          className="absolute right-0 top-full z-[70] mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl p-3 text-xs leading-relaxed shadow-lg"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          role="tooltip"
        >
          <p>Spør om tallene dine og hvordan appen fungerer.</p>
          <button
            type="button"
            onClick={dismissIntro}
            className="mt-2 font-medium underline min-h-[32px]"
            style={{ color: 'var(--primary)' }}
          >
            Skjønner
          </button>
        </div>
      ) : null}
    </div>
  )
}
