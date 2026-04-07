import type { Metadata } from 'next'
import Link from 'next/link'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingHeader from '@/components/marketing/LandingHeader'
import { articles } from '@/lib/articles'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Guider om budsjett og økonomi'
const description =
  'Praktiske guider om månedlig budsjett, oversikt over utgifter og nedbetaling av gjeld — fra Smart Budsjett · EnkelExcel.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: `${getSiteUrl()}/guider`,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · Smart Budsjett`,
    description,
  },
  alternates: {
    canonical: `${getSiteUrl()}/guider`,
  },
}

function formatNorwegianDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function GuiderIndexPage() {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
          Guider
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Korte artikler om budsjett og økonomi — skrevet for deg som vil ha oversikt uten unødvendig fagjargon.
        </p>
        <ul className="mt-10 space-y-6">
          {sorted.map((a) => (
            <li key={a.slug}>
              <article
                className="rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 4px 24px -8px color-mix(in srgb, var(--text) 8%, transparent)',
                }}
              >
                <h2 className="text-lg font-semibold sm:text-xl">
                  <Link
                    href={`/guider/${a.slug}`}
                    className="text-balance underline-offset-4 transition-opacity hover:opacity-90"
                    style={{ color: 'var(--text)' }}
                  >
                    {a.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {a.description}
                </p>
                <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Publisert {formatNorwegianDate(a.publishedAt)}
                </p>
                <Link
                  href={`/guider/${a.slug}`}
                  className="mt-4 inline-block text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  Les mer →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <LandingFooter />
    </div>
  )
}
