'use client'

import { ChevronDown, ChevronUp, Home, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AnnuityScheduleTable from '@/components/debt/calculator/AnnuityScheduleTable'
import CalculatorRateYearsInputs from '@/components/debt/calculator/CalculatorRateYearsInputs'
import RateSensitivityPanel from '@/components/debt/calculator/RateSensitivityPanel'
import { CALCULATOR_CARD_STYLE, clampCalculator, formatRateNb, IconStepButton } from '@/components/debt/calculator/calculatorUiUtils'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import StatCard from '@/components/ui/StatCard'
import InfoPopover from '@/components/ui/InfoPopover'
import {
  annuityMonthlyPayment,
  buildAmortizationSchedule,
  effectiveAnnualRateFromNominalMonthly,
  equityRequired,
  firstYearInterestShareOfPayments,
  loanToValuePct,
  monthlyPaymentForNominalWithDelta,
  sumScheduleInterest,
  sumSchedulePayments,
} from '@/lib/mortgageCalculator'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { Banknote, PieChart, Receipt } from 'lucide-react'

const MAX_LTV = 0.9
const REFERENCE_LTV = 0.85

const PROPERTY_MIN = 500_000
const PROPERTY_MAX = 30_000_000
const PROPERTY_STEP = 50_000

const RATE_MIN = 0
const RATE_MAX = 15

const YEARS_MIN = 1
const YEARS_MAX = 35

const LOAN_STEP = 50_000

export default function BoliglanKalkulator() {
  const { formatNOK } = useNokDisplayFormatters()
  const [propertyPrice, setPropertyPrice] = useState(6_000_000)
  const [nominalRate, setNominalRate] = useState(4.79)
  const [years, setYears] = useState(30)
  const [loanAmount, setLoanAmount] = useState(4_500_000)

  const maxLoan = useMemo(() => Math.floor(propertyPrice * MAX_LTV), [propertyPrice])

  useEffect(() => {
    setLoanAmount((prev) => clampCalculator(prev, 0, maxLoan))
  }, [maxLoan])

  const ltvPct = useMemo(() => loanToValuePct(loanAmount, propertyPrice), [loanAmount, propertyPrice])

  const monthlyPayment = useMemo(
    () => annuityMonthlyPayment(loanAmount, nominalRate, years),
    [loanAmount, nominalRate, years],
  )

  const effRate = useMemo(() => effectiveAnnualRateFromNominalMonthly(nominalRate), [nominalRate])

  const equity = useMemo(() => equityRequired(propertyPrice, loanAmount), [propertyPrice, loanAmount])

  const schedule = useMemo(
    () => buildAmortizationSchedule(loanAmount, nominalRate, years, monthlyPayment),
    [loanAmount, nominalRate, years, monthlyPayment],
  )

  const totalPaid = useMemo(() => sumSchedulePayments(schedule), [schedule])
  const totalInterest = useMemo(() => sumScheduleInterest(schedule), [schedule])
  const firstYearInterestShare = useMemo(() => firstYearInterestShareOfPayments(schedule), [schedule])

  const rateScenarios = useMemo(() => {
    if (loanAmount <= 0) return [] as { delta: number; monthly: number; diff: number }[]
    const deltas = [-1, 1, 2] as const
    return deltas.map((d) => {
      const m = monthlyPaymentForNominalWithDelta(loanAmount, nominalRate, years, d, RATE_MIN, RATE_MAX)
      return { delta: d, monthly: m, diff: m - (loanAmount > 0 ? monthlyPayment : 0) }
    })
  }, [loanAmount, nominalRate, years, monthlyPayment])

  const [scheduleOpen, setScheduleOpen] = useState(false)

  const loanSliderPct = maxLoan > 0 ? (loanAmount / maxLoan) * 100 : 0
  const ltvLabelLeftPct = clampCalculator(loanSliderPct, 12, 88)

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full break-words">
      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={CALCULATOR_CARD_STYLE}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Boliglånskalkulator
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Regn ut omtrentlig månedlig kostnad og se nedbetalingsplan. Forenklet modell — ikke tilbud fra bank.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Boligens pris
            </span>
            <div className="flex flex-col gap-3 min-w-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
                <IconStepButton
                  label="Trekk fra 50 000 kr"
                  disabled={propertyPrice <= PROPERTY_MIN}
                  onClick={() => setPropertyPrice((v) => clampCalculator(v - PROPERTY_STEP, PROPERTY_MIN, PROPERTY_MAX))}
                >
                  <Minus className="h-4 w-4" />
                </IconStepButton>
                <input
                  type="range"
                  className="w-full min-w-0 min-h-[44px] h-2 sm:h-2 touch-manipulation self-stretch py-3 box-content"
                  style={{ accentColor: 'var(--primary)' }}
                  min={PROPERTY_MIN}
                  max={PROPERTY_MAX}
                  step={PROPERTY_STEP}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  aria-valuetext={formatNOK(propertyPrice)}
                />
                <IconStepButton
                  label="Legg til 50 000 kr"
                  disabled={propertyPrice >= PROPERTY_MAX}
                  onClick={() => setPropertyPrice((v) => clampCalculator(v + PROPERTY_STEP, PROPERTY_MIN, PROPERTY_MAX))}
                >
                  <Plus className="h-4 w-4" />
                </IconStepButton>
              </div>
              <FormattedAmountInput
                value={propertyPrice}
                onChange={(n) => setPropertyPrice(clampCalculator(n, PROPERTY_MIN, PROPERTY_MAX))}
                aria-label="Boligens pris i kroner"
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm"
              />
            </div>
          </div>

          <CalculatorRateYearsInputs
            nominalRate={nominalRate}
            onNominalRateChange={setNominalRate}
            years={years}
            onYearsChange={setYears}
            rateMin={RATE_MIN}
            rateMax={RATE_MAX}
            yearsMin={YEARS_MIN}
            yearsMax={YEARS_MAX}
          />

          <div className="pt-2 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Når boligens pris, rente og løpetid er satt, justerer du lånebeløpet under.
            </p>
            <div className="flex flex-col gap-2 min-w-0">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Ønsket lånebeløp
              </span>
              <div className="relative pt-6">
                <div
                  className="absolute top-0 text-xs font-medium tabular-nums pointer-events-none -translate-x-1/2 max-w-[90vw] text-center transition-all duration-200"
                  style={{ left: `${ltvLabelLeftPct}%`, color: 'var(--text)' }}
                >
                  {ltvPct.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} % LTV
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
                    <IconStepButton
                      label="Trekk fra lån"
                      disabled={loanAmount <= 0}
                      onClick={() => setLoanAmount((v) => clampCalculator(v - LOAN_STEP, 0, maxLoan))}
                    >
                      <Minus className="h-4 w-4" />
                    </IconStepButton>
                    <input
                      type="range"
                      className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content transition-all duration-150"
                      style={{ accentColor: 'var(--primary)' }}
                      min={0}
                      max={maxLoan}
                      step={LOAN_STEP}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      aria-valuetext={formatNOK(loanAmount)}
                    />
                    <IconStepButton
                      label="Legg til lån"
                      disabled={loanAmount >= maxLoan}
                      onClick={() => setLoanAmount((v) => clampCalculator(v + LOAN_STEP, 0, maxLoan))}
                    >
                      <Plus className="h-4 w-4" />
                    </IconStepButton>
                  </div>
                  <FormattedAmountInput
                    value={loanAmount}
                    onChange={(n) => setLoanAmount(clampCalculator(n, 0, maxLoan))}
                    aria-label="Ønsket lånebeløp"
                    className="w-full min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1 flex-wrap min-w-0">
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Lånegrad (LTV)
                </span>
                <InfoPopover
                  title="Lånegrad (LTV)"
                  text="Lånegrad er lån delt på boligens pris i dette regnestykket. Kalkulatoren lar deg dra inntil 90 % (stiplet markør) som maks. Mange boliglån i Norge følger en typisk 85 % maks for boligkjøp hos bank — markert med strek. Din bank og finansieringsbeviset ditt gjelder for deg."
                />
              </div>
              <div
                className="relative h-2.5 sm:h-3 rounded-full overflow-visible transition-all duration-300"
                style={{ background: 'var(--primary-pale)' }}
                aria-hidden
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${clampCalculator(ltvPct, 0, 100)}%`, background: 'var(--primary)' }}
                />
                <div
                  className="absolute top-0 bottom-0 w-px border-l-2 border-solid pointer-events-none z-[1] transition-opacity duration-200"
                  style={{ left: `${REFERENCE_LTV * 100}%`, borderColor: 'var(--text)' }}
                />
                <div
                  className="absolute top-0 bottom-0 w-px border-l-2 border-dashed pointer-events-none transition-opacity duration-200"
                  style={{ left: `${MAX_LTV * 100}%`, borderColor: 'var(--text-muted)' }}
                />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Helt strek: ca. {Math.round(REFERENCE_LTV * 100)} % ofte brukt som maks lån til verdi (retningslinjer) — bank
                vurderer. Stiplet: kalkulatorens maks {Math.round(MAX_LTV * 100)} % av boligpris.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={CALCULATOR_CARD_STYLE}>
        <div>
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Lånekostnad
            </p>
            <InfoPopover
              title="Lånekostnad"
              text="Månedlig betaling (annuitet) er renter pluss avdrag. Nominell årsrente er kursen banken oppgir. Effektiv årsrente her viser hva det svarer til ved månedlig forrentning, uten gebyrer."
            />
          </div>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl min-[400px]:text-3xl sm:text-4xl font-bold tabular-nums mt-1 min-w-0 max-w-full leading-tight">
            <span className="min-w-0 max-w-full break-anywhere" style={{ color: 'var(--text)' }}>
              {formatNOK(loanAmount > 0 ? monthlyPayment : 0)}
            </span>
            <span className="text-base min-[400px]:text-lg sm:text-xl font-semibold whitespace-nowrap shrink-0" style={{ color: 'var(--text)' }}>
              pr. md.
            </span>
          </p>
          <p className="text-sm mt-2 leading-relaxed break-words flex flex-wrap items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <span>
              {formatRateNb(nominalRate)} nominell årsrente ·{' '}
              {effRate.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} % effektiv
              årsrente (uten gebyrer)
            </span>
            <InfoPopover
              title="Nominell og effektiv rente"
              text="Nominell rente er det banken oftest oppgir. Effektiv rente bygger inn at renta forrentes månedlig."
            />
          </p>
        </div>

        <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Nøkkeltall
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <StatCard
              label="Egen kapital (kjøp)"
              value={loanAmount > 0 ? formatNOK(equity) : '—'}
              sub="Boligpris minus lån"
              icon={Home}
              color="#3B5BDB"
              valueNoWrap
            />
            <StatCard
              label="Renter totalt"
              value={loanAmount > 0 ? formatNOK(totalInterest) : '—'}
              sub="Hele løpetiden"
              icon={Banknote}
              color="#F08C00"
              valueNoWrap
            />
            <StatCard
              label="Første år til renter"
              value={
                loanAmount > 0
                  ? `${firstYearInterestShare.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} %`
                  : '—'
              }
              sub="Andel av de første 12 terminene"
              icon={PieChart}
              color="#7950F2"
            />
            <StatCard
              label="Total tilbakebetaling"
              value={loanAmount > 0 ? formatNOK(totalPaid) : '—'}
              sub={`Inkl. hovedstol, ${years} år`}
              icon={Receipt}
              color="#0CA678"
              valueNoWrap
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Nedbetalingsplan
            </span>
            <InfoPopover
              title="Nedbetalingsplan"
              text="Mnd — måned. Termin — beløp du betaler. Renter og avdrag fordelt per termin. Restgjeld etter innbetaling."
            />
          </div>
          <button
            type="button"
            onClick={() => setScheduleOpen((o) => !o)}
            className="w-full flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 min-h-[44px] py-2 px-3 sm:px-4 rounded-xl text-sm font-medium text-center text-balance touch-manipulation border"
            style={{ borderColor: 'var(--border)', background: 'var(--primary-pale)', color: 'var(--primary)' }}
            aria-expanded={scheduleOpen}
          >
            {scheduleOpen ? (
              <>
                <span>Skjul tabell</span>
                <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
              </>
            ) : (
              <>
                <span>Vis nedbetalingsplan (tabell)</span>
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
              </>
            )}
          </button>
        </div>

        {scheduleOpen && loanAmount > 0 && schedule.length > 0 && (
          <div className="pt-2">
            <AnnuityScheduleTable rows={schedule} />
          </div>
        )}

        {loanAmount > 0 && (
          <RateSensitivityPanel
            scenarios={rateScenarios}
            disclaimer="Indikativ. Avtale, binding og bankens priser i fremtiden bestemmer faktisk betaling."
          />
        )}
      </div>

      <div className="text-xs px-1 leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
        <p>
          Budsjett og bo-kost: månedlig lån er bare én del — felleskost, forsikring, kommunale avgifter og vedlikehold
          ligger utenfor denne kalkulatoren.
        </p>
        <p>
          Forenklet modell uten etablering og bankgebyrer. Dette er ikke lånetilbud, finans- eller skatteråd; bank og
          rådgiver gjelder for ditt faktiske valg.
        </p>
      </div>
    </div>
  )
}
