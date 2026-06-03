'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import BrandLogoMark from '@/components/brand/BrandLogoMark'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

export default function AdminMetricsHeader({
  updatedLabel,
  onRefresh,
  refreshing = false,
}: {
  updatedLabel?: string
  onRefresh?: () => void
  refreshing?: boolean
}) {
  return (
    <header
      className="border-b"
      style={{
        borderColor: 'var(--border)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--primary) 6%, var(--surface)) 0%, var(--surface) 100%)',
      }}
    >
      <div className="mx-auto flex max-w-6xl min-w-0 items-start justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] py-4 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogoMark size="sm" alt="" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{PRODUCT_DISPLAY_NAME} Admin</h1>
              <span
                className="rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide sm:text-xs"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 12%, var(--bg))',
                  color: 'var(--primary)',
                }}
              >
                Intern
              </span>
            </div>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {updatedLabel ? (
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                  Sist hentet {updatedLabel} · Europe/Oslo
                </p>
              ) : (
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                  Beskyttet oversikt · MFA påkrevd
                </p>
              )}
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label="Oppdater tall"
                  title="Oppdater tall"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-medium touch-manipulation transition-opacity disabled:opacity-60 sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1"
                  style={{ color: 'var(--primary)' }}
                >
                  <RefreshCw
                    size={16}
                    strokeWidth={2.2}
                    className={refreshing ? 'animate-spin' : undefined}
                    aria-hidden
                  />
                  <span className="hidden sm:inline">{refreshing ? 'Henter…' : 'Oppdater'}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <nav className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Link
            href="/konto/sikkerhet"
            className="text-xs font-medium underline touch-manipulation sm:text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Sikkerhet
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium touch-manipulation"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            Til appen
          </Link>
        </nav>
      </div>
    </header>
  )
}
