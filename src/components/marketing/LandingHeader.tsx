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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 rounded-xl">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            SB
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Smart Budsjett
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              by EnkelExcel
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="#priser"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium sm:inline-block"
            style={{ color: 'var(--text-muted)' }}
          >
            Priser
          </a>
          <Link
            href={LOGIN_HREF}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Logg inn
          </Link>
          <Link
            href={CTA_HREF}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            Start gratis prøveperiode
          </Link>
        </nav>
      </div>
    </header>
  )
}
