'use client'

import Link from 'next/link'
import { CircleHelp } from 'lucide-react'
import {
  FORUM_CONTRIBUTOR_TIERS_DESC,
  FORUM_CONTRIBUTOR_WEIGHTS,
  type ForumContributorTier,
} from '@/lib/forum/contributorTier'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

const tiersByPointsAsc = [...FORUM_CONTRIBUTOR_TIERS_DESC].sort((a, b) => a.minScore - b.minScore)

export default function ForumContributorTierPanel({
  tier,
  score,
}: {
  tier: ForumContributorTier
  score: number
}) {
  return (
    <section
      aria-labelledby="forum-tier-heading"
      className="min-w-0 rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-pale) 92%, var(--surface)), var(--primary-pale))' }}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 min-w-0">
        <span className="text-3xl leading-none shrink-0 select-none" aria-hidden>
          {tier.emoji}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="forum-tier-heading" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Bidragsnivå
          </h2>
          <p className="text-base sm:text-lg font-bold leading-tight break-words" style={{ color: 'var(--text)' }}>
            {tier.emoji} {tier.labelNb}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {FORUM_CONTRIBUTOR_WEIGHTS.thread} poeng per tråd du starter · {FORUM_CONTRIBUTOR_WEIGHTS.reply} poeng per svar ·{' '}
            <span className="tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
              din sum: {score}
            </span>
          </p>
        </div>
      </div>

      <details
        className="group border-t min-w-0"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 75%, transparent)' }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] touch-manipulation min-h-[48px] [&::-webkit-details-marker]:hidden [&::marker]:content-none hover:bg-[color-mix(in_srgb,var(--surface)_55%,transparent)]">
          <CircleHelp className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} style={{ color: 'var(--primary)' }} aria-hidden />
          <span style={{ color: 'var(--text)' }}>Hvordan poeng og nivåer fungerer</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wide opacity-70" style={{ color: 'var(--text-muted)' }} aria-hidden>
            <span className="group-open:hidden">Vis</span>
            <span className="hidden group-open:inline">Skjul</span>
          </span>
        </summary>
        <div
          className="px-4 pb-4 pt-0 text-xs leading-relaxed space-y-3 border-t"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 55%, transparent)', color: 'var(--text-muted)' }}
        >
          <p className="font-semibold pt-2" style={{ color: 'var(--text)' }}>
            Kort forklart
          </p>
          <p>
            Du samler poeng ved å være aktiv. Å starte en tråd gir mer enn ett enkelt svar — begge teller og hjelper andre som bruker appen.
          </p>
          <p className="font-medium" style={{ color: 'var(--text)' }}>
            Terskler (minste poengsum for nivået)
          </p>
          <ul className="space-y-1.5 list-none p-0 m-0">
            {tiersByPointsAsc.map((t) => (
              <li key={t.id} className="flex items-baseline gap-2 min-w-0">
                <span className="shrink-0 text-base" aria-hidden>
                  {t.emoji}
                </span>
                <span className="min-w-0">
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {t.labelNb}
                  </span>
                  <span className="tabular-nums"> — fra {t.minScore} poeng</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            Lyst til å stige i nivå eller bare henge med? Alle bidrag teller.{' '}
            <Link href={FORUM_BASE_PATH} className="font-semibold underline underline-offset-2" style={{ color: 'var(--primary)' }}>
              Gå til forumforsiden
            </Link>
            , start en tråd i en kategori du bryr deg om, eller svar noen som har spurt om noe du kan.
          </p>
        </div>
      </details>
    </section>
  )
}
