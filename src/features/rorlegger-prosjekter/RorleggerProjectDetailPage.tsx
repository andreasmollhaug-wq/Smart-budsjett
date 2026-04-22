'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { formatIsoDateDdMmYyyy, formatNOK } from '@/lib/utils'
import { ArrowLeft, FileText, LandPlot, MapPin, Wallet, Wrench } from 'lucide-react'
import { getDemoProjectById } from './demoProjects'
import { projectUtilizationPercent } from './kpiUtils'
import { getFinancialView } from './rorleggerProjectFinancials'
import {
  ATTACHMENT_TYPE_LABELS,
  CONTRACT_LABELS,
  FINANCIAL_HEALTH_LABELS,
  REGION_LABELS,
  STATUS_LABELS,
} from './types'

const BASE = '/intern/rorlegger'

export default function RorleggerProjectDetailPage({ projectId }: { projectId: string }) {
  const p = useMemo(() => getDemoProjectById(projectId), [projectId])
  const financialView = useMemo(() => (p ? getFinancialView(p) : null), [p])
  if (!p) {
    return null
  }
  const pct = projectUtilizationPercent(p)
  const variance = p.actualNok - p.budgetNok

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title={p.name}
        subtitle={`${p.customerOrSite} · ${REGION_LABELS[p.region]}`}
      />
      <div className="min-w-0 mx-auto max-w-3xl space-y-6 py-4 sm:py-6 md:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={BASE}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Dashboard
          </Link>
          <Link
            href={`${BASE}/alle`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Alle prosjekter
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Status"
            value={STATUS_LABELS[p.status]}
            sub={CONTRACT_LABELS[p.contractType]}
            icon={Wrench}
            color="#4C6EF5"
          />
          <StatCard
            label="Ramme"
            value={formatNOK(p.budgetNok)}
            sub="Avtalt kostnadsramme (demo)"
            icon={Wallet}
            color="#0CA678"
            valueNoWrap
          />
          <StatCard
            label="Faktisert / avvik"
            value={formatNOK(p.actualNok)}
            sub={
              pct != null
                ? `${pct.toFixed(1)} % brukt · avvik ${variance >= 0 ? '+' : ''}${formatNOK(variance)}`
                : '—'
            }
            icon={MapPin}
            trend={variance <= 0 ? 'up' : 'down'}
            color={variance > 0 ? '#E03131' : '#40C057'}
            valueNoWrap
          />
        </div>

        {financialView && (
          <div
            className="space-y-4 rounded-2xl border p-4 sm:p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2
                className="flex items-center gap-2 text-sm font-semibold sm:text-base"
                style={{ color: 'var(--text)' }}
              >
                <LandPlot className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
                Finansiell status
              </h2>
              {financialView.mode === 'full' && (
                <span
                  className="w-fit rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {FINANCIAL_HEALTH_LABELS[financialView.detail.health]}
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {financialView.mode === 'full'
                ? 'Tallene nedenfor er fiktive pilotdata — ingen kobling til fakturering i Smart Budsjett.'
                : 'Overslag ut fra rammesum og faktisert (demodata). Fyll ut utvidet finans på prosjektet for detaljert visning.'}
            </p>

            {financialView.mode === 'full' ? (
              <>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Godkjent ramme', formatNOK(financialView.detail.approvedBudgetNok)],
                    ['Påløpt (bokført kost)', formatNOK(financialView.detail.accruedOrActualNok)],
                    ['Forpliktet (ordre)', formatNOK(financialView.detail.committedNok)],
                    [
                      'Engasjert (påløpt + forpliktet)',
                      formatNOK(financialView.engagedNok),
                    ],
                    ['Fakturert kunde hittil', formatNOK(financialView.detail.invoicedToDateNok)],
                    ['Utbetalt til leverandører hittil', formatNOK(financialView.detail.paidOutNok)],
                    [
                      'Gjenstående under ramme',
                      formatNOK(financialView.remainingUnderFrameNok),
                    ],
                    [
                      'Gjenstående udisponert reserve',
                      formatNOK(financialView.detail.contingencyRemainingNok),
                    ],
                    ['Prognose sluttkost (EAC)', formatNOK(financialView.detail.forecastAtCompletionNok)],
                    [
                      'Avvik prognose mot ramme',
                      `${financialView.varianceForecastNok >= 0 ? '+' : '−'}${formatNOK(Math.abs(financialView.varianceForecastNok))}`,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="flex min-h-10 flex-col justify-center gap-0.5 border-b border-dotted pb-2 last:border-0 sm:flex-row sm:items-baseline sm:justify-between"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <dt style={{ color: 'var(--text-muted)' }}>{label as string}</dt>
                      <dd
                        className="font-semibold tabular-nums sm:text-right"
                        style={{ color: 'var(--text)' }}
                      >
                        {value as string}
                      </dd>
                    </div>
                  ))}
                </dl>
                {financialView.engagedPercentOfFrame != null && (
                  <div>
                    <p className="mb-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Belastning av ramme (engasjert: påløpt + forpliktet)
                    </p>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full"
                      style={{ background: 'var(--bg)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, financialView.engagedPercentOfFrame)}%`,
                          background: 'var(--primary)',
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {financialView.engagedPercentOfFrame.toFixed(1)} % av godkjent ramme
                    </p>
                  </div>
                )}
                {financialView.detail.lines && financialView.detail.lines.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold sm:text-sm" style={{ color: 'var(--text)' }}>
                      Kostnadsfordeling
                    </h3>
                    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                      <table className="w-full min-w-[280px] border-collapse text-sm">
                        <thead>
                          <tr style={{ background: 'var(--bg)' }}>
                            <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                              Post
                            </th>
                            <th
                              className="px-2 py-2 text-right text-xs font-medium tabular-nums"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Ramme
                            </th>
                            <th
                              className="px-3 py-2 text-right text-xs font-medium tabular-nums"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Påløpt
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialView.detail.lines.map((row) => (
                            <tr
                              key={row.label}
                              className="border-t"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>
                                {row.label}
                              </td>
                              <td className="px-2 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                                {formatNOK(row.budgetNok)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                                {formatNOK(row.actualNok)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <dl className="space-y-2 text-sm">
                {[
                  ['Rammesum (budsjett)', formatNOK(financialView.budgetNok)],
                  ['Faktisert hittil', formatNOK(financialView.actualNok)],
                  [
                    'Gjenstående (ramme − faktisert, min. 0)',
                    formatNOK(financialView.remainingNok),
                  ],
                  [
                    'Brukt av ramme',
                    financialView.utilizationPercent != null
                      ? `${financialView.utilizationPercent.toFixed(1)} %`
                      : '—',
                  ],
                  [
                    'Avvik (faktisert − ramme)',
                    `${financialView.varianceNok >= 0 ? '+' : '−'}${formatNOK(Math.abs(financialView.varianceNok))}`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="flex min-h-10 flex-col justify-center gap-0.5 border-b border-dotted pb-2 last:border-0 sm:flex-row sm:items-baseline sm:justify-between"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <dt style={{ color: 'var(--text-muted)' }}>{label as string}</dt>
                    <dd className="font-medium tabular-nums sm:text-right" style={{ color: 'var(--text)' }}>
                      {value as string}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        <div
          className="space-y-3 rounded-2xl border p-4 sm:p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-semibold sm:text-base" style={{ color: 'var(--text)' }}>
            Prosjektdata
          </h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Region
              </dt>
              <dd style={{ color: 'var(--text)' }}>{REGION_LABELS[p.region]}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Kunde / anlegg
              </dt>
              <dd style={{ color: 'var(--text)' }}>{p.customerOrSite}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Periode
              </dt>
              <dd className="tabular-nums" style={{ color: 'var(--text)' }}>
                {formatIsoDateDdMmYyyy(p.startDate)}
                {p.endDate ? ` – ${formatIsoDateDdMmYyyy(p.endDate)}` : ''}
                {!p.endDate ? ' (ingen sluttdato satt i demo)' : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Kort oppsummert
              </dt>
              <dd className="leading-relaxed" style={{ color: 'var(--text)' }}>
                {p.summary}
              </dd>
            </div>
            {p.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Notater
                </dt>
                <dd className="mt-0.5 leading-relaxed" style={{ color: 'var(--text)' }}>
                  {p.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div
          className="space-y-3 rounded-2xl border p-4 sm:p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              className="flex items-center gap-2 text-sm font-semibold sm:text-base"
              style={{ color: 'var(--text)' }}
            >
              <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
              Dokumenter og vedlegg
            </h2>
            <span
              className="rounded-lg px-2 py-0.5 text-xs font-medium"
              style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
            >
              Kun demo
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Her vil kontrakt, endringsordre og andre filer kobles til prosjektet. Opplasting krever lagring (ikke
            inkludert i denne demoen).
          </p>
          {p.attachments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen vedlegg i demo.
            </p>
          ) : (
            <ul className="space-y-2">
              {p.attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex min-h-[44px] flex-col justify-center gap-0.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words" style={{ color: 'var(--text)' }}>
                      {a.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {ATTACHMENT_TYPE_LABELS[a.type]} · {formatIsoDateDdMmYyyy(a.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
