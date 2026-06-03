'use client'

import { useMemo, useState } from 'react'
import { CalendarRange, CreditCard, MailCheck, RefreshCw, TrendingUp, UserPlus } from 'lucide-react'
import type { AdminMetricsPayload } from '@/lib/admin/types'

function pct(n: number, d: number): string {
  if (d <= 0) return '—'
  return `${Math.round((n / d) * 1000) / 10} %`
}

function avgPerDay(total: number, days: number): string {
  if (days <= 0) return '0'
  const v = total / days
  return v % 1 === 0 ? String(v) : v.toFixed(1).replace('.', ',')
}

function MiniKpi({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 2px color-mix(in srgb, var(--text) 4%, transparent)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon size={18} strokeWidth={2.2} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </div>
  )
}

function cellTint(value: number, max: number, accent: string): React.CSSProperties | undefined {
  if (value <= 0 || max <= 0) return undefined
  const intensity = Math.min(1, value / max)
  const alpha = 0.06 + intensity * 0.14
  return { background: `color-mix(in srgb, ${accent} ${Math.round(alpha * 100)}%, transparent)` }
}

function MetricCell({
  value,
  max,
  accent,
}: {
  value: number
  max: number
  accent: string
}) {
  const tint = cellTint(value, max, accent)
  return (
    <td
      className="px-4 py-3 text-right tabular-nums"
      style={{
        color: value > 0 ? 'var(--text)' : 'var(--text-muted)',
        fontWeight: value > 0 ? 600 : 400,
        ...tint,
      }}
    >
      {value}
    </td>
  )
}

export default function AdminDailySection({
  daily,
  dailyTotals,
  onReload,
}: {
  daily: AdminMetricsPayload['daily']
  dailyTotals: AdminMetricsPayload['dailyTotals']
  onReload?: () => void | Promise<void>
}) {
  const [repairing, setRepairing] = useState(false)
  const [repairNote, setRepairNote] = useState<string | null>(null)

  async function repairCheckoutDates() {
    setRepairing(true)
    setRepairNote(null)
    try {
      const res = await fetch('/api/admin/repair-checkout-dates', { method: 'POST' })
      const body = (await res.json()) as { updated?: number; error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Reparasjon feilet')
      const n = body.updated ?? 0
      setRepairNote(
        n > 0
          ? `Checkout-datoer rettet fra Stripe (${n} rader). Oppdater tabellen hvis tallene ikke endret seg.`
          : `Ingen rader trengte reparasjon (0 endret). Tallene skal da stemme med Stripe allerede.`,
      )
      await onReload?.()
    } catch (e) {
      setRepairNote(e instanceof Error ? e.message : 'Kunne ikke reparere checkout-datoer.')
    } finally {
      setRepairing(false)
    }
  }

  const derived = useMemo(() => {
    const dayCount = daily.length || 30
    const bestRegDay = daily.reduce(
      (best, row) => (row.registrations > best.registrations ? row : best),
      daily[0] ?? { dayLabel: '—', registrations: 0 },
    )
    const last7 = daily.slice(0, 7)
    const last7Reg = last7.reduce((s, r) => s + r.registrations, 0)
    const last7Checkout = last7.reduce((s, r) => s + r.checkouts, 0)

    return {
      dayCount,
      bestRegDay,
      last7Reg,
      last7Checkout,
      avgReg: avgPerDay(dailyTotals.registrations, dayCount),
      avgConfirmed: avgPerDay(dailyTotals.confirmed, dayCount),
      avgCheckout: avgPerDay(dailyTotals.checkouts, dayCount),
      confirmRate: pct(dailyTotals.confirmed, dailyTotals.registrations),
      checkoutRate: pct(dailyTotals.checkouts, dailyTotals.confirmed),
    }
  }, [daily, dailyTotals])

  const maxReg = Math.max(1, ...daily.map((d) => d.registrations))
  const maxConfirmed = Math.max(1, ...daily.map((d) => d.confirmed))
  const maxCheckout = Math.max(1, ...daily.map((d) => d.checkouts))

  if (daily.length === 0) return null

  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">Dag for dag</h2>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          Siste {derived.dayCount} dager (Europe/Oslo) · i dag vises hittil · kolonnene teller uavhengige
          hendelser samme dag
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MiniKpi
          label="Registrert (30 d)"
          value={String(dailyTotals.registrations)}
          sub={`Ø ${derived.avgReg} / dag · beste: ${derived.bestRegDay.registrations} (${derived.bestRegDay.dayLabel})`}
          icon={UserPlus}
          accent="#3B5BDB"
        />
        <MiniKpi
          label="Bekreftet (30 d)"
          value={String(dailyTotals.confirmed)}
          sub={`Ø ${derived.avgConfirmed} / dag · ${derived.confirmRate} av registrert`}
          icon={MailCheck}
          accent="#099268"
        />
        <MiniKpi
          label="Checkout (30 d)"
          value={String(dailyTotals.checkouts)}
          sub={`Ø ${derived.avgCheckout} / dag · ${derived.checkoutRate} av bekreftet`}
          icon={CreditCard}
          accent="#7048E8"
        />
        <MiniKpi
          label="Siste 7 dager"
          value={`${derived.last7Reg} / ${derived.last7Checkout}`}
          sub="Registrert / checkout"
          icon={TrendingUp}
          accent="#E67700"
        />
      </div>

      <div
        className="min-w-0 overflow-hidden rounded-2xl"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 2px 8px color-mix(in srgb, var(--text) 5%, transparent)',
        }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-3 sm:px-5"
          style={{
            borderColor: 'var(--border)',
            background:
              'linear-gradient(90deg, color-mix(in srgb, var(--primary) 8%, var(--surface)) 0%, var(--surface) 100%)',
          }}
        >
          <CalendarRange size={18} style={{ color: 'var(--primary)' }} aria-hidden />
          <p className="text-sm font-medium">Daglig oversikt</p>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th
                  scope="col"
                  className="sticky left-0 z-10 px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider sm:px-5 sm:text-xs"
                  style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
                >
                  Dag
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-wider sm:text-xs"
                  style={{ color: '#3B5BDB' }}
                >
                  Registrert
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-wider sm:text-xs"
                  style={{ color: '#099268' }}
                >
                  Bekreftet
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-wider sm:px-5 sm:text-xs"
                  style={{ color: '#7048E8' }}
                >
                  Checkout
                </th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row, index) => {
                const zebra = index % 2 === 1 && !row.isToday
                return (
                  <tr
                    key={row.dateKey}
                    className="transition-colors"
                    style={{
                      borderBottom: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
                      background: row.isToday
                        ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                        : zebra
                          ? 'color-mix(in srgb, var(--text) 2%, var(--surface))'
                          : undefined,
                    }}
                  >
                    <td
                      className="sticky left-0 z-10 whitespace-nowrap px-4 py-3 sm:px-5"
                      style={{
                        background: row.isToday
                          ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                          : zebra
                            ? 'color-mix(in srgb, var(--text) 2%, var(--surface))'
                            : 'var(--surface)',
                        color: 'var(--text)',
                        fontWeight: row.isToday ? 600 : 500,
                      }}
                    >
                      <span className="capitalize">{row.dayLabel}</span>
                      {row.isToday ? (
                        <span
                          className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide sm:text-[0.65rem]"
                          style={{
                            background: 'var(--primary)',
                            color: '#fff',
                          }}
                        >
                          I dag
                        </span>
                      ) : null}
                    </td>
                    <MetricCell value={row.registrations} max={maxReg} accent="#3B5BDB" />
                    <MetricCell value={row.confirmed} max={maxConfirmed} accent="#099268" />
                    <MetricCell value={row.checkouts} max={maxCheckout} accent="#7048E8" />
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr
                style={{
                  background:
                    'linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, var(--bg)) 0%, var(--bg) 100%)',
                  borderTop: '2px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
                }}
              >
                <td
                  className="sticky left-0 z-10 px-4 py-3.5 text-sm font-semibold sm:px-5"
                  style={{
                    background:
                      'linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, var(--bg)) 0%, var(--bg) 100%)',
                  }}
                >
                  Sum ({derived.dayCount} dager)
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums" style={{ color: '#3B5BDB' }}>
                  {dailyTotals.registrations}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums" style={{ color: '#099268' }}>
                  {dailyTotals.confirmed}
                </td>
                <td
                  className="px-4 py-3.5 text-right text-sm font-bold tabular-nums sm:px-5"
                  style={{ color: '#7048E8' }}
                >
                  {dailyTotals.checkouts}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Checkout per dag bruker første checkout-tidspunkt. Eldre rader kan ha feil dato etter
          databackfill — bruk knappen for å hente riktig dato fra Stripe.
        </p>
        <button
          type="button"
          onClick={() => void repairCheckoutDates()}
          disabled={repairing}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium touch-manipulation disabled:opacity-60"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <RefreshCw size={16} className={repairing ? 'animate-spin' : undefined} aria-hidden />
          {repairing ? 'Synkroniserer…' : 'Synk checkout-datoer'}
        </button>
      </div>
      {repairNote ? (
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }} role="status">
          {repairNote}
        </p>
      ) : null}
    </section>
  )
}
