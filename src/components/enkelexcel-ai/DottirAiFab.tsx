'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X } from 'lucide-react'
import { useDottirAi } from '@/components/enkelexcel-ai/DottirAiProvider'
import {
  hideFabUntilEnabled,
  hideFabUntilTomorrow,
  isDottirAiFabVisible,
  readDottirAiFabPrefs,
} from '@/lib/dottirAiFabPrefs'

export default function DottirAiFab() {
  const pathname = usePathname()
  const { isOpen, open, fabPrefs, setFabPrefs } = useDottirAi()
  const [dismissOpen, setDismissOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const longPressTimer = useRef<number | null>(null)

  useEffect(() => {
    setVisible(isDottirAiFabVisible(fabPrefs))
  }, [fabPrefs])

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const onPointerDown = useCallback(() => {
    clearLongPress()
    longPressTimer.current = window.setTimeout(() => {
      setDismissOpen(true)
    }, 600)
  }, [clearLongPress])

  if (pathname === '/enkelexcel-ai' || isOpen || !visible) return null

  return (
    <>
      <button
        type="button"
        onClick={() => open()}
        onPointerDown={onPointerDown}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        className="md:hidden fixed z-40 flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full shadow-lg touch-manipulation"
        style={{
          background: 'var(--primary)',
          color: 'white',
          right: 'max(1rem, env(safe-area-inset-right))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        aria-label="Åpne dottir AI"
      >
        <MessageSquare className="h-6 w-6" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setDismissOpen(true)}
        className="md:hidden fixed z-40 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold touch-manipulation"
        style={{
          background: 'var(--surface)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          right: 'calc(max(1rem, env(safe-area-inset-right)) + 2.75rem)',
          bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 2.75rem)',
        }}
        aria-label="Skjul dottir AI-knapp"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>

      {dismissOpen ? (
        <div
          className="fixed inset-0 z-[65] flex items-end justify-center p-4 md:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          role="presentation"
          onClick={() => setDismissOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fab-dismiss-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="fab-dismiss-title" className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              Skjul flytende knapp?
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              dottir AI finnes fortsatt i menyen og via innstillinger.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-medium touch-manipulation"
                style={{ background: 'var(--primary)', color: 'white' }}
                onClick={() => {
                  setFabPrefs(hideFabUntilTomorrow())
                  setDismissOpen(false)
                }}
              >
                Skjul til i morgen
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-medium touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
                onClick={() => {
                  setFabPrefs(hideFabUntilEnabled())
                  setDismissOpen(false)
                }}
              >
                Skjul inntil jeg slår på igjen
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-medium touch-manipulation"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setDismissOpen(false)}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

/** Synk prefs ved mount (f.eks. etter innstillinger i annen fane) */
export function useDottirAiFabPrefsSync() {
  const { setFabPrefs } = useDottirAi()
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && !e.key.includes('dottir-ai-fab')) return
      setFabPrefs(readDottirAiFabPrefs())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [setFabPrefs])
}
