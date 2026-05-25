'use client'

import { useEffect, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  BANK_CONNECT_HELP_HOUSEHOLD_NOTE,
  BANK_CONNECT_HELP_MORE_BANKS_NOTE,
  BANK_CONNECT_HELP_PASSWORD_NOTE,
  BANK_CONNECT_HELP_SANDBOX_NOTE,
  BANK_CONNECT_HELP_STEPS,
  BANK_CONNECT_HELP_TITLE,
} from '@/lib/neonomics/bankConnectCopy'

type Props = {
  showSandboxNote?: boolean
  profileCount?: number
}

export default function BankConnectHelpPopover({
  showSandboxNote = false,
  profileCount = 1,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const steps =
    profileCount >= 2
      ? BANK_CONNECT_HELP_STEPS
      : BANK_CONNECT_HELP_STEPS.filter((_, i) => i !== 0)

  return (
    <div className="relative inline-flex shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
        aria-expanded={open}
        aria-label={BANK_CONNECT_HELP_TITLE}
      >
        <HelpCircle size={18} aria-hidden />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl p-4 text-sm shadow-lg sm:left-0 sm:right-auto"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          role="region"
          aria-labelledby="bank-connect-help-title"
        >
          <p id="bank-connect-help-title" className="font-medium mb-3 m-0">
            {BANK_CONNECT_HELP_TITLE}
          </p>
          <ol
            className="text-xs m-0 pl-4 space-y-2 leading-relaxed list-decimal"
            style={{ color: 'var(--text-muted)' }}
          >
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-xs mt-3 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {BANK_CONNECT_HELP_PASSWORD_NOTE}
          </p>
          {profileCount >= 2 && (
            <p className="text-xs mt-2 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {BANK_CONNECT_HELP_HOUSEHOLD_NOTE}
            </p>
          )}
          {showSandboxNote && (
            <p className="text-xs mt-2 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {BANK_CONNECT_HELP_SANDBOX_NOTE}
            </p>
          )}
          <p className="text-xs mt-2 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {BANK_CONNECT_HELP_MORE_BANKS_NOTE}
          </p>
        </div>
      )}
    </div>
  )
}
