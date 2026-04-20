'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import { FormuebyggerMonthlyTable } from '@/components/formuebygger/FormuebyggerMonthlyTable'
import {
  computeBreakEvenYear,
  computeMilestones,
  computeSensitivity,
  extraRecordToArray,
  formuebyggerInputSchema,
  simulateFormuebygger,
  type FormuebyggerInput,
} from '@/lib/formuebyggerPro'
import { useStore } from '@/lib/store'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import { formatNOK } from '@/lib/utils'
import { ChevronDown, Download, ArrowLeft } from 'lucide-react'

function clampInput(input: FormuebyggerInput): FormuebyggerInput {
  const parsed = formuebyggerInputSchema.safeParse(input)
  if (parsed.success) return parsed.data
  return input
}

export default function FormuebyggerPage() {
  const formuebyggerPro = useStore((s) => s.formuebyggerPro)
  const setFormuebyggerPro = useStore((s) => s.setFormuebyggerPro)

  const input = useMemo(() => clampInput(formuebyggerPro.input), [formuebyggerPro.input])
  const totalMonths = Math.min(60, Math.max(1, input.years)) * 12

  useEffect(() => {
    const extra = useStore.getState().formuebyggerPro.extraByMonth
    let changed = false
    const next: Record<string, number> = { ...extra }
    for (const k of Object.keys(next)) {
      const i = Number(k)
      if (!Number.isInteger(i) || i >= totalMonths) {
        delete next[k]
        changed = true
      }
    }
    if (changed) setFormuebyggerPro({ extraByMonth: next })
  }, [totalMonths, setFormuebyggerPro])

  const extraArray = useMemo(
    () => extraRecordToArray(totalMonths, formuebyggerPro.extraByMonth),
    [totalMonths, formuebyggerPro.extraByMonth],
  )

  const result = useMemo(() => simulateFormuebygger(input, extraArray), [input, extraArray])

  const milestones = useMemo(() => computeMilestones(result), [result])
  const breakEvenYear = useMemo(
    () => computeBreakEvenYear(result, input.savingsPerPayment, input.savingsFrequency),
    [result, input.savingsPerPayment, input.savingsFrequency],
  )

  const sensitivity = useMemo(
    () =>
      computeSensitivity(
        {
          formueInput: input,
          baseAnnualReturnPct: input.annualReturn * 100,
        },
        extraArray,
      ),
    [input, extraArray],
  )

  const pdfRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [growthOpen, setGrowthOpen] = useState(true)
  const [monthlyOpen, setMonthlyOpen] = useState(true)

  const patchInput = useCallback(
    (patch: Partial<FormuebyggerInput>) => {
      setFormuebyggerPro({ input: { ...input, ...patch } })
    },
    [input, setFormuebyggerPro],
  )

  const setExtraMonth = useCallback(
    (globalMonthIndex: number, value: number) => {
      setFormuebyggerPro({
        extraByMonth: { [String(globalMonthIndex)]: value },
      })
    },
    [setFormuebyggerPro],
  )

  const setAnnualExtra = useCallback(
    (yearIndex: number, totalAnnual: number) => {
      const v = Math.max(0, totalAnnual)
      const per = v / 12
      const prev = useStore.getState().formuebyggerPro.extraByMonth
      const next: Record<string, number> = { ...prev }
      for (let m = 0; m < 12; m++) {
        const g = yearIndex * 12 + m
        if (g < totalMonths) next[String(g)] = per
      }
      setFormuebyggerPro({ extraByMonth: next })
    },
    [totalMonths, setFormuebyggerPro],
  )

  const handleExportPdf = async () => {
    const el = pdfRef.current
    if (!el) return
    setExporting(true)
    try {
      await exportBankReportPdf(el, `formuebygger-pro-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Formuebyggeren PRO" subtitle="Simuler formuesvekst over tid" />
      <SparingSubnav />
      <div className="p-8 space-y-8 max-w-6xl">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/sparing"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft size={18} />
            Tilbake til sparing
          </Link>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Fyll inn dine tall i de blå feltene. Resultatene oppdateres fortløpende. En forenklet skattemodell — ikke
          fullt regelverk for ASK/aksjesparekonto.
        </p>

        <section
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Innstillinger
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Startbeløp (kr)"
              value={input.startAmount}
              onChange={(n) => patchInput({ startAmount: n })}
              min={0}
              step={1000}
            />
            <Field
              label="Årlig avkastning (%)"
              value={Math.round(input.annualReturn * 10000) / 100}
              onChange={(n) => patchInput({ annualReturn: Math.min(100, Math.max(0, n)) / 100 })}
              min={0}
              max={100}
              step={0.1}
            />
            <Field
              label="Sparebeløp per innbetaling (kr)"
              value={input.savingsPerPayment}
              onChange={(n) => patchInput({ savingsPerPayment: n })}
              min={0}
              step={100}
            />
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                Sparingsfrekvens (per år)
              </label>
              <select
                value={input.savingsFrequency}
                onChange={(e) =>
                  patchInput({ savingsFrequency: Number(e.target.value) as FormuebyggerInput['savingsFrequency'] })
                }
                className="w-full rounded-xl px-3 py-2 border text-sm"
                style={{
                  background: 'var(--primary-pale)',
                  borderColor: 'var(--primary)',
                  color: 'var(--text)',
                }}
              >
                <option value={1}>1 (årlig)</option>
                <option value={2}>2</option>
                <option value={4}>4 (kvartalsvis)</option>
                <option value={12}>12 (månedlig)</option>
                <option value={26}>26</option>
                <option value={52}>52</option>
              </select>
            </div>
            <Field
              label="Antall år"
              value={input.years}
              onChange={(n) => patchInput({ years: Math.min(60, Math.max(1, Math.round(n))) })}
              min={1}
              max={60}
              step={1}
            />
            <Field
              label="Skattesats (%)"
              value={Math.round(input.taxRate * 10000) / 100}
              onChange={(n) => patchInput({ taxRate: Math.min(100, Math.max(0, n)) / 100 })}
              min={0}
              max={100}
              step={0.5}
            />
            <Field
              label="Inflasjon (%)"
              value={Math.round(input.inflation * 10000) / 100}
              onChange={(n) => patchInput({ inflation: Math.min(100, Math.max(0, n)) / 100 })}
              min={0}
              max={100}
              step={0.1}
            />
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                Rentefrekvens (sammensetninger/år)
              </label>
              <select
                value={input.compoundFrequency}
                onChange={(e) =>
                  patchInput({ compoundFrequency: Number(e.target.value) as FormuebyggerInput['compoundFrequency'] })
                }
                className="w-full rounded-xl px-3 py-2 border text-sm"
                style={{
                  background: 'var(--primary-pale)',
                  borderColor: 'var(--primary)',
                  color: 'var(--text)',
                }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={12}>12 (månedlig)</option>
                <option value={26}>26</option>
                <option value={52}>52</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Kjerneberegning bruker månedlig sammensetning (n=12) som i produktspesifikasjonen.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Fremtidig verdi (nominell)" value={formatNOK(result.finalNominal)} />
          <StatCard label="Reell verdi" value={formatNOK(result.finalReal)} />
          <StatCard label="Totalt innskudd" value={formatNOK(result.totalDeposits)} />
          <StatCard label="Total avkastning (brutto)" value={formatNOK(result.totalGrossReturn)} />
          <StatCard
            label="Avkastning % (brutto / innskudd)"
            value={formatPercentRatio(
              result.totalDeposits > 0 ? result.totalGrossReturn / result.totalDeposits : 0,
            )}
          />
          <StatCard label="Skatt betalt" value={formatNOK(result.totalTaxPaid)} />
        </div>

        {breakEvenYear !== null && (
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Når avkastning &gt; sparing ({formatNOK(input.savingsPerPayment * input.savingsFrequency)} / år): År{' '}
            {breakEvenYear}
          </p>
        )}

        <section
          className="rounded-2xl p-6 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Milepæler
          </h2>
          <ul className="space-y-2">
            {milestones.map((m) => (
              <li key={m.amount} className="flex justify-between gap-4 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{formatNOK(m.amount)}</span>
                <span style={{ color: 'var(--text)' }}>
                  {m.yearReached === null ? '—' : `Nås etter ${m.yearReached} år`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl p-6 space-y-3 overflow-x-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Sensitivitet
          </h2>
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 pr-4">Avkastning %</th>
                <th className="text-right py-2">Fremtidig verdi</th>
                <th className="text-right py-2">Reell verdi</th>
                <th className="text-right py-2">Avkastning kr</th>
                <th className="text-right py-2">Avvik vs. base</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr
                  key={row.annualReturnPct}
                  style={
                    row.isBase
                      ? { background: 'var(--primary-pale)', fontWeight: 600 }
                      : { borderBottom: '1px solid var(--border)' }
                  }
                >
                  <td className="py-2 pr-4">{(row.isBase ? '→ ' : '') + row.annualReturnPct.toFixed(1).replace('.', ',')}%</td>
                  <td className="text-right py-2">{formatNOK(row.futureValue)}</td>
                  <td className="text-right py-2">{formatNOK(row.realValue)}</td>
                  <td className="text-right py-2">{formatNOK(row.returnKr)}</td>
                  <td className="text-right py-2">{formatNOK(row.deviationFromBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div ref={pdfRef} className="space-y-8">
          <section
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setGrowthOpen((o) => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Vekstplan (år)
              </span>
              <ChevronDown
                size={22}
                style={{ color: 'var(--text-muted)', transform: growthOpen ? 'rotate(180deg)' : undefined }}
              />
            </button>
            {growthOpen && (
              <div className="px-6 pb-6 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-2">År</th>
                      <th className="text-right py-2">IB</th>
                      <th className="text-right py-2">Årlig sparing</th>
                      <th className="text-right py-2">Ekstra (sum)</th>
                      <th className="text-right py-2">Avkastning</th>
                      <th className="text-right py-2">Skatt</th>
                      <th className="text-right py-2">UB</th>
                      <th className="text-right py-2">Reell verdi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.years.map((y) => (
                      <tr key={y.yearIndex} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2">{y.yearIndex + 1}</td>
                        <td className="text-right py-2">{formatNOK(y.ib)}</td>
                        <td className="text-right py-2">{formatNOK(y.annualSavings)}</td>
                        <td className="text-right py-2">
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            className="w-28 rounded-lg px-2 py-1 text-sm border text-right"
                            style={{
                              background: 'var(--primary-pale)',
                              borderColor: 'var(--primary)',
                              color: 'var(--text)',
                            }}
                            value={y.annualExtra === 0 ? '' : Math.round(y.annualExtra)}
                            placeholder="0"
                            onChange={(e) => {
                              const v = e.target.value === '' ? 0 : Number(e.target.value)
                              setAnnualExtra(y.yearIndex, Number.isFinite(v) ? v : 0)
                            }}
                          />
                        </td>
                        <td className="text-right py-2">{formatNOK(y.annualGrossReturn)}</td>
                        <td className="text-right py-2">{formatNOK(y.annualTax)}</td>
                        <td className="text-right py-2 font-medium">{formatNOK(y.ub)}</td>
                        <td className="text-right py-2">{formatNOK(y.realValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setMonthlyOpen((o) => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Månedsplan
              </span>
              <ChevronDown
                size={22}
                style={{ color: 'var(--text-muted)', transform: monthlyOpen ? 'rotate(180deg)' : undefined }}
              />
            </button>
            {monthlyOpen && (
              <div className="px-6 pb-6">
                <FormuebyggerMonthlyTable rows={result.months} onExtraChange={setExtraMonth} />
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-opacity disabled:opacity-50"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              borderColor: 'var(--primary)',
            }}
          >
            <Download size={18} />
            {exporting ? 'Eksporterer…' : 'Last ned PDF (vekst- og månedsplan)'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-xl font-bold mt-1" style={{ color: 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div>
      <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="w-full rounded-xl px-3 py-2 border text-sm"
        style={{
          background: 'var(--primary-pale)',
          borderColor: 'var(--primary)',
          color: 'var(--text)',
        }}
      />
    </div>
  )
}

function formatPercentRatio(r: number): string {
  return `${(r * 100).toFixed(1).replace('.', ',')} %`
}
