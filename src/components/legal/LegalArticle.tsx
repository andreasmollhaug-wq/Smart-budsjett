import type { ReactNode } from 'react'
import Link from 'next/link'

type Props = {
  title: string
  description: string
  children: ReactNode
}

export default function LegalArticle({ title, description, children }: Props) {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-14" style={{ background: 'var(--bg)' }}>
      <article className="mx-auto max-w-3xl">
        <div
          className="rounded-2xl border p-6 shadow-sm sm:p-8 md:p-10"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 4px 24px -8px color-mix(in srgb, var(--text) 12%, transparent)',
          }}
        >
          <Link
            href="/"
            className="inline-block text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            ← Til forsiden
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:mt-8 sm:text-4xl" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
          <div
            className="mt-8 space-y-10 text-sm leading-relaxed sm:mt-10 sm:text-[15px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {children}
          </div>
        </div>
      </article>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-balance sm:text-xl" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

export function LegalP({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={className}>{children}</p>
}

export function LegalUl({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>
}

export function LegalLi({ children }: { children: ReactNode }) {
  return <li>{children}</li>
}
