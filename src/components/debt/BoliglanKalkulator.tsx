'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { Banknote, ChevronDown, ChevronUp, Home, Minus, PieChart, Plus, Receipt } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  type AmortizationRow,
} from '@/lib/mortgageCalculator'
import { formatNOK } from '@/lib/utils'

const MAX_LTV = 0.9
/** Referansemal for maks lån til verdi (vanlige retningslinjer) — kalkulatoren bruker 90 % som tak. */
const REFERENCE_LTV = 0.85

const PROPERTY_MIN = 500_000
const PROPERTY_MAX = 30_000_000
const PROPERTY_STEP = 50_000

const RATE_MIN = 0
const RATE_MAX = 15
const RATE_STEP = 0.05

const YEARS_MIN = 1
const YEARS_MAX = 35

const LOAN_STEP = 50_000

const SCHEDULE_VIRTUAL_THRESHOLD = 120
const ROW_H = 44

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function formatRateNb(value: number): string {
  return `${value.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

function formatDeltaNOK(diff: number): string {
  if (diff === 0) return formatNOK(0)
  const sign = diff > 0 ? '+' : '−'
  return `${sign} ${formatNOK(Math.abs(diff))}`
}

function IconStepButton({
  onClick,
  disabled,
  children,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full border touch-manipulation disabled:opacity-40"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    >
      {children}
    </button>
  )
}

function ScheduleTableHeader({ gridClass }: { gridClass: string }) {
  return (
    <div
      className={`${gridClass} px-2 py-2 text-xs font-semibold border-b sticky top-0 z-10`}
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    >
      <span>Mnd</span>
      <span className="text-right">Termin</span>
      <span className="text-right">Renter</span>
      <span className="text-right">Avdrag</span>
      <span className="text-right">Restgjeld</span>
    </div>
  )
}

const scheduleGrid =
  'grid gap-0 items-center min-w-[28rem] grid-cols-[2.5rem_1fr_1fr_1fr_1fr] sm:min-w-[36rem]'

function ScheduleRow({ row }: { row: AmortizationRow }) {
  return (
    <>
      <span style={{ color: 'var(--text)' }}>{row.monthIndex}</span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text)' }}>
        {formatNOK(row.payment)}
      </span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {formatNOK(row.interest)}
      </span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {formatNOK(row.principal)}
      </span>
      <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {formatNOK(row.balanceAfter)}
      </span>
    </>
  )
}

function ScheduleTableSimple({ rows }: { rows: AmortizationRow[] }) {
  return (
    <div
      className="overflow-x-auto overscroll-x-contain rounded-xl border touch-manipulation"
      style={{ borderColor: 'var(--border)' }}
    >
      <ScheduleTableHeader gridClass={scheduleGrid} />
      {rows.map((row) => (
        <div
          key={row.monthIndex}
          className={`${scheduleGrid} px-2 py-2 text-sm border-b`}
          style={{ borderColor: 'var(--border)' }}
        >
          <ScheduleRow row={row} />
        </div>
      ))}
    </div>
  )
}

function ScheduleTableVirtual({ rows }: { rows: AmortizationRow[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 20,
  })
  const vItems = virtualizer.getVirtualItems()

  return (
    <div
      className="overflow-x-auto overscroll-x-contain rounded-xl border touch-manipulation"
      style={{ borderColor: 'var(--border)' }}
    >
      <div ref={parentRef} className="max-h-[min(70vh,520px)] overflow-auto overscroll-y-contain touch-manipulation">
        <ScheduleTableHeader gridClass={scheduleGrid} />
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {vItems.map((vi) => {
            const row = rows[vi.index]
            if (!row) return null
            return (
              <div
                key={vi.key}
                className={`${scheduleGrid} px-2 py-2 text-sm border-b absolute left-0 w-full min-w-[28rem] sm:min-w-[36rem]`}
                style={{
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                  borderColor: 'var(--border)',
                }}
              >
                <ScheduleRow row={row} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function BoliglanKalkulator() {
  const [propertyPrice, setPropertyPrice] = useState(6_000_000)
  const [nominalRate, setNominalRate] = useState(4.79)
  const [years, setYears] = useState(30)
  const [loanAmount, setLoanAmount] = useState(4_500_000)

  const maxLoan = useMemo(() => Math.floor(propertyPrice * MAX_LTV), [propertyPrice])

  useEffect(() => {
    setLoanAmount((prev) => clamp(prev, 0, maxLoan))
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

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' } as const

  const loanSliderPct = maxLoan > 0 ? (loanAmount / maxLoan) * 100 : 0
  /** Hold flytende %-label innenfor kanten på smale skjermer */
  const ltvLabelLeftPct = clamp(loanSliderPct, 12, 88)

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full break-words">
      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={cardStyle}>
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
                  onClick={() => setPropertyPrice((v) => clamp(v - PROPERTY_STEP, PROPERTY_MIN, PROPERTY_MAX))}
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
                  onClick={() => setPropertyPrice((v) => clamp(v + PROPERTY_STEP, PROPERTY_MIN, PROPERTY_MAX))}
                >
                  <Plus className="h-4 w-4" />
                </IconStepButton>
              </div>
              <FormattedAmountInput
                value={propertyPrice}
                onChange={(n) => setPropertyPrice(clamp(n, PROPERTY_MIN, PROPERTY_MAX))}
                aria-label="Boligens pris i kroner"
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Nominell rente
            </span>
            <div className="flex flex-col gap-3 min-w-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
                <IconStepButton
                  label="Trekk fra rente"
                  disabled={nominalRate <= RATE_MIN}
                  onClick={() =>
                    setNominalRate((v) => clamp(Math.round((v - RATE_STEP) * 100) / 100, RATE_MIN, RATE_MAX))
                  }
                >
                  <Minus className="h-4 w-4" />
                </IconStepButton>
                <input
                  type="range"
                  className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content"
                  style={{ accentColor: 'var(--primary)' }}
                  min={RATE_MIN}
                  max={RATE_MAX}
                  step={RATE_STEP}
                  value={nominalRate}
                  onChange={(e) => setNominalRate(Number(e.target.value))}
                  aria-valuetext={formatRateNb(nominalRate)}
                />
                <IconStepButton
                  label="Legg til rente"
                  disabled={nominalRate >= RATE_MAX}
                  onClick={() =>
                    setNominalRate((v) => clamp(Math.round((v + RATE_STEP) * 100) / 100, RATE_MIN, RATE_MAX))
                  }
                >
                  <Plus className="h-4 w-4" />
                </IconStepButton>
              </div>
              <input
                type="number"
                inputMode="decimal"
                min={RATE_MIN}
                max={RATE_MAX}
                step={0.01}
                value={nominalRate}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!Number.isFinite(v)) return
                  setNominalRate(clamp(Math.round(v * 100) / 100, RATE_MIN, RATE_MAX))
                }}
                className="w-full max-w-[12rem] min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm tabular-nums"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                aria-label="Nominell rente i prosent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Nedbetalingstid
            </span>
            <div className="flex flex-col gap-3 min-w-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
                <IconStepButton
                  label="Ett år mindre"
                  disabled={years <= YEARS_MIN}
                  onClick={() => setYears((v) => clamp(v - 1, YEARS_MIN, YEARS_MAX))}
                >
                  <Minus className="h-4 w-4" />
                </IconStepButton>
                <input
                  type="range"
                  className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content"
                  style={{ accentColor: 'var(--primary)' }}
                  min={YEARS_MIN}
                  max={YEARS_MAX}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  aria-valuetext={`${years} år`}
                />
                <IconStepButton
                  label="Ett år mer"
                  disabled={years >= YEARS_MAX}
                  onClick={() => setYears((v) => clamp(v + 1, YEARS_MIN, YEARS_MAX))}
                >
                  <Plus className="h-4 w-4" />
                </IconStepButton>
              </div>
              <div className="flex items-center gap-2 w-full min-w-0 max-w-[12rem]">
                <input
                  type="number"
                  inputMode="numeric"
                  min={YEARS_MIN}
                  max={YEARS_MAX}
                  step={1}
                  value={years}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isFinite(v)) return
                    setYears(clamp(Math.round(v), YEARS_MIN, YEARS_MAX))
                  }}
                  className="min-w-0 flex-1 min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm tabular-nums"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  aria-label="Nedbetalingstid i år"
                />
                <span className="text-base sm:text-sm whitespace-nowrap shrink-0" style={{ color: 'var(--text-muted)' }}>
                  år
                </span>
              </div>
            </div>
          </div>

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
                  style={{
                    left: `${ltvLabelLeftPct}%`,
                    color: 'var(--text)',
                  }}
                >
                  {ltvPct.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} % LTV
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
                    <IconStepButton
                      label="Trekk fra lån"
                      disabled={loanAmount <= 0}
                      onClick={() => setLoanAmount((v) => clamp(v - LOAN_STEP, 0, maxLoan))}
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
                      onClick={() => setLoanAmount((v) => clamp(v + LOAN_STEP, 0, maxLoan))}
                    >
                      <Plus className="h-4 w-4" />
                    </IconStepButton>
                  </div>
                  <FormattedAmountInput
                    value={loanAmount}
                    onChange={(n) => setLoanAmount(clamp(n, 0, maxLoan))}
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
                  style={{
                    width: `${clamp(ltvPct, 0, 100)}%`,
                    background: 'var(--primary)',
                  }}
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

      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={cardStyle}>
        <div>
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Lånekostnad
            </p>
            <InfoPopover
              title="Lånekostnad"
              text="Månedlig betaling (annuitet) er renter pluss avdrag. Nominell årsrente er kursen banken oppgir. Effektiv årsrente her viser hva det svarer til ved månedlig forrentning, uten gebyrer. Det er ikke det samme som kostnaden av å eie bolig (felleskostnader, forsikring, kommunale avgifter og løpende vedlikehold kommer i tillegg)."
            />
          </div>
          <p className="text-2xl min-[400px]:text-3xl sm:text-4xl font-bold tabular-nums mt-1 min-w-0 max-w-full leading-tight">
            <span
              className="inline-block max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain [scrollbar-width:thin] align-bottom"
              style={{ color: 'var(--text)' }}
            >
              {formatNOK(loanAmount > 0 ? monthlyPayment : 0)}
            </span>{' '}
            <span className="text-base min-[400px]:text-lg sm:text-xl font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
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
              text="Nominell rente er det banken oftest oppgir. Effektiv rente bygger inn at renta forrentes månedlig. Småforskjellen mellom dem sier noe om kost, men faktisk effekt hos banken avhenger også av gebyrer — som ikke er med i denne kalkulatoren."
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
              info="Dette er innskuddet i boligen i forhold til kjøpspris og ønsket lån, ikke inkludert omkostninger ved kjøp. Bank og finansieringsbeviset ditt gjelder for ditt faktiske behov."
            />
            <StatCard
              label="Renter totalt"
              value={loanAmount > 0 ? formatNOK(totalInterest) : '—'}
              sub="Hele løpetiden, etter kalkulatoren"
              icon={Banknote}
              color="#F08C00"
              valueNoWrap
              info="Det du betaler i renter i tillegg til lånebeløpet over valgt løpetid, med denne forenklede modellen (avhengig av avrunding siste periode)."
            />
            <StatCard
              label="Første år til renter"
              value={
                loanAmount > 0
                  ? `${firstYearInterestShare.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} %`
                  : '—'
              }
              sub="Andel av de første 12 terminene (renter / termin)"
              icon={PieChart}
              color="#7950F2"
              info="Viser omtrent hvor mye av betalingen som går til renter i starten, først og fremst. Kort lån færre enn 12 måneder: alle måneder inkluderes i anslaget."
            />
            <StatCard
              label="Total tilbakebetaling"
              value={loanAmount > 0 ? formatNOK(totalPaid) : '—'}
              sub={`Inkl. hovedstol, ${years} år`}
              icon={Receipt}
              color="#0CA678"
              valueNoWrap
              info="Summen av alle terminer. Dette er hovedlån pluss all rente over løpetid i kalkulatoren — det er ikke 'rentekost' alene, og det inkluderer ikke felleskost, forsikring med mer."
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
              text="Kolonnene: Mnd — måned. Termin — beløp du betaler den perioden. Renter — andel av terminen som er rente. Avdrag — andel som reduserer hovedstolen. Restgjeld — gjenværende hovedlån etter innbetaling. Tall i hele kroner; siste termin justeres så siste rest skrives av nøyaktig."
            />
          </div>
          <button
            type="button"
            onClick={() => setScheduleOpen((o) => !o)}
            className="w-full flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 min-h-[44px] py-2 px-3 sm:px-4 rounded-xl text-sm font-medium text-center text-balance touch-manipulation border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--primary-pale)',
              color: 'var(--primary)',
            }}
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
          <div className="pt-2 transition-opacity duration-300 ease-out" style={{ opacity: 1 }}>
            {schedule.length >= SCHEDULE_VIRTUAL_THRESHOLD ? (
              <ScheduleTableVirtual rows={schedule} />
            ) : (
              <ScheduleTableSimple rows={schedule} />
            )}
          </div>
        )}

        {loanAmount > 0 && (
          <div
            className="rounded-2xl border p-0 shadow-sm transition-shadow duration-300 ease-out min-w-0"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div
              className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-medium tracking-tight" style={{ color: 'var(--text)' }}>
                  Hva om renta endrer seg?
                </p>
                <InfoPopover
                  title="Rentesensitivitet"
                  text="Omtrent ny månedlig betaling hvis den nominelle årsrenten endres og lån/løpetid ellers er uendret. For å tålegrad og tenke scenarier — ikke en prognose, og ikke faktisk rentetilpassning ut fra din avtale."
                />
              </div>
            </div>
            <p className="px-4 sm:px-5 pt-2 text-[0.7rem] sm:text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Indikativ. Avtale, binding og bankens priser i fremtiden bestemmer faktisk betaling.
            </p>
            <div className="p-2 sm:p-3 space-y-1.5 min-w-0" role="list">
              {rateScenarios.map(({ delta, monthly, diff }) => (
                <div
                  key={delta}
                  role="listitem"
                  className="rounded-xl px-3 py-2.5 sm:py-2.5 transition-colors duration-200 ease-out min-w-0"
                  style={{ background: 'var(--bg)' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 sm:items-center gap-1.5 sm:gap-3 text-sm min-w-0">
                    <div className="sm:col-span-3 tabular-nums text-xs sm:text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                      {delta < 0 ? '−' : '+'}
                      {Math.abs(delta)} % punkt
                    </div>
                    <div
                      className="sm:col-span-4 font-semibold tabular-nums min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
                      style={{ color: 'var(--text)' }}
                    >
                      {formatNOK(monthly)}{' '}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        pr. md.
                      </span>
                    </div>
                    <div
                      className="sm:col-span-5 sm:text-right text-left tabular-nums text-sm min-w-0 break-words"
                      style={{
                        color: diff > 0 ? 'var(--danger)' : diff < 0 ? 'var(--success)' : 'var(--text-muted)',
                      }}
                    >
                      {diff === 0 ? 'Ingen endring' : formatDeltaNOK(diff) + ' pr. md.'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs px-1 leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
        <p>
          Budsjett og bo-kost: månedlig lån er bare én del — for eksempel felleskost, forsikring, kommunale avgifter og
          vedlikehold ligger utenfor denne kalkulatoren.
        </p>
        <p>
          Forenklet modell uten etablering og bankgebyrer. Effektiv rente bygger på samme forutsetninger. Faktiske
          betalinger avhenger av avtale, binding og bank. Dette er ikke lånetilbud, finans- eller skatteråd; bank og
          rådgiver gjelder for ditt faktiske valg.
        </p>
      </div>
    </div>
  )
}
