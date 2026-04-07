import Link from 'next/link'
import { CTA_HREF, LOGIN_HREF } from './constants'

export default function LandingHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 max-w-[min(100%,12rem)] shrink items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:max-w-none sm:gap-3"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            SB
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
              Smart Budsjett
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              by EnkelExcel
            </p>
          </div>
        </Link>

        <nav className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <a
            href="#funksjoner"
            className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-block"
            style={{ color: 'var(--text-muted)' }}
          >
            Funksjoner
          </a>
          <a
            href="#priser"
            className="hidden rounded-lg px-2 py-2 text-sm font-medium sm:inline-block"
            style={{ color: 'var(--text-muted)' }}
          >
            Priser
          </a>
          <a
            href="#faq"
            className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-block"
            style={{ color: 'var(--text-muted)' }}
          >
            FAQ
          </a>
          <Link
            href={LOGIN_HREF}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Logg inn
          </Link>
          <Link
            href={CTA_HREF}
            className="inline-flex min-h-[44px] max-w-[11rem] flex-col items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold leading-tight text-white shadow-sm transition-opacity hover:opacity-95 sm:max-w-none sm:px-4 sm:text-sm"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            <span className="sm:hidden">Start gratis</span>
            <span className="hidden sm:inline">Start gratis prøveperiode</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
