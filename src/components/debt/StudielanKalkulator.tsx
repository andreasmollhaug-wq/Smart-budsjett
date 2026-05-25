'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp, Minus, Plus, Banknote, PieChart, Receipt, GraduationCap } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import AnnuityScheduleTable from '@/components/debt/calculator/AnnuityScheduleTable'
import CalculatorCollapsibleSection from '@/components/debt/calculator/CalculatorCollapsibleSection'
import CalculatorExportBar from '@/components/debt/calculator/CalculatorExportBar'
import CalculatorRateYearsInputs from '@/components/debt/calculator/CalculatorRateYearsInputs'
import RateSensitivityPanel from '@/components/debt/calculator/RateSensitivityPanel'
import StudielanKalkulatorPdfDocument from '@/components/debt/calculator/StudielanKalkulatorPdfDocument'
import StudielanSaveToDebtModal from '@/components/debt/calculator/StudielanSaveToDebtModal'
import TermComparisonTable from '@/components/debt/calculator/TermComparisonTable'
import YearlyAmortizationTable from '@/components/debt/calculator/YearlyAmortizationTable'
import {
  CALCULATOR_CARD_STYLE,
  clampCalculator,
  formatRateNb,
  IconStepButton,
} from '@/components/debt/calculator/calculatorUiUtils'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import StatCard from '@/components/ui/StatCard'
import InfoPopover from '@/components/ui/InfoPopover'
import { exportCalculatorPdf } from '@/lib/exportCalculatorPdf'
import { exportStudielanKalkulatorExcel } from '@/lib/exportStudielanKalkulatorExcel'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { monthlyPaymentForNominalWithDelta } from '@/lib/mortgageCalculator'
import {
  DEFAULT_GRACE_MONTHS_BEFORE_PAYMENT,
  DEFAULT_STUDENT_LOAN_PRINCIPAL,
  DEFAULT_STUDENT_LOAN_RATE_PCT,
  DEFAULT_STUDENT_LOAN_YEARS,
  LANEKASSEN_ANNUAL_LOAN_CAP_2026,
  STUDENT_LOAN_GRANT_PCT_MAX,
  STUDENT_LOAN_GRANT_PCT_MIN,
  STUDENT_LOAN_PRINCIPAL_MAX,
  STUDENT_LOAN_PRINCIPAL_MIN,
  STUDENT_LOAN_PRINCIPAL_STEP,
  STUDENT_LOAN_RATE_MAX,
  STUDENT_LOAN_RATE_MIN,
  STUDENT_LOAN_STUDY_YEARS_MAX,
  STUDENT_LOAN_STUDY_YEARS_MIN,
  STUDENT_LOAN_YEARS_MIN,
  STUDENT_LOAN_MAX_YEARS,
} from '@/lib/studentLoanCalculator.constants'
import {
  budgetImpactPct,
  buildStudentLoanSchedule,
  compareRepaymentTerms,
  computeMonthlyBudgetTotals,
  estimatePrincipalFromStudy,
  estimateYearsFromPayment,
} from '@/lib/studentLoanCalculator'
import { useActivePersonFinance, useStore } from '@/lib/store'

export default function StudielanKalkulator() {
  const { formatNOK } = useNokDisplayFormatters()
  const budgetYear = useStore((s) => s.budgetYear)
  const monthIndex = useMemo(() => new Date().getMonth(), [])
  const { debts, isHouseholdAggregate, budgetCategories } = useActivePersonFinance()

  const [principal, setPrincipal] = useState(DEFAULT_STUDENT_LOAN_PRINCIPAL)
  const [nominalRate, setNominalRate] = useState(DEFAULT_STUDENT_LOAN_RATE_PCT)
  const [years, setYears] = useState(DEFAULT_STUDENT_LOAN_YEARS)
  const [graceMonths, setGraceMonths] = useState(DEFAULT_GRACE_MONTHS_BEFORE_PAYMENT)

  const [studyYears, setStudyYears] = useState(3)
  const [annualLoanAmount, setAnnualLoanAmount] = useState(LANEKASSEN_ANNUAL_LOAN_CAP_2026)
  const [grantConversionPct, setGrantConversionPct] = useState(30)
  const [useStudyEstimate, setUseStudyEstimate] = useState(false)

  const [studySectionOpen, setStudySectionOpen] = useState(false)
  const [repaymentSectionOpen, setRepaymentSectionOpen] = useState(true)
  const [lanekassenInfoOpen, setLanekassenInfoOpen] = useState(false)
  const [monthlyScheduleOpen, setMonthlyScheduleOpen] = useState(false)
  const [yearlyScheduleOpen, setYearlyScheduleOpen] = useState(true)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const pdfRef = useRef<HTMLDivElement>(null)

  const studentLoans = useMemo(
    () => debts.filter((d) => d.type === 'student_loan'),
    [debts],
  )

  const estimatedFromStudy = useMemo(
    () =>
      estimatePrincipalFromStudy({
        studyYears,
        annualLoanAmount,
        grantConversionPct,
      }),
    [studyYears, annualLoanAmount, grantConversionPct],
  )

  const displayPrincipal = useStudyEstimate ? estimatedFromStudy : principal

  const studySectionSummary = useMemo(
    () =>
      `${studyYears} år · ${formatNOK(annualLoanAmount)}/år · ${grantConversionPct} % stipend · estimat ${formatNOK(estimatedFromStudy)}`,
    [studyYears, annualLoanAmount, grantConversionPct, estimatedFromStudy, formatNOK],
  )

  const repaymentSectionSummary = useMemo(() => {
    const parts = [
      formatNOK(displayPrincipal),
      formatRateNb(nominalRate),
      `${years} år`,
    ]
    if (graceMonths > 0) parts.push(`${graceMonths} mnd før termin`)
    return parts.join(' · ')
  }, [displayPrincipal, nominalRate, years, graceMonths, formatNOK])

  const effectivePrincipal = displayPrincipal

  const result = useMemo(
    () =>
      buildStudentLoanSchedule({
        principal: effectivePrincipal,
        nominalAnnualRatePct: nominalRate,
        years,
        graceMonths,
      }),
    [effectivePrincipal, nominalRate, years, graceMonths],
  )

  const termComparison = useMemo(
    () => compareRepaymentTerms(result.principalAtRepaymentStart || effectivePrincipal, nominalRate, years),
    [result.principalAtRepaymentStart, effectivePrincipal, nominalRate, years],
  )

  const budgetTotals = useMemo(
    () => computeMonthlyBudgetTotals(budgetCategories, monthIndex),
    [budgetCategories, monthIndex],
  )

  const budgetImpact = useMemo(
    () => budgetImpactPct(result.monthlyPayment, budgetTotals),
    [result.monthlyPayment, budgetTotals],
  )

  const rateScenarios = useMemo(() => {
    const p = result.principalAtRepaymentStart || effectivePrincipal
    if (p <= 0) return []
    const deltas = [-1, 1, 2] as const
    return deltas.map((d) => {
      const m = monthlyPaymentForNominalWithDelta(p, nominalRate, years, d, STUDENT_LOAN_RATE_MIN, STUDENT_LOAN_RATE_MAX)
      return { delta: d, monthly: m, diff: m - result.monthlyPayment }
    })
  }, [result.principalAtRepaymentStart, effectivePrincipal, nominalRate, years, result.monthlyPayment])

  const applyStudyEstimate = useCallback(() => {
    setPrincipal(estimatedFromStudy)
    setUseStudyEstimate(false)
  }, [estimatedFromStudy])

  const loadFromDebt = useCallback(
    (debtId: string) => {
      const debt = studentLoans.find((d) => d.id === debtId)
      if (!debt) return
      setPrincipal(debt.remainingAmount)
      setNominalRate(debt.interestRate)
      const estYears = estimateYearsFromPayment(debt.remainingAmount, debt.interestRate, debt.monthlyPayment)
      if (estYears != null) setYears(estYears)
      setUseStudyEstimate(false)
    },
    [studentLoans],
  )

  const exportFilenameBase = `studielan-kalkulator-${budgetYear}-${String(monthIndex + 1).padStart(2, '0')}`

  const handleExportPdf = async () => {
    const el = pdfRef.current?.querySelector(`#calculator-pdf-print-root`) as HTMLElement | null
    if (!el) return
    setPdfLoading(true)
    try {
      await exportCalculatorPdf(el, `${exportFilenameBase}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setExcelLoading(true)
    try {
      await exportStudielanKalkulatorExcel(
        {
          principal: effectivePrincipal,
          nominalRatePct: nominalRate,
          years,
          graceMonths,
          studyYears,
          annualLoanAmount,
          grantConversionPct,
          result,
          termComparison,
          budgetImpact,
        },
        `${exportFilenameBase}.xlsx`,
      )
    } finally {
      setExcelLoading(false)
    }
  }

  const readOnly = isHouseholdAggregate

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full break-words">
      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={CALCULATOR_CARD_STYLE}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Studielånskalkulator
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Beregn månedlig betaling og rentekostnader for studielån fra Lånekassen. Forenklet annuitetsmodell — sjekk
            gjeldende rente på{' '}
            <a
              href="https://www.lanekassen.no"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--primary)' }}
            >
              lanekassen.no
            </a>
            .
          </p>
        </div>

        {!readOnly && studentLoans.length > 0 && (
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Hent fra gjeld
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) loadFromDebt(e.target.value)
                e.target.value = ''
              }}
              className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm touch-manipulation"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              <option value="">Velg registrert studielån …</option>
              {studentLoans.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {formatNOK(d.remainingAmount)}
                </option>
              ))}
            </select>
          </div>
        )}

        <CalculatorCollapsibleSection
          title="Bygg opp fra studier"
          titleIcon={<GraduationCap className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />}
          subtitle="Valgfritt — estimer restgjeld fra studieår, lån per år og stipend."
          summary={studySectionSummary}
          info={{
            title: 'Estimer restgjeld',
            text: 'Antall studieår ganger lån per år, minus forventet stipend-omgjøring. Deler av basislånet kan omgjøres til stipend ved normert studieprogresjon og inntektsgrenser hos Lånekassen.',
          }}
          open={studySectionOpen}
          onToggle={() => setStudySectionOpen((o) => !o)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Studieår
              </label>
              <input
                type="number"
                min={STUDENT_LOAN_STUDY_YEARS_MIN}
                max={STUDENT_LOAN_STUDY_YEARS_MAX}
                value={studyYears}
                onChange={(e) =>
                  setStudyYears(
                    clampCalculator(Number(e.target.value), STUDENT_LOAN_STUDY_YEARS_MIN, STUDENT_LOAN_STUDY_YEARS_MAX),
                  )
                }
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm tabular-nums"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Lån per år
              </label>
              <FormattedAmountInput
                value={annualLoanAmount}
                onChange={setAnnualLoanAmount}
                aria-label="Lån per studieår"
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Stipend-omgjøring (%)
              </label>
              <input
                type="number"
                min={STUDENT_LOAN_GRANT_PCT_MIN}
                max={STUDENT_LOAN_GRANT_PCT_MAX}
                value={grantConversionPct}
                onChange={(e) =>
                  setGrantConversionPct(
                    clampCalculator(Number(e.target.value), STUDENT_LOAN_GRANT_PCT_MIN, STUDENT_LOAN_GRANT_PCT_MAX),
                  )
                }
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm tabular-nums"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Estimert restgjeld:{' '}
            <strong style={{ color: 'var(--text)' }}>{formatNOK(estimatedFromStudy)}</strong>
          </p>
          <button
            type="button"
            onClick={applyStudyEstimate}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation border"
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-pale)' }}
          >
            Bruk estimat som restgjeld
          </button>
        </CalculatorCollapsibleSection>

        <CalculatorCollapsibleSection
          title="Restgjeld ved oppstart av tilbakebetaling"
          subtitle="Beløp, rente, nedbetalingstid og periode før første termin."
          summary={repaymentSectionSummary}
          open={repaymentSectionOpen}
          onToggle={() => setRepaymentSectionOpen((o) => !o)}
          variant="plain"
        >
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Totalt lånebeløp
            </span>
            <div className="flex flex-col gap-3 min-w-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
                <IconStepButton
                  label="Trekk fra beløp"
                  disabled={principal <= STUDENT_LOAN_PRINCIPAL_MIN}
                  onClick={() =>
                    setPrincipal((v) =>
                      clampCalculator(v - STUDENT_LOAN_PRINCIPAL_STEP, STUDENT_LOAN_PRINCIPAL_MIN, STUDENT_LOAN_PRINCIPAL_MAX),
                    )
                  }
                >
                  <Minus className="h-4 w-4" />
                </IconStepButton>
                <input
                  type="range"
                  className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content"
                  style={{ accentColor: 'var(--primary)' }}
                  min={STUDENT_LOAN_PRINCIPAL_MIN}
                  max={STUDENT_LOAN_PRINCIPAL_MAX}
                  step={STUDENT_LOAN_PRINCIPAL_STEP}
                  value={displayPrincipal}
                  onChange={(e) => {
                    setUseStudyEstimate(false)
                    setPrincipal(Number(e.target.value))
                  }}
                  aria-valuetext={formatNOK(displayPrincipal)}
                />
                <IconStepButton
                  label="Legg til beløp"
                  disabled={principal >= STUDENT_LOAN_PRINCIPAL_MAX}
                  onClick={() =>
                    setPrincipal((v) =>
                      clampCalculator(v + STUDENT_LOAN_PRINCIPAL_STEP, STUDENT_LOAN_PRINCIPAL_MIN, STUDENT_LOAN_PRINCIPAL_MAX),
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                </IconStepButton>
              </div>
              <FormattedAmountInput
                value={displayPrincipal}
                onChange={(n) => {
                  setUseStudyEstimate(false)
                  setPrincipal(clampCalculator(n, STUDENT_LOAN_PRINCIPAL_MIN, STUDENT_LOAN_PRINCIPAL_MAX))
                }}
                aria-label="Totalt lånebeløp i kroner"
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm"
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Heltidsstudenter kan låne ca. {LANEKASSEN_ANNUAL_LOAN_CAP_2026.toLocaleString('nb-NO')} kr/år (referanse 2026).
            </p>
          </div>

          <CalculatorRateYearsInputs
            nominalRate={nominalRate}
            onNominalRateChange={setNominalRate}
            years={years}
            onYearsChange={setYears}
            rateMin={STUDENT_LOAN_RATE_MIN}
            rateMax={STUDENT_LOAN_RATE_MAX}
            yearsMin={STUDENT_LOAN_YEARS_MIN}
            yearsMax={STUDENT_LOAN_MAX_YEARS}
            rateLabel="Rente per år"
          />

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Måneder rente uten betaling før første termin
              </span>
              <InfoPopover
                title="Før første faktura"
                text="Renter begynner å løpe etter endt støtteperiode. Betalingsplan kommer ca. 5 måneder etter studiene, første faktura ca. 7 måneder etter. I denne modellen kapitaliseres renter i denne perioden inn i hovedstolen før annuitet starter."
              />
            </div>
            <input
              type="number"
              min={0}
              max={24}
              value={graceMonths}
              onChange={(e) => setGraceMonths(clampCalculator(Number(e.target.value), 0, 24))}
              className="w-full max-w-[12rem] min-h-[44px] rounded-xl px-3 py-2 text-sm tabular-nums"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
        </CalculatorCollapsibleSection>

        <CalculatorCollapsibleSection
          title="Om Lånekassen og tilbakebetaling"
          summary="Flytende rente, rentefri studietid, utsettelse og nedbetalingstid"
          open={lanekassenInfoOpen}
          onToggle={() => setLanekassenInfoOpen((o) => !o)}
          variant="plain"
        >
          <div className="text-xs leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
            <p>
              <strong style={{ color: 'var(--text)' }}>Flytende rente</strong> endres annenhver måned hos Lånekassen. Fast rente
              kan søkes for 3, 5 eller 10 år. Lånet er rentefritt under fulltidsstøtte.
            </p>
            <p>
              Du kan utsette betaling inntil 36 ganger (3 år) i løpet av nedbetalingsperioden — det modelleres ikke her.
              Nedbetalingstid opptil 20 år (240 terminer).
            </p>
          </div>
        </CalculatorCollapsibleSection>
      </div>

      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={CALCULATOR_CARD_STYLE}>
        <CalculatorExportBar
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          pdfLoading={pdfLoading}
          excelLoading={excelLoading}
          disabled={effectivePrincipal <= 0}
        />

        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Månedlig betaling
          </p>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl min-[400px]:text-3xl sm:text-4xl font-bold tabular-nums mt-1">
            <span style={{ color: 'var(--text)' }}>{formatNOK(effectivePrincipal > 0 ? result.monthlyPayment : 0)}</span>
            <span className="text-base min-[400px]:text-lg sm:text-xl font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
              pr. md.
            </span>
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {formatRateNb(nominalRate)} nominell ·{' '}
            {result.effectiveAnnualRatePct.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            % effektiv årsrente
            {result.graceInterestCapitalized > 0 && (
              <> · {formatNOK(result.graceInterestCapitalized)} kapitalisert rente før termin</>
            )}
          </p>
        </div>

        {(budgetImpact.expensePct != null || budgetImpact.incomePct != null) && effectivePrincipal > 0 && (
          <div
            className="rounded-xl px-4 py-3 text-sm space-y-1"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="font-medium" style={{ color: 'var(--text)' }}>
              Budsjettkontekst ({budgetYear})
            </p>
            {budgetImpact.expensePct != null && (
              <p style={{ color: 'var(--text-muted)' }}>
                Utgjør {budgetImpact.expensePct.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} % av budsjetterte
                utgifter denne måneden
              </p>
            )}
            {budgetImpact.incomePct != null && budgetTotals.monthlyNetIncome > 0 && (
              <p style={{ color: 'var(--text-muted)' }}>
                Utgjør {budgetImpact.incomePct.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} % av netto
                budsjettert inntekt
              </p>
            )}
          </div>
        )}

        <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Nøkkeltall
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <StatCard
              label="Renter totalt"
              value={effectivePrincipal > 0 ? formatNOK(result.totalInterest) : '—'}
              sub="Hele løpetiden"
              icon={Banknote}
              color="#F08C00"
              valueNoWrap
            />
            <StatCard
              label="Total tilbakebetaling"
              value={effectivePrincipal > 0 ? formatNOK(result.totalPaid) : '—'}
              sub={`Inkl. hovedstol, ${years} år`}
              icon={Receipt}
              color="#0CA678"
              valueNoWrap
            />
            <StatCard
              label="Første år til renter"
              value={
                effectivePrincipal > 0
                  ? `${result.firstYearInterestSharePct.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} %`
                  : '—'
              }
              sub="Andel av de første 12 terminene"
              icon={PieChart}
              color="#7950F2"
            />
            <StatCard
              label="Hovedstol ved termin 1"
              value={effectivePrincipal > 0 ? formatNOK(result.principalAtRepaymentStart) : '—'}
              sub="Etter eventuell grace-periode"
              icon={GraduationCap}
              color="#5C7CFA"
              valueNoWrap
            />
          </div>
        </div>

        {effectivePrincipal > 0 && (
          <>
            <TermComparisonTable rows={termComparison} selectedYears={years} />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setYearlyScheduleOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-4 rounded-xl text-sm font-medium touch-manipulation border"
                style={{ borderColor: 'var(--border)', background: 'var(--primary-pale)', color: 'var(--primary)' }}
                aria-expanded={yearlyScheduleOpen}
              >
                {yearlyScheduleOpen ? 'Skjul årlig plan' : 'Vis amortiseringsplan per år'}
                {yearlyScheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {yearlyScheduleOpen && <YearlyAmortizationTable rows={result.yearlySchedule} />}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMonthlyScheduleOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-4 rounded-xl text-sm font-medium touch-manipulation border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                aria-expanded={monthlyScheduleOpen}
              >
                {monthlyScheduleOpen ? 'Skjul månedlig plan' : 'Vis nedbetalingsplan per måned'}
                {monthlyScheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {monthlyScheduleOpen && <AnnuityScheduleTable rows={result.schedule} />}
            </div>

            <RateSensitivityPanel
              scenarios={rateScenarios}
              disclaimer="Indikativ. Lånekassens flytende rente endres regelmessig — sjekk lanekassen.no for gjeldende rente."
            />
          </>
        )}

        {!readOnly && effectivePrincipal > 0 && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className="min-h-[44px] flex-1 px-4 py-2 rounded-xl text-sm font-medium touch-manipulation"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Lagre til gjeld
            </button>
            <Link
              href="/snoball"
              className="min-h-[44px] flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium touch-manipulation border text-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Se i snøball
            </Link>
            <Link
              href="/gjeld"
              className="min-h-[44px] flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium touch-manipulation border text-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Gå til gjeld
            </Link>
          </div>
        )}
      </div>

      <div className="text-xs px-1 leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
        <p>
          Forenklet annuitetsmodell uten gebyrer og uten simulering av utsettelse. Faktisk rente og avtale hos Lånekassen
          gjelder alltid. Dette er ikke finans- eller skatteråd.
        </p>
      </div>

      <div ref={pdfRef}>
        {effectivePrincipal > 0 && (
          <StudielanKalkulatorPdfDocument
            title="Studielånskalkulator — Dottir"
            principal={effectivePrincipal}
            nominalRatePct={nominalRate}
            years={years}
            graceMonths={graceMonths}
            studyYears={studyYears}
            annualLoanAmount={annualLoanAmount}
            grantConversionPct={grantConversionPct}
            estimatedFromStudy={estimatedFromStudy}
            result={result}
            termComparison={termComparison}
            budgetExpensePct={budgetImpact.expensePct}
            budgetIncomePct={budgetImpact.incomePct}
          />
        )}
      </div>

      <StudielanSaveToDebtModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        initial={{
          name: 'Studielån',
          remainingAmount: result.principalAtRepaymentStart || effectivePrincipal,
          interestRate: nominalRate,
          monthlyPayment: result.monthlyPayment,
        }}
        existingStudentLoans={studentLoans}
      />
    </div>
  )
}
