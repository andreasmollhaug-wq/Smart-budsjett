'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import {
  annuityMonthlyPayment,
  buildAmortizationSchedule,
  effectiveAnnualRateFromNominalMonthly,
  equityRequired,
  loanToValuePct,
  sumSchedulePayments,
  type AmortizationRow,
} from '@/lib/mortgageCalculator'
import { formatNOK } from '@/lib/utils'

const MAX_LTV = 0.9

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

  const [scheduleOpen, setScheduleOpen] = useState(false)

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' } as const

  const loanSliderPct = maxLoan > 0 ? (loanAmount / maxLoan) * 100 : 0
  /** Hold flytende %-label innenfor kanten på smale skjermer */
  const ltvLabelLeftPct = clamp(loanSliderPct, 12, 88)

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 min-w-0 w-full">
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
        </div>
      </div>

      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={cardStyle}>
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Lånekostnad
          </p>
          <p className="text-3xl sm:text-4xl font-bold tabular-nums mt-1" style={{ color: 'var(--text)' }}>
            {formatNOK(loanAmount > 0 ? monthlyPayment : 0)}{' '}
            <span className="text-lg sm:text-xl font-semibold">pr. md.</span>
          </p>
          <p className="text-sm mt-2 leading-relaxed break-words" style={{ color: 'var(--text-muted)' }}>
            {formatRateNb(nominalRate)} nominell årsrente ·{' '}
            {effRate.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} % effektiv årsrente
            (uten gebyrer)
          </p>
        </div>

        <div className="space-y-2">
          <div
            className="relative h-3 rounded-full overflow-visible"
            style={{ background: 'var(--primary-pale)' }}
            aria-hidden
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-[width]"
              style={{
                width: `${clamp(ltvPct, 0, 100)}%`,
                background: 'var(--primary)',
              }}
            />
            <div
              className="absolute top-[-2px] bottom-[-2px] w-0 border-l-2 border-dashed pointer-events-none"
              style={{ left: `${MAX_LTV * 100}%`, borderColor: 'var(--text-muted)' }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Stiplet linje: maks {Math.round(MAX_LTV * 100)} % lånegrad av boligpris i kalkulatoren.
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Ønsket lånebeløp
          </span>
          <div className="relative pt-6">
            <div
              className="absolute top-0 text-xs font-medium tabular-nums pointer-events-none -translate-x-1/2 max-w-[90vw] text-center"
              style={{
                left: `${ltvLabelLeftPct}%`,
                color: 'var(--text)',
              }}
            >
              {ltvPct.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 0 })} %
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
                  className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content"
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

        <div
          className="flex flex-col sm:flex-row sm:justify-end gap-4 sm:gap-8 pt-2 border-t sm:text-right"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 text-left sm:text-right">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Egenkapitalbehov
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5 break-words" style={{ color: 'var(--text)' }}>
              {formatNOK(equity)}
            </p>
          </div>
          <div className="min-w-0 text-left sm:text-right">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Totalkostnad ({years} år)
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5 break-words" style={{ color: 'var(--text)' }}>
              {formatNOK(loanAmount > 0 ? totalPaid : 0)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setScheduleOpen((o) => !o)}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-medium touch-manipulation border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--primary-pale)',
            color: 'var(--primary)',
          }}
        >
          {scheduleOpen ? (
            <>
              Skjul nedbetalingsplan
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Vis nedbetalingsplan
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>

        {scheduleOpen && loanAmount > 0 && schedule.length > 0 && (
          <div className="pt-2">
            {schedule.length >= SCHEDULE_VIRTUAL_THRESHOLD ? (
              <ScheduleTableVirtual rows={schedule} />
            ) : (
              <ScheduleTableSimple rows={schedule} />
            )}
          </div>
        )}
      </div>

      <p className="text-xs px-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Effektiv rente er beregnet med månedlig forrentning av nominell årsrente. Faktiske terminer og gebyrer hos bank
        kan avvike.
      </p>
    </div>
  )
}
