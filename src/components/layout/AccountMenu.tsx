'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ChevronDown, Settings, CreditCard, Shield, LogOut, Map } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetStoreForLogout } from '@/lib/store'

export default function AccountMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
          style={{ background: 'var(--primary)' }}
        >
          <User size={12} />
        </div>
        <span>Min konto</span>
        <ChevronDown
          size={14}
          style={{ color: 'var(--text-muted)' }}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl py-1 z-50 shadow-lg"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <Link
            href="/konto/innstillinger"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text)' }}
          >
            <Settings size={16} style={{ color: 'var(--text-muted)' }} />
            Innstillinger
          </Link>
          <Link
            href="/konto/betalinger"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text)' }}
          >
            <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
            Betalinger
          </Link>
          <Link
            href="/konto/sikkerhet"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text)' }}
          >
            <Shield size={16} style={{ color: 'var(--text-muted)' }} />
            Sikkerhet
          </Link>
          <Link
            href="/konto/roadmap"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text)' }}
          >
            <Map size={16} style={{ color: 'var(--text-muted)' }} />
            Roadmap
          </Link>
          <div className="my-1 h-px" style={{ background: 'var(--border)' }} />
          <button
            type="button"
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left disabled:opacity-60"
            style={{ color: 'var(--text-muted)' }}
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true)
              try {
                const supabase = createClient()
                await supabase.auth.signOut()
                resetStoreForLogout()
                setOpen(false)
                router.push('/')
                router.refresh()
              } finally {
                setLoggingOut(false)
              }
            }}
          >
            <LogOut size={16} />
            {loggingOut ? 'Logger ut…' : 'Logg ut'}
          </button>
        </div>
      )}
    </div>
  )
}
