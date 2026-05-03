'use client'

import Link from 'next/link'
import './globals.css'

/**
 * Rot-feilgrense (Next.js App Router). Må være klientkomponent og ha egen <html>/<body>.
 * Reduserer Turbopack/RSC-problemer med innebygd global-error og gir forutsigbar fallback ved krasj.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="nb">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: 'var(--bg, #EEF2FF)',
          color: 'var(--text, #1E2B4F)',
        }}
      >
        <main style={{ maxWidth: '24rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Noe gikk galt</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6B7A99)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            Vi kunne ikke laste siden. Du kan prøve igjen, eller gå til forsiden om problemet vedvarer.
          </p>
          {process.env.NODE_ENV === 'development' ? (
            <pre
              style={{
                fontSize: '0.7rem',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '8rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #D4DCF7)',
                marginBottom: '1rem',
              }}
            >
              {error.message}
            </pre>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: '0 1rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: '#fff',
                background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)',
              }}
            >
              Prøv igjen
            </button>
            <Link
              href="/"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 1rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--primary, #3B5BDB)',
                border: '1px solid var(--border, #D4DCF7)',
                background: 'var(--surface, #fff)',
                textDecoration: 'none',
              }}
            >
              Til forsiden
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
