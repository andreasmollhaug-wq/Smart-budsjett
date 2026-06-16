'use client'

import Link from 'next/link'
import { ArrowLeft, Snowflake, TrendingDown } from 'lucide-react'
import { formatNOK } from '@/lib/utils'
import { snowballArticleSections } from '@/lib/snowballArticleCopy'
import { snowballStrategyCards } from '@/lib/snowballGuideCopy'
import SnowballDemoCompareVisuals from '@/components/marketing/snowball/SnowballDemoCompareVisuals'

function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} style={{ color: 'var(--text)' }}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

function MethodCard({
  title,
  tagline,
  points,
  bestFor,
  icon: Icon,
  accent,
}: {
  title: string
  tagline: string
  points: readonly string[]
  bestFor: string
  icon: typeof Snowflake
  accent: string
}) {
  return (
    <div
      className="rounded-2xl p-5 min-w-0 flex-1"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3"
        style={{ background: accent + '18', color: accent }}
      >
        <Icon size={20} aria-hidden />
      </span>
      <h3 className="text-lg font-semibold m-0 mb-0.5" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p className="text-sm font-medium m-0 mb-3" style={{ color: accent }}>
        {tagline}
      </p>
      <ul className="text-sm space-y-2 m-0 pl-0 list-none" style={{ color: 'var(--text-muted)' }}>
        {points.map((point) => (
          <li key={point} className="leading-relaxed pl-0">
            <RichText text={point} />
          </li>
        ))}
      </ul>
      <p className="text-xs mt-4 m-0 pt-3 border-t leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        {bestFor}
      </p>
    </div>
  )
}

export default function SnowballMethodGuideArticle() {
  const s = snowballArticleSections

  return (
    <div className="space-y-12 min-w-0">
      <div className="flex flex-wrap gap-3 min-w-0">
        <Link
          href="/gjeld"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium touch-manipulation"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          <ArrowLeft size={18} aria-hidden />
          Tilbake til Gjeld
        </Link>
        <Link
          href="/snoball"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium border touch-manipulation"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Snøball-verktøyet
        </Link>
      </div>

      <section className="space-y-3 min-w-0">
        <h2 className="text-xl font-semibold m-0 sm:text-2xl" style={{ color: 'var(--text)' }}>
          {s.intro.title}
        </h2>
        <p className="text-base m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <RichText text={s.intro.lead} />
        </p>
      </section>

      <section className="space-y-4 min-w-0">
        <h2 className="text-xl font-semibold m-0 sm:text-2xl" style={{ color: 'var(--text)' }}>
          To metoder — samme grunnidé
        </h2>
        <div className="flex flex-col lg:flex-row gap-4 min-w-0">
          <MethodCard
            title={snowballStrategyCards.snowball.title}
            tagline={snowballStrategyCards.snowball.tagline}
            points={s.snowball.points}
            bestFor={s.snowball.bestFor}
            icon={Snowflake}
            accent="#3B5BDB"
          />
          <MethodCard
            title={snowballStrategyCards.avalanche.title}
            tagline={snowballStrategyCards.avalanche.tagline}
            points={s.avalanche.points}
            bestFor={s.avalanche.bestFor}
            icon={TrendingDown}
            accent="#0CA678"
          />
        </div>
      </section>

      <section className="space-y-4 min-w-0">
        <h2 className="text-xl font-semibold m-0 sm:text-2xl" style={{ color: 'var(--text)' }}>
          {s.howItWorks.title}
        </h2>
        <ol className="m-0 pl-0 list-none space-y-3">
          {s.howItWorks.steps.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 rounded-xl p-4 min-w-0"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
              >
                {i + 1}
              </span>
              <p className="text-sm m-0 leading-relaxed self-center" style={{ color: 'var(--text-muted)' }}>
                <RichText text={step} />
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4 min-w-0">
        <h2 className="text-xl font-semibold m-0 sm:text-2xl" style={{ color: 'var(--text)' }}>
          {s.example.title}
        </h2>
        <p className="text-base m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <RichText text={s.example.lead} />
        </p>
        <SnowballDemoCompareVisuals formatNOK={formatNOK} showDemoBanner />
      </section>

      <section className="space-y-4 min-w-0">
        <h2 className="text-xl font-semibold m-0 sm:text-2xl" style={{ color: 'var(--text)' }}>
          {s.inDottir.title}
        </h2>
        <ul className="text-sm space-y-2 m-0 pl-0 list-none" style={{ color: 'var(--text-muted)' }}>
          {s.inDottir.points.map((point) => (
            <li key={point} className="leading-relaxed pl-0">
              <RichText text={point} />
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
          <Link
            href="/gjeld"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            <ArrowLeft size={18} aria-hidden />
            Tilbake til Gjeld
          </Link>
          <Link
            href="/snoball"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-medium border touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Åpne Snøball
          </Link>
          <Link
            href="/logg-inn"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-medium border touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Logg inn
          </Link>
        </div>
      </section>

      <section className="space-y-3 min-w-0">
        <h2 className="text-xl font-semibold m-0 sm:text-2xl" style={{ color: 'var(--text)' }}>
          {s.watchOut.title}
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {s.watchOut.items.map((item) => (
            <li key={item} className="leading-relaxed">
              <RichText text={item} />
            </li>
          ))}
        </ul>
        <p className="text-xs m-0 pt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {s.disclaimer}
        </p>
      </section>
    </div>
  )
}
