'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import MonthlyInsightDocument from '@/components/reports/MonthlyInsightDocument'
import { currentYearMonthOslo } from '@/lib/aiUsage'
import { useActivePersonFinance } from '@/lib/store'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import { getMonthKey } from '@/lib/bankReportData'
import type { MonthlyInsightPayload } from '@/lib/monthlyInsightCompute'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, FileDown, Loader2, Printer, Sparkles } from 'lucide-react'

const MONTH_OPTIONS = [
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

type CachedInsight = {
  payload: MonthlyInsightPayload
  summary: string
  generatedAt: string
  quotaYearMonth: string
}

function storageKey(userId: string, quotaYm: string) {
  return `sb_monthly_insight_v1_${userId}_${quotaYm}`
}

/** F.eks. april 2026 */
function calendarMonthLabelNb(ym: string): string {
  const [yy, mm] = ym.split('-').map(Number)
  if (!yy || !mm) return ym
  return new Date(yy, mm - 1, 15).toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
}

/** Første dag i neste kalendermåned etter ym (f.eks. etter 2026-04 → 1. mai 2026). */
function firstDayNextMonthAfterYmNb(ym: string): string {
  const [yy, mm] = ym.split('-').map(Number)
  if (!yy || !mm) return ''
  const d = new Date(yy, mm, 1)
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ManedsinnsiktPage() {
  const { isHouseholdAggregate, profiles, activeProfileId } = useActivePersonFinance()
  const activeProfileName = profiles.find((p) => p.id === activeProfileId)?.name?.trim() || 'Aktiv profil'
  const insightScopeLine = isHouseholdAggregate
    ? 'Månedsinnsikten bygger på samlet data for hele husholdningen (alle profiler).'
    : `Månedsinnsikten bygger på data kun for ${activeProfileName}. Bytt visning i profilvelgeren til venstre før du genererer.`

  const [userId, setUserId] = useState<string | null>(null)
  const [year, setYear] = useState(() => {
    const d = new Date()
    const m = d.getMonth()
    return m === 0 ? d.getFullYear() - 1 : d.getFullYear()
  })
  const [monthIndex, setMonthIndex] = useState(() => {
    const d = new Date()
    const m = d.getMonth()
    return m === 0 ? 11 : m - 1
  })
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [pdfLoading, setPdfLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<MonthlyInsightPayload | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  /** Server: om månedens generering er brukt (1 per kalendermåned). */
  const [quotaInfo, setQuotaInfo] = useState<{ yearMonth: string; used: boolean } | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(true)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.dataset.printReport = 'true'
    return () => {
      delete document.body.dataset.printReport
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      const uid = data.user?.id ?? null
      setUserId(uid)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setQuotaLoading(true)
    const ym = currentYearMonthOslo()

    let fromCache = false
    const raw = sessionStorage.getItem(storageKey(userId, ym))
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CachedInsight
        if (parsed.payload && parsed.summary && parsed.quotaYearMonth === ym) {
          fromCache = true
          setPayload(parsed.payload)
          setSummary(parsed.summary)
          setGeneratedAt(new Date(parsed.generatedAt))
          setYear(parsed.payload.reportYear)
          setMonthIndex(parsed.payload.reportMonthIndex)
        }
      } catch {
        /* ignore */
      }
    }

    ;(async () => {
      try {
        const res = await fetch('/api/rapporter/manedsinnsikt')
        const data = (await res.json().catch(() => null)) as {
          yearMonth?: string
          used?: boolean
        } | null
        if (cancelled) return
        const ymServer = res.ok && data?.yearMonth ? data.yearMonth : ym
        const usedFromServer = res.ok && data?.used === true
        setQuotaInfo({ yearMonth: ymServer, used: usedFromServer || fromCache })
      } catch {
        if (!cancelled) {
          setQuotaInfo({ yearMonth: ym, used: fromCache })
        }
      } finally {
        if (!cancelled) setQuotaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    const base = Array.from({ length: 11 }, (_, i) => y - 5 + i)
    const set = new Set([...base, year])
    return [...set].sort((a, b) => a - b)
  }, [year])

  const handleGenerate = useCallback(async () => {
    setError(null)
    setGenerating(true)
    try {
      const resp = await fetch('/api/rapporter/manedsinnsikt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, monthIndex }),
      })
      const data = (await resp.json().catch(() => null)) as {
        error?: string
        payload?: MonthlyInsightPayload
        summary?: string
        quotaYearMonth?: string
        code?: string
      } | null

      if (resp.status === 429) {
        const ym = currentYearMonthOslo()
        setQuotaInfo({ yearMonth: ym, used: true })
        setError(data?.error ?? 'Du har brukt månedens generering.')
        return
      }
      if (!resp.ok) {
        setError(data?.error ?? `Feil (${resp.status})`)
        return
      }
      if (!data?.payload || !data.summary) {
        setError('Uventet svar fra server.')
        return
      }

      const at = new Date()
      setPayload(data.payload)
      setSummary(data.summary)
      setGeneratedAt(at)
      const qm = data.quotaYearMonth ?? currentYearMonthOslo()
      setQuotaInfo({ yearMonth: qm, used: true })

      const uid = userId ?? (await createClient().auth.getUser()).data.user?.id
      if (uid) {
        const cached: CachedInsight = {
          payload: data.payload,
          summary: data.summary,
          generatedAt: at.toISOString(),
          quotaYearMonth: qm,
        }
        sessionStorage.setItem(storageKey(uid, qm), JSON.stringify(cached))
      }
    } catch (e) {
      console.error(e)
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setGenerating(false)
    }
  }, [year, monthIndex, userId])

  const handlePrint = () => {
    setGeneratedAt(new Date())
    requestAnimationFrame(() => {
      window.print()
    })
  }

  const handlePdf = useCallback(async () => {
    const el = reportRef.current
    if (!el) return
    setPdfLoading(true)
    setGeneratedAt(new Date())
    try {
      await new Promise((r) => requestAnimationFrame(r))
      const key = getMonthKey(year, monthIndex)
      await exportBankReportPdf(el, `manedsinnsikt-${key}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }, [year, monthIndex])

  const canExport = Boolean(payload && summary && summary.length > 0)

  const ym = quotaInfo?.yearMonth ?? currentYearMonthOslo()
  const quotaUsed = quotaInfo?.used === true
  const canGenerate = !quotaLoading && !quotaUsed

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <div className="print-hidden">
        <Header
          title="Månedsinnsikt"
          subtitle="Faktisk mot budsjett, trender og kort oppsummering med EnkelExcel AI"
        />
        <p
          className="px-4 sm:px-8 pt-3 pb-1 text-sm max-w-4xl mx-auto leading-snug min-w-0"
          style={{ color: 'var(--text)' }}
          role="status"
        >
          {insightScopeLine}
        </p>
        <div
          className="px-4 sm:px-8 py-4 border-b min-w-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col gap-4 min-w-0">
            <Link
              href="/rapporter"
              className="inline-flex items-center gap-1 text-sm font-medium min-h-[44px] w-fit touch-manipulation py-1"
              style={{ color: 'var(--primary)' }}
            >
              <ChevronLeft size={16} />
              Rapporter
            </Link>
            <div className="flex flex-col gap-3 w-full min-w-0 xl:flex-row xl:flex-wrap xl:items-end xl:justify-between">
              <div className="flex flex-col gap-3 w-full min-w-0 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex flex-col gap-1 text-sm min-w-0 flex-1 sm:flex-initial sm:min-w-[7.5rem]" style={{ color: 'var(--text-muted)' }}>
                  <span>År</span>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl text-sm touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm min-w-0 flex-1 sm:flex-initial sm:min-w-[9rem]" style={{ color: 'var(--text-muted)' }}>
                  <span>Måned</span>
                  <select
                    value={monthIndex}
                    onChange={(e) => setMonthIndex(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl text-sm touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.map((label, i) => (
                      <option key={label} value={i}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-2 w-full min-w-0 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !canGenerate}
                  title={
                    !canGenerate && quotaUsed
                      ? 'Du har brukt månedens AI-generering. Neste mulighet er fra neste kalendermåned.'
                      : undefined
                  }
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium text-white disabled:opacity-60 touch-manipulation w-full sm:w-auto sm:min-w-[12rem]"
                  style={{ background: 'var(--primary)' }}
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {generating ? 'Genererer…' : 'Generer månedsinnsikt'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!canExport}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium disabled:opacity-50 touch-manipulation w-full sm:w-auto"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <Printer size={16} />
                  Skriv ut
                </button>
                <button
                  type="button"
                  onClick={handlePdf}
                  disabled={pdfLoading || !canExport}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium text-white disabled:opacity-60 touch-manipulation w-full sm:w-auto"
                  style={{ background: 'var(--primary)' }}
                >
                  <FileDown size={16} />
                  {pdfLoading ? 'Genererer PDF…' : 'Eksporter til PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-8 space-y-4">
          <div
            className="rounded-2xl p-4 sm:p-5 border-2"
            style={{
              background: 'var(--primary-pale)',
              borderColor: 'var(--primary)',
            }}
            aria-live="polite"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  AI-kvote (kalendermåned)
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Gjelder generering av nytt sammendrag med EnkelExcel AI. PDF og utskrift teller ikke.
                </p>
              </div>
              {quotaLoading ? (
                <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Laster…
                </span>
              ) : (
                <div
                  className="text-right rounded-xl px-3 py-2 min-w-[7rem]"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Brukt denne måneden
                  </p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                    {quotaUsed ? '1 / 1' : '0 / 1'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {calendarMonthLabelNb(ym)}
                  </p>
                </div>
              )}
            </div>
            {!quotaLoading && (
              <p className="text-sm mt-3 leading-snug" style={{ color: 'var(--text)' }}>
                {quotaUsed ? (
                  <>
                    Du har brukt månedens AI-generering. Du kan fortsatt skrive ut eller eksportere PDF av rapporten
                    som allerede er generert. Neste mulighet for ny generering er{' '}
                    <strong>{firstDayNextMonthAfterYmNb(ym)}</strong>.
                  </>
                ) : (
                  <>
                    Du har <strong>én</strong> AI-generering tilgjengelig i {calendarMonthLabelNb(ym)}. Når rapporten er
                    klar, kan du laste ned PDF så mange ganger du vil.
                  </>
                )}
              </p>
            )}
          </div>
          {error ? (
            <div
              className="rounded-xl px-4 py-3 text-sm mb-4"
              style={{ background: 'rgba(224, 49, 49, 0.12)', color: 'var(--text)' }}
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-8">
        {payload && summary ? (
          <MonthlyInsightDocument
            ref={reportRef}
            generatedAt={generatedAt}
            payload={payload}
            summary={summary}
          />
        ) : (
          <div
            className="max-w-4xl mx-auto rounded-2xl p-8 text-center text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Velg år og måned, og trykk «Generer månedsinnsikt» for å hente tall og et kort AI-sammendrag. Du kan eksportere
            til PDF etterpå — samme mønster som rapport til bank.
          </div>
        )}
      </div>
    </div>
  )
}
