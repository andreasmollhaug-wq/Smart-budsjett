'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from '@/lib/store'
import { APP_VERSION_LABEL } from '@/lib/version'

const MOBILE_MAX = '(max-width: 767px)'

export default function NotificationBell({ panelZClass }: { panelZClass?: string }) {
  const [open, setOpen] = useState(false)
  const [panelTop, setPanelTop] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useStore(
    useShallow((s) => {
      const list = s.notifications ?? []
      return {
        notifications: list,
        unreadCount: list.filter((n) => !n.read).length,
        markNotificationRead: s.markNotificationRead,
        markAllNotificationsRead: s.markAllNotificationsRead,
      }
    }),
  )

  useLayoutEffect(() => {
    if (!open) {
      setPanelTop(null)
      return
    }

    function updatePanelPosition() {
      if (typeof window === 'undefined') return
      if (!window.matchMedia(MOBILE_MAX).matches) {
        setPanelTop(null)
        return
      }
      const el = buttonRef.current
      if (!el) return
      setPanelTop(el.getBoundingClientRect().bottom + 8)
    }

    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('orientationchange', updatePanelPosition)
    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('orientationchange', updatePanelPosition)
    }
  }, [open])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Varsler, ${unreadCount} uleste` : 'Varsler'}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <Bell size={16} style={{ color: 'var(--text-muted)' }} />
        {badgeLabel !== null && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold leading-[18px] text-center text-white"
            style={{ background: 'var(--primary)' }}
          >
            {badgeLabel}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Varsler"
          className={`fixed left-1/2 -translate-x-1/2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,28rem)] flex flex-col rounded-xl shadow-lg overflow-hidden md:absolute md:inset-auto md:right-0 md:left-auto md:top-full md:mt-2 md:translate-x-0 ${panelZClass ?? 'z-50'}`}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            ...(panelTop != null ? { top: panelTop } : {}),
          }}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Varsler
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-medium"
                style={{ color: 'var(--primary)' }}
                onClick={() => markAllNotificationsRead()}
              >
                Marker alle som lest
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen varsler akkurat nå.
              </p>
            ) : (
              <ul className="py-1">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="px-3 py-3 border-b last:border-0"
                    style={{ borderColor: 'var(--border)', background: n.read ? undefined : 'var(--bg)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--text-muted)' }}>
                          {n.body}
                        </p>
                        {n.actionHref ? (
                          <Link
                            href={n.actionHref}
                            className="mt-3 inline-flex min-h-[44px] items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white w-full sm:w-auto"
                            style={{ background: 'var(--primary)' }}
                            onClick={() => setOpen(false)}
                          >
                            {n.actionLabel ?? 'Åpne'}
                          </Link>
                        ) : null}
                        <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                          {new Date(n.createdAt).toLocaleString('nb-NO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                          {n.kind === 'product' && (
                            <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: 'var(--bg)' }}>
                              App
                            </span>
                          )}
                          {n.kind === 'insight' && (
                            <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: 'var(--bg)' }}>
                              Innsikt
                            </span>
                          )}
                          {n.kind === 'budget' && (
                            <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: 'var(--bg)' }}>
                              Data
                            </span>
                          )}
                          {n.kind === 'smartvane' && (
                            <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: 'var(--bg)' }}>
                              SmartVane
                            </span>
                          )}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          className="shrink-0 text-xs font-medium"
                          style={{ color: 'var(--primary)' }}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          Marker som lest
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div
            className="px-3 py-2 text-[11px] text-center border-t"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Smart Budsjett {APP_VERSION_LABEL}
          </div>
        </div>
      )}
    </div>
  )
}
