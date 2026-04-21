'use client'

import { forwardRef } from 'react'
import {
  REPORT_GROUP_LABELS,
  REPORT_GROUP_ORDER,
  type BudgetVsActualRow,
  debtTypeLabel,
  investmentTypeLabel,
  type BankReportIncomeDetail,
  type BankReportKpis,
} from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { Debt, Investment, SavingsGoal } from '@/lib/store'
import { calcProgress, formatNOK, formatPercent } from '@/lib/utils'

const MONTHS_FULL = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export type BankReportSectionKey =
  | 'summary'
  | 'debts'
  | 'savings'
  | 'investments'
  | 'budgetVs'
  | 'freeText'
  | 'rolling3m'

const DEFAULT_SECTIONS: Record<BankReportSectionKey, boolean> = {
  summary: true,
  debts: true,
  savings: true,
  investments: true,
  budgetVs: true,
  freeText: true,
  rolling3m: true,
}

export interface BankReportDocumentProps {
  generatedAt: Date
  year: number
  monthIndex: number
  scopeLabel: string
  kpis: BankReportKpis
  debts: Debt[]
  savingsGoals: SavingsGoal[]
  investments: Investment[]
  budgetVsByParent: Record<ParentCategory, BudgetVsActualRow[]>
  /** Hvilke blokker som vises i PDF/utskrift. */
  sections?: Partial<Record<BankReportSectionKey, boolean>>
  /** Valgfri fritekst til saksbehandler. */
  freeTextSituation?: string
  freeTextPurpose?: string
  /** Tre måneder bakover fra valgt måned (transaksjoner). */
  rolling3m?: { income: number; expense: number; net: number } | null
  /** Brutto / forenklet trekk / netto for valgt måned når relevant. */
  incomeDetail?: BankReportIncomeDetail | null
}

const tableClass =
  'w-full text-sm border-collapse'
const thClass = 'text-left py-2 px-3 font-semibold border-b'
const tdClass = 'py-2 px-3 border-b'
const sectionTitle = 'text-lg font-bold mt-8 mb-3'
const cardGrid = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6'

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}

const BankReportDocument = forwardRef<HTMLDivElement, BankReportDocumentProps>(
  function BankReportDocument(
    {
      generatedAt,
      year,
      monthIndex,
      scopeLabel,
      kpis,
      debts,
      savingsGoals,
      investments,
      budgetVsByParent,
      sections: sectionsProp,
      freeTextSituation,
      freeTextPurpose,
      rolling3m,
      incomeDetail = null,
    },
    ref,
  ) {
    const sec = { ...DEFAULT_SECTIONS, ...sectionsProp }
    const periodLabel = `${MONTHS_FULL[monthIndex]} ${year}`
    const dateStr = generatedAt.toLocaleString('nb-NO', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    const invGain = kpis.totalInvestmentsValue - kpis.totalInvestmentsCost
    const invGainPct =
      kpis.totalInvestmentsCost > 0
        ? ((kpis.totalInvestmentsValue - kpis.totalInvestmentsCost) / kpis.totalInvestmentsCost) * 100
        : 0

    return (
      <div
        ref={ref}
        className="bank-report-document rounded-2xl p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 max-w-4xl mx-auto min-w-0"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <header className="border-b pb-6 mb-6" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
            Rapport til bank
          </p>
          <h2 className="text-2xl font-bold mt-1">Økonomisk oversikt</h2>
          <div className="mt-3 text-sm space-y-1" style={{ color: 'var(--text-muted)' }}>
            <p>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Periode:
              </span>{' '}
              {periodLabel}
            </p>
            <p>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Omfang:
              </span>{' '}
              {scopeLabel}
            </p>
            <p>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Generert:
              </span>{' '}
              {dateStr}
            </p>
          </div>
        </header>

        {sec.freeText && (freeTextSituation?.trim() || freeTextPurpose?.trim()) ? (
          <section className="mb-6">
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Merknad til saksbehandler
            </h3>
            {freeTextSituation?.trim() ? (
              <p className="text-sm whitespace-pre-wrap mb-2" style={{ color: 'var(--text)' }}>
                <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                  Situasjon:{' '}
                </span>
                {freeTextSituation.trim()}
              </p>
            ) : null}
            {freeTextPurpose?.trim() ? (
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                  Formål:{' '}
                </span>
                {freeTextPurpose.trim()}
              </p>
            ) : null}
          </section>
        ) : null}

        {sec.rolling3m && rolling3m != null ? (
          <section className="mb-6">
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Tre måneder (transaksjoner)
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              Summert inntekt og utgift for tre hele måneder bakover fra valgt måned (inkludert valgt måned).
            </p>
            <div className={cardGrid}>
              <KpiCard label="Inntekt (3 mnd)" value={formatNOK(rolling3m.income)} />
              <KpiCard label="Utgift (3 mnd)" value={formatNOK(rolling3m.expense)} />
              <KpiCard label="Netto (3 mnd)" value={formatNOK(rolling3m.net)} />
            </div>
            {incomeDetail ? (
              <p className="text-xs mt-3 leading-relaxed max-w-prose" style={{ color: 'var(--text-muted)' }}>
                Inntekt i tre-månedersvinduet er summert som <strong>netto</strong> der du har forenklet trekk eller
                brutto-inntektstransaksjoner — samme prinsipp som i tabellen «Inntekt: brutto og forenklet trekk»
                under.
              </p>
            ) : null}
          </section>
        ) : null}

        {incomeDetail != null && (sec.summary || sec.budgetVs || sec.rolling3m) ? (
          <section className="mb-6">
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Inntekt: brutto og forenklet trekk ({periodLabel})
            </h3>
            <div
              className="rounded-xl p-4 text-sm space-y-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Basert på innstillingene i Smart Budsjett (forenklet modell, ikke offisiell skatteberegning). Kolonnene
                «Budsjett» og «Faktisk» under Inntekter bruker <strong>netto</strong> slik at avvik sammenlignes med
                utbetalt beløp fra bank der transaksjonene er netto.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Budsjett (måned)
                  </p>
                  <p>Brutto: {formatNOK(incomeDetail.budgeted.gross)}</p>
                  <p>Forenklet trekk: {formatNOK(incomeDetail.budgeted.withholding)}</p>
                  <p className="font-medium">Netto: {formatNOK(incomeDetail.budgeted.net)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Faktisk (måned)
                  </p>
                  <p>Brutto: {formatNOK(incomeDetail.actual.gross)}</p>
                  <p>Forenklet trekk: {formatNOK(incomeDetail.actual.withholding)}</p>
                  <p className="font-medium">Netto: {formatNOK(incomeDetail.actual.net)}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {sec.summary ? (
          <section>
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Sammendrag
            </h3>
            <div className={cardGrid}>
              <KpiCard label="Netto denne måneden (transaksjoner)" value={formatNOK(kpis.netCashflowMonth)} />
              <KpiCard label="Samlet restgjeld" value={formatNOK(kpis.totalDebtRemaining)} />
              <KpiCard
                label="Samlet månedlig gjeldsbetaling"
                value={formatNOK(kpis.totalMonthlyDebtPayments)}
              />
              <KpiCard label="Investeringer (verdi)" value={formatNOK(kpis.totalInvestmentsValue)} />
              <KpiCard
                label="Sparing mot mål (spart / mål)"
                value={
                  kpis.savingsGoalsCount === 0
                    ? '—'
                    : `${formatNOK(kpis.savingsGoalsTotalCurrent)} / ${formatNOK(kpis.savingsGoalsTotalTarget)}`
                }
              />
            </div>
          </section>
        ) : null}

        {sec.debts ? (
          <section>
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Gjeld
            </h3>
          {debts.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen gjeld registrert.
            </p>
          ) : (
            <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                    Navn
                  </th>
                  <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                    Type
                  </th>
                  <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                    Restgjeld
                  </th>
                  <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                    Rente %
                  </th>
                  <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                    Mnd. betaling
                  </th>
                  <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                    Pause til
                  </th>
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr key={d.id}>
                    <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                      {d.name}
                      {d.repaymentPaused ? ' (avdrag pauset)' : ''}
                    </td>
                    <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                      {debtTypeLabel(d.type)}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                      {formatNOK(d.remainingAmount)}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                      {d.interestRate.toFixed(2)}%
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                      {d.repaymentPaused ? '—' : formatNOK(d.monthlyPayment)}
                    </td>
                    <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                      {d.repaymentPaused && d.pauseEndDate ? d.pauseEndDate : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        ) : null}

        {sec.savings ? (
          <section>
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Sparing
            </h3>
          {savingsGoals.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen sparemål registrert.
            </p>
          ) : (
            <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                    Mål
                  </th>
                  <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                    Spart
                  </th>
                  <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                    Målbeløp
                  </th>
                  <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                    Fremdrift
                  </th>
                </tr>
              </thead>
              <tbody>
                {savingsGoals.map((g) => (
                  <tr key={g.id}>
                    <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                      {g.name}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                      {formatNOK(g.currentAmount)}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                      {formatNOK(g.targetAmount)}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                      {formatPercent(calcProgress(g.currentAmount, g.targetAmount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        ) : null}

        {sec.investments ? (
          <section>
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Investeringer
            </h3>
          {investments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen investeringer registrert.
            </p>
          ) : (
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                Samlet avkastning: {formatNOK(invGain)} ({formatPercent(invGainPct)})
              </p>
              <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                      Navn
                    </th>
                    <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                      Type
                    </th>
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Innkjøp
                    </th>
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Verdi nå
                    </th>
                    <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                      Avkastning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((i) => {
                    const gain = i.currentValue - i.purchaseValue
                    const gainPct = i.purchaseValue > 0 ? (gain / i.purchaseValue) * 100 : 0
                    return (
                      <tr key={i.id}>
                        <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                          {i.name}
                        </td>
                        <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                          {investmentTypeLabel(i.type)}
                        </td>
                        <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(i.purchaseValue)}
                        </td>
                        <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(i.currentValue)}
                        </td>
                        <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(gain)} ({formatPercent(gainPct)})
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
        </section>
        ) : null}

        {sec.budgetVs ? (
          <section>
            <h3 className={sectionTitle} style={{ color: 'var(--text)' }}>
              Budsjett vs faktisk
            </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Faktiske beløp er summert fra transaksjoner i valgt måned. Avvik = faktisk minus budsjettert.
          </p>
          {REPORT_GROUP_ORDER.map((group) => {
            const rows = budgetVsByParent[group]
            if (!rows.length) return null
            return (
              <div key={group} className="mb-6">
                <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  {REPORT_GROUP_LABELS[group]}
                </h4>
                {group === 'inntekter' && incomeDetail ? (
                  <p className="text-xs mb-2 leading-relaxed max-w-prose" style={{ color: 'var(--text-muted)' }}>
                    Budsjett-kolonnen viser <strong>netto</strong> når trekk er aktivert på linjen. Se også seksjonen
                    «Inntekt: brutto og forenklet trekk» over for full oppdeling for måneden.
                  </p>
                ) : null}
                <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                        Kategori
                      </th>
                      <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                        Budsjett
                      </th>
                      <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                        Faktisk
                      </th>
                      <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                        Avvik
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.categoryId}>
                        <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                          {r.name}
                        </td>
                        <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(r.budgeted)}
                        </td>
                        <td className={`${tdClass} text-right tabular-nums`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(r.actual)}
                        </td>
                        <td
                          className={`${tdClass} text-right tabular-nums font-medium`}
                          style={{
                            borderColor: 'var(--border)',
                            color:
                              r.variance === 0
                                ? 'var(--text-muted)'
                                : r.type === 'expense' && r.variance > 0
                                  ? 'var(--danger)'
                                  : r.type === 'income' && r.variance < 0
                                    ? 'var(--danger)'
                                    : 'var(--success)',
                          }}
                        >
                          {r.variance > 0 ? '+' : ''}
                          {formatNOK(r.variance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </section>
        ) : null}

        <footer className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p>
            Tallene i denne rapporten bygger på opplysninger du har registrert i Smart Budsjett. De er ment som
            oversikt og er ikke juridisk eller regnskapsmessig dokumentasjon.
          </p>
        </footer>
      </div>
    )
  },
)

export default BankReportDocument
