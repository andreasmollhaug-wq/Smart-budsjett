'use client'

import { Minus, Plus } from 'lucide-react'
import { clampCalculator, formatRateNb, IconStepButton } from '@/components/debt/calculator/calculatorUiUtils'

type Props = {
  nominalRate: number
  onNominalRateChange: (value: number) => void
  years: number
  onYearsChange: (value: number) => void
  rateMin?: number
  rateMax?: number
  rateStep?: number
  yearsMin?: number
  yearsMax?: number
  rateLabel?: string
  yearsLabel?: string
}

export default function CalculatorRateYearsInputs({
  nominalRate,
  onNominalRateChange,
  years,
  onYearsChange,
  rateMin = 0,
  rateMax = 15,
  rateStep = 0.05,
  yearsMin = 1,
  yearsMax = 35,
  rateLabel = 'Nominell rente',
  yearsLabel = 'Nedbetalingstid',
}: Props) {
  const clampRate = (v: number) => clampCalculator(Math.round(v * 100) / 100, rateMin, rateMax)
  const clampYears = (v: number) => clampCalculator(Math.round(v), yearsMin, yearsMax)

  return (
    <>
      <div className="flex flex-col gap-2 min-w-0">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {rateLabel}
        </span>
        <div className="flex flex-col gap-3 min-w-0">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
            <IconStepButton
              label="Trekk fra rente"
              disabled={nominalRate <= rateMin}
              onClick={() => onNominalRateChange(clampRate(nominalRate - rateStep))}
            >
              <Minus className="h-4 w-4" />
            </IconStepButton>
            <input
              type="range"
              className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content"
              style={{ accentColor: 'var(--primary)' }}
              min={rateMin}
              max={rateMax}
              step={rateStep}
              value={nominalRate}
              onChange={(e) => onNominalRateChange(Number(e.target.value))}
              aria-valuetext={formatRateNb(nominalRate)}
            />
            <IconStepButton
              label="Legg til rente"
              disabled={nominalRate >= rateMax}
              onClick={() => onNominalRateChange(clampRate(nominalRate + rateStep))}
            >
              <Plus className="h-4 w-4" />
            </IconStepButton>
          </div>
          <input
            type="number"
            inputMode="decimal"
            min={rateMin}
            max={rateMax}
            step={0.01}
            value={nominalRate}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!Number.isFinite(v)) return
              onNominalRateChange(clampRate(v))
            }}
            className="w-full max-w-[12rem] min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm tabular-nums"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label={`${rateLabel} i prosent`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {yearsLabel}
        </span>
        <div className="flex flex-col gap-3 min-w-0">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center w-full min-w-0">
            <IconStepButton
              label="Ett år mindre"
              disabled={years <= yearsMin}
              onClick={() => onYearsChange(clampYears(years - 1))}
            >
              <Minus className="h-4 w-4" />
            </IconStepButton>
            <input
              type="range"
              className="w-full min-w-0 min-h-[44px] h-2 touch-manipulation self-stretch py-3 box-content"
              style={{ accentColor: 'var(--primary)' }}
              min={yearsMin}
              max={yearsMax}
              step={1}
              value={years}
              onChange={(e) => onYearsChange(Number(e.target.value))}
              aria-valuetext={`${years} år`}
            />
            <IconStepButton
              label="Ett år mer"
              disabled={years >= yearsMax}
              onClick={() => onYearsChange(clampYears(years + 1))}
            >
              <Plus className="h-4 w-4" />
            </IconStepButton>
          </div>
          <div className="flex items-center gap-2 w-full min-w-0 max-w-[12rem]">
            <input
              type="number"
              inputMode="numeric"
              min={yearsMin}
              max={yearsMax}
              step={1}
              value={years}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (!Number.isFinite(v)) return
                onYearsChange(clampYears(v))
              }}
              className="min-w-0 flex-1 min-h-[44px] rounded-xl px-3 py-2 text-base sm:text-sm tabular-nums"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              aria-label={`${yearsLabel} i år`}
            />
            <span className="text-base sm:text-sm whitespace-nowrap shrink-0" style={{ color: 'var(--text-muted)' }}>
              år
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
