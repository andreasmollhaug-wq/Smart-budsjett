'use client'

import { useState, useRef, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Info, Repeat } from 'lucide-react'
import type { ServiceSubscriptionMonthPoint } from '@/lib/serviceSubscriptionPeriodRollup'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

const INFO_TEXT =
  'Kostnaden følger datofilteret over (år og periode). For hver måned summeres månedlig ekvivalent for aktive tjenesteabonnement (årlige abo deles på 12 for hver måned de er aktive). Totalen er summen over alle måneder i perioden. Antall er unike abonnement med minst én aktiv måned i perioden.'

type Props = {
  periodLabel: string
  totalNok: number
  uniqueCount: number
  monthly: ServiceSubscriptionMonthPoint[]
}

export default function DashboardServiceSubscriptionsPeriodCard({
  periodLabel,
  totalNok,
  uniqueCount,
  monthly,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const [infoOpen, setInfoOpen] = useState(false)
  const infoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const close = (e: PointerEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [infoOpen])

  const chartData = monthly.map((p) => ({
    name: p.monthLabel,
    kostnad: p.costNok,
  }))

  const hasAnyCost = monthly.some((p) => p.costNok > 0)
  const countLabel = uniqueCount === 1 ? 'abonnement' : 'abonnementer'

  return (
    <div
      className="flex h-full min-w-0 w-full flex-col rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
              Tjenesteabonnementer
            </span>
            <div className="relative shrink-0 flex items-start" ref={infoWrapRef}>
              <button
                type="button"
                onClick={() => setInfoOpen((o) => !o)}
                aria-expanded={infoOpen}
                aria-label="Mer om tjenesteabonnementer på oversikten"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <Info size={18} strokeWidth={2} aria-hidden />
              </button>
              {infoOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1.5 w-[min(calc(100vw-2rem),18rem)] max-w-[calc(100vw-2rem)] rounded-xl p-3 text-left shadow-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  role="region"
                >
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {INFO_TEXT}
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: 'var(--text)' }}>
            {formatNOK(totalNok)}
          </p>
          <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
            {periodLabel} · {uniqueCount} {countLabel} · total i perioden
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#7048E820' }}
          aria-hidden
        >
          <Repeat size={20} style={{ color: '#7048E8' }} />
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <p className="mb-2 shrink-0 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Kostnad per måned (månedlig ekvivalent)
        </p>
        {!hasAnyCost ? (
          <p
            className="flex min-h-[12rem] flex-1 items-center justify-center rounded-xl px-2 text-center text-sm"
            style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}
          >
            Ingen aktive tjenesteabonnementer i perioden.
          </p>
        ) : (
          <div className="min-h-[200px] w-full min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6B7A99', fontSize: 11 }}
                  interval={monthly.length > 8 ? 'preserveStartEnd' : 0}
                  angle={monthly.length > 6 ? -30 : 0}
                  textAnchor={monthly.length > 6 ? 'end' : 'middle'}
                  height={monthly.length > 6 ? 52 : 30}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)}
                  tick={{ fill: '#6B7A99', fontSize: 11 }}
                  width={44}
                />
                <Tooltip
                  formatter={(v) => formatNOK(v == null ? 0 : Number(v))}
                  labelFormatter={(label) => `Måned: ${label}`}
                />
                <Bar dataKey="kostnad" fill="#7048E8" radius={[4, 4, 0, 0]} name="Kostnad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
