import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ArticleBlock } from '@/lib/articles'

type Props = {
  title: string
  description: string
  publishedLabel: string
  children: ReactNode
}

export default function GuideArticle({ title, description, publishedLabel, children }: Props) {
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
            <Link
              href="/guider"
              className="transition-opacity hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              ← Til guider
            </Link>
            <span style={{ color: 'var(--text-muted)' }} aria-hidden>
              ·
            </span>
            <Link href="/" className="transition-opacity hover:opacity-80" style={{ color: 'var(--primary)' }}>
              Forsiden
            </Link>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:mt-8 sm:text-4xl" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {publishedLabel}
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

export function GuideBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`
        if (block.type === 'h2') {
          return (
            <h2
              key={key}
              className="text-lg font-semibold text-balance sm:text-xl"
              style={{ color: 'var(--text)' }}
            >
              {block.text}
            </h2>
          )
        }
        if (block.type === 'p') {
          return (
            <p key={key} className="leading-relaxed">
              {block.text}
            </p>
          )
        }
        return (
          <ul key={key} className="list-disc space-y-2 pl-5">
            {block.items.map((item, j) => (
              <li key={`${key}-${j}`}>{item}</li>
            ))}
          </ul>
        )
      })}
    </>
  )
}
