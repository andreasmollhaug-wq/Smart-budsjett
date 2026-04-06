'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance, Investment } from '@/lib/store'
import { formatNOK, generateId } from '@/lib/utils'
import { fetchRateToNok, valueInNok } from '@/lib/fxToNok'
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  X,
  Search,
  RefreshCw,
  Info,
  ChevronDown,
} from 'lucide-react'
import {
  fetchQuoteSnapshots,
  fetchQuoteSearch,
  type QuoteSearchHit,
  type QuoteSnapshot,
} from '@/lib/marketQuotes'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const typeLabels: Record<Investment['type'], string> = {
  stocks: 'Aksjer',
  funds: 'Fond',
  crypto: 'Krypto',
  bonds: 'Obligasjoner',
  other: 'Annet',
}

const typeColors: Record<Investment['type'], string> = {
  stocks: '#3B5BDB',
  funds: '#0CA678',
  crypto: '#F08C00',
  bonds: '#7048E8',
  other: '#6B7A99',
}

const SEARCH_RESULTS_LIMIT = 40
/** Vanlig bank-/meglerpåslag ved valutakjøp (NOK), brukt når bruker velger automatisk kjøpsverdi */
const DEFAULT_VALUTASURTASJE_NOK = 79

function mapSearchTypeToInvestmentType(hitType: string): Investment['type'] {
  const t = hitType.toLowerCase()
  if (t.includes('crypto')) return 'crypto'
  if (t.includes('etf') || t.includes('etp') || t.includes('fund') || t.includes('mutual')) return 'funds'
  if (t.includes('bond')) return 'bonds'
  return 'stocks'
}

function isoDateLocal(date = new Date()) {
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function InvesteringPage() {
  const { investments, addInvestment, removeInvestment, updateInvestment, addInvestmentHistoryValue, removeInvestmentHistoryValue } = useActivePersonFinance()
  const investmentsRef = useRef(investments)
  investmentsRef.current = investments
  const updateInvestmentRef = useRef(updateInvestment)
  updateInvestmentRef.current = updateInvestment
  const addInvestmentHistoryValueRef = useRef(addInvestmentHistoryValue)
  addInvestmentHistoryValueRef.current = addInvestmentHistoryValue
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'funds' as Investment['type'],
    purchaseValue: '', currentValue: '', purchaseDate: ''
  })

  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null)
  const [historyForm, setHistoryForm] = useState({ date: '', value: '' })
  const [currentValueInputs, setCurrentValueInputs] = useState<Record<string, string>>({})

  const [quoteTickerInput, setQuoteTickerInput] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [quoteRows, setQuoteRows] = useState<QuoteSnapshot[] | null>(null)
  const [searchRows, setSearchRows] = useState<(QuoteSearchHit & { quote?: QuoteSnapshot })[] | null>(null)

  const [quoteAddModal, setQuoteAddModal] = useState<(QuoteSearchHit & { quote?: QuoteSnapshot }) | null>(null)
  const [quoteAddForm, setQuoteAddForm] = useState({
    purchaseDate: '',
    shares: '',
    purchaseNok: '',
    useQuotePlusFee: false,
  })
  const [quoteAddSaving, setQuoteAddSaving] = useState(false)
  const [quoteAddError, setQuoteAddError] = useState<string | null>(null)
  const [quoteRefreshTick, setQuoteRefreshTick] = useState(0)
  const [quoteSectionOpen, setQuoteSectionOpen] = useState(false)
  const [dailyInsightOpen, setDailyInsightOpen] = useState(false)
  const [quoteModalFxHint, setQuoteModalFxHint] = useState<string | null>(null)

  const trackedSyncKey = useMemo(
    () =>
      investments
        .filter((i) => i.quoteSymbol && i.shares != null && i.shares > 0)
        .map((i) => `${i.id}:${i.quoteSymbol}:${i.shares}`)
        .sort()
        .join('|'),
    [investments],
  )

  useEffect(() => {
    const list = investmentsRef.current.filter(
      (i) => i.quoteSymbol && i.shares != null && i.shares > 0,
    )
    if (list.length === 0) return

    let cancelled = false

    async function syncTracked() {
      const symbols = [...new Set(list.map((i) => i.quoteSymbol!.trim()))]
      const chunks: string[][] = []
      for (let i = 0; i < symbols.length; i += 10) {
        chunks.push(symbols.slice(i, i + 10))
      }

      const quoteBySymbol = new Map<string, QuoteSnapshot>()
      try {
        for (const chunk of chunks) {
          const { results } = await fetchQuoteSnapshots(chunk)
          chunk.forEach((sym, j) => {
            const row = results[j]
            if (row) quoteBySymbol.set(sym, row)
          })
        }
      } catch {
        return
      }

      const rateCache = new Map<string, number>()

      for (const inv of list) {
        if (cancelled) return
        const sym = inv.quoteSymbol!.trim()
        const snap = quoteBySymbol.get(sym)
        if (!snap || !snap.ok) continue
        const price = snap.regularMarketPrice
        if (price == null || !Number.isFinite(price) || price <= 0) continue

        const cur = snap.currency?.trim() || 'USD'
        let rate = rateCache.get(cur)
        if (rate == null) {
          try {
            rate = await fetchRateToNok(cur)
          } catch {
            continue
          }
          rateCache.set(cur, rate)
        }

        const shares = inv.shares!
        const valNok = valueInNok(shares * price, cur, rate)

        const latest = investmentsRef.current.find((x) => x.id === inv.id)
        if (!latest) continue

        updateInvestmentRef.current(inv.id, { currentValue: valNok, quoteCurrency: cur })

        const today = isoDateLocal()
        addInvestmentHistoryValueRef.current(inv.id, { date: today, value: valNok })
      }
    }

    void syncTracked()
    return () => {
      cancelled = true
    }
  }, [trackedSyncKey, quoteRefreshTick])

  useEffect(() => {
    if (!quoteAddModal) {
      setQuoteModalFxHint(null)
      return
    }
    const q = quoteAddModal.quote
    if (q?.ok) {
      const cur = q.currency?.trim() || 'USD'
      if (cur === 'NOK') {
        setQuoteModalFxHint('Kursnotering i NOK — ingen valutaomregning.')
        return
      }
      let cancelled = false
      setQuoteModalFxHint(null)
      ;(async () => {
        try {
          const r = await fetchRateToNok(cur)
          if (cancelled) return
          const formatted = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 4 }).format(r)
          setQuoteModalFxHint(
            `Valuta fra kurs: ${cur}. Omregning til NOK: 1 ${cur} = ${formatted} NOK (Frankfurter — gratis dagskurs, hentet via vår server).`,
          )
        } catch {
          if (!cancelled) {
            setQuoteModalFxHint(
              `Valuta fra kurs: ${cur}. NOK-beløp regnes som pris × antall × kurs per 1 ${cur} (Frankfurter) ved lagring.`,
            )
          }
        }
      })()
      return () => {
        cancelled = true
      }
    }
    setQuoteModalFxHint(
      'Ved lagring hentes instrumentets valuta fra kurs (f.eks. USD) og omregnes til NOK med Frankfurter — samme kilde som vises i tabellen.',
    )
  }, [quoteAddModal])

  function todayISO() {
    return isoDateLocal()
  }

  function dateToTime(iso: string) {
    // Interpreting `yyyy-mm-dd` as local calendar date (avoids timezone shifting).
    const [y, m, d] = iso.split('-').map((x) => Number(x))
    return new Date(y, m - 1, d).getTime()
  }

  function formatDateLabel(iso: string) {
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return iso
    return `${d}.${m}.${y}`
  }

  function formatNOKCompact(value: number) {
    // Compact formatting without currency symbol (helps keep row width stable).
    return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(value)
  }

  function MiniSparkline({ values, color }: { values: number[]; color: string }) {
    const w = 92
    const h = 28
    if (!values.length) return null

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const xAt = (i: number) => (values.length === 1 ? w / 2 : (i / (values.length - 1)) * w)
    const yAt = (v: number) => h - ((v - min) / range) * h

    const points = values
      .map((v, i) => `${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`)
      .join(' ')

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => (
          <circle
            key={`${i}-${v}`}
            cx={xAt(i)}
            cy={yAt(v)}
            r={2.2}
            fill={color}
            stroke="none"
          />
        ))}
      </svg>
    )
  }

  function formatNOKThousandsInput(input: string) {
    const digits = input.replace(/\D/g, '')
    if (!digits) return ''
    const n = Number(digits)
    if (!Number.isFinite(n)) return ''
    return new Intl.NumberFormat('nb-NO').format(n)
  }

  const activeHistoryInvestment = investments.find((inv) => inv.id === historyOpenFor) ?? null

  const activeHistoryPoints = useMemo(() => {
    if (!activeHistoryInvestment) return []
    return (activeHistoryInvestment.history ?? []).slice().sort((a, b) => dateToTime(a.date) - dateToTime(b.date))
  }, [activeHistoryInvestment])

  const activeHistoryFirstValue = activeHistoryPoints[0]?.value ?? 0
  const activeHistoryTrend = activeHistoryPoints.map((p) => ({
    date: p.date,
    pct: activeHistoryFirstValue !== 0 ? ((p.value - activeHistoryFirstValue) / activeHistoryFirstValue) * 100 : 0,
  }))

  const historyValueDomain = useMemo(() => {
    const values = activeHistoryPoints.map((p) => p.value).filter((v) => Number.isFinite(v))
    if (values.length === 0) return undefined as unknown as [number, number]

    const minV = Math.min(...values)
    const maxV = Math.max(...values)

    const ref =
      activeHistoryInvestment && activeHistoryInvestment.purchaseValue > 0
        ? activeHistoryInvestment.purchaseValue
        : activeHistoryFirstValue > 0
          ? activeHistoryFirstValue
          : Math.max(minV, 1)

    let paddedMin: number
    let paddedMax: number
    if (minV === maxV) {
      const pad = Math.max(1, Math.round(minV * 0.05))
      paddedMin = minV - pad
      paddedMax = maxV + pad
    } else {
      const range = maxV - minV
      const pad = Math.max(1, Math.round(range * 0.08))
      paddedMin = minV - pad
      paddedMax = maxV + pad
    }

    const spanRequired = paddedMax - paddedMin
    const minSpan = ref * 0.1
    const totalSpan = Math.max(minSpan, spanRequired)
    const mid = (paddedMin + paddedMax) / 2
    const y0 = mid - totalSpan / 2
    const y1 = mid + totalSpan / 2
    return [y0, y1] as [number, number]
  }, [activeHistoryPoints, activeHistoryInvestment, activeHistoryFirstValue])

  const totalPurchased = investments.reduce((a, b) => a + b.purchaseValue, 0)
  const totalCurrent = investments.reduce((a, b) => a + b.currentValue, 0)
  const totalReturn = totalCurrent - totalPurchased
  const totalReturnPct = totalPurchased > 0 ? (totalReturn / totalPurchased) * 100 : 0

  const byType = Object.entries(
    investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue
      return acc
    }, {} as Record<string, number>)
  ).map(([type, value]) => ({ name: typeLabels[type as Investment['type']], value, color: typeColors[type as Investment['type']] }))

  const portfolioTimeline = useMemo(() => {
    const dateSet = new Set<string>()

    for (const inv of investments) {
      if (inv.purchaseDate) dateSet.add(inv.purchaseDate)
      for (const p of inv.history ?? []) {
        if (p?.date) dateSet.add(p.date)
      }
    }

    const dates = Array.from(dateSet).filter(Boolean).sort((a, b) => dateToTime(a) - dateToTime(b))
    if (dates.length === 0) return []

    const timeline = dates.map((date) => {
      const targetT = dateToTime(date)
      const total = investments.reduce((sum, inv) => {
        const points = [
          { date: inv.purchaseDate, value: inv.purchaseValue },
          ...(inv.history ?? []).map((h) => ({ date: h.date, value: h.value })),
        ]
          .filter((pt) => pt.date)
          .sort((a, b) => dateToTime(a.date) - dateToTime(b.date))

        let latest: number | null = null
        for (const pt of points) {
          if (dateToTime(pt.date) <= targetT) latest = pt.value
          else break
        }

        return sum + (latest ?? 0)
      }, 0)

      return { date, total }
    })

    return timeline
  }, [investments])

  const showPortfolioGraph = investments.some((inv) => (inv.history?.length ?? 0) >= 3)

  const portfolioDomain = useMemo(() => {
    const values = portfolioTimeline.map((p) => p.total).filter((v) => Number.isFinite(v))
    if (values.length === 0) return undefined as unknown as [number, number]
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (min === max) {
      const pad = Math.max(1, Math.round(min * 0.05))
      return [min - pad, max + pad] as [number, number]
    }
    const range = max - min
    const pad = Math.max(1, Math.round(range * 0.08))
    return [min - pad, max + pad] as [number, number]
  }, [portfolioTimeline])

  const top3ByPurchase = useMemo(
    () =>
      investments
        .slice()
        .sort((a, b) => b.purchaseValue - a.purchaseValue)
        .slice(0, 3),
    [investments],
  )

  const top3ByMarket = useMemo(
    () =>
      investments
        .slice()
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, 3),
    [investments],
  )

  const top3ByReturnNOK = useMemo(
    () =>
      investments
        .slice()
        .sort(
          (a, b) =>
            b.currentValue - b.purchaseValue - (a.currentValue - a.purchaseValue),
        )
        .slice(0, 3),
    [investments],
  )

  const top3ByReturnPct = useMemo(
    () =>
      investments
        .filter((inv) => inv.purchaseValue > 0)
        .slice()
        .sort((a, b) => {
          const pa = ((a.currentValue - a.purchaseValue) / a.purchaseValue) * 100
          const pb = ((b.currentValue - b.purchaseValue) / b.purchaseValue) * 100
          return pb - pa
        })
        .slice(0, 3),
    [investments],
  )

  const searchRowsLimited = useMemo(() => {
    if (!searchRows?.length) return null
    return searchRows.slice(0, SEARCH_RESULTS_LIMIT)
  }, [searchRows])

  const handleAdd = () => {
    if (!form.name || !form.purchaseValue) return
    addInvestment({
      id: generateId(),
      name: form.name,
      type: form.type,
      purchaseValue: Number(form.purchaseValue),
      currentValue: Number(form.currentValue) || Number(form.purchaseValue),
      purchaseDate: form.purchaseDate,
    })
    setForm({ name: '', type: 'funds', purchaseValue: '', currentValue: '', purchaseDate: '' })
    setShowForm(false)
  }

  function formatQuotePrice(value: number | null, currency: string) {
    if (value == null || !Number.isFinite(value)) return '—'
    return (
      new Intl.NumberFormat('nb-NO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(value) + (currency ? ` ${currency}` : '')
    )
  }

  function formatQuoteChange(value: number | null) {
    if (value == null || !Number.isFinite(value)) return '—'
    const sign = value > 0 ? '+' : ''
    return sign + new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(value)
  }

  function formatQuotePct(value: number | null) {
    if (value == null || !Number.isFinite(value)) return '—'
    const sign = value > 0 ? '+' : ''
    return sign + new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(value) + '%'
  }

  async function handleFetchQuotes() {
    const raw = quoteTickerInput.trim()
    if (!raw) {
      setQuoteError('Skriv inn søkeord eller ticker.')
      return
    }
    const isTickerList = raw.includes(',')

    setQuoteError(null)
    setQuoteLoading(true)
    setQuoteRows(null)
    setSearchRows(null)

    try {
      if (isTickerList) {
        const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
        if (parts.length === 0) {
          setQuoteError('Ingen ticker.')
          return
        }
        const { results } = await fetchQuoteSnapshots(parts)
        setQuoteRows(results)
        return
      }

      const { results: hits } = await fetchQuoteSearch(raw)
      if (hits.length === 0) {
        setQuoteError('Ingen treff.')
        return
      }

      const symbols = [...new Set(hits.map((h) => h.symbol).filter(Boolean))].slice(0, 30)
      const quoteBySymbol = new Map<string, QuoteSnapshot>()
      for (let i = 0; i < symbols.length; i += 10) {
        const chunk = symbols.slice(i, i + 10)
        const { results: qResults } = await fetchQuoteSnapshots(chunk)
        chunk.forEach((sym, j) => {
          const snap = qResults[j]
          if (snap) quoteBySymbol.set(sym, snap)
        })
      }

      const merged = hits.map((h) => ({
        ...h,
        quote: h.symbol ? quoteBySymbol.get(h.symbol) : undefined,
      }))
      setSearchRows(merged)
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : 'Kunne ikke hente data.')
      setQuoteRows(null)
      setSearchRows(null)
    } finally {
      setQuoteLoading(false)
    }
  }

  function openQuoteAddModal(hit: QuoteSearchHit & { quote?: QuoteSnapshot }) {
    setQuoteAddError(null)
    setQuoteAddForm({
      purchaseDate: isoDateLocal(),
      shares: '',
      purchaseNok: '',
      useQuotePlusFee: false,
    })
    setQuoteAddModal(hit)
  }

  async function handleQuoteAddSubmit() {
    if (!quoteAddModal) return
    setQuoteAddError(null)
    const purchaseDate = quoteAddForm.purchaseDate.trim()
    const rawShares = quoteAddForm.shares.replace(/\s/g, '').replace(',', '.')
    const shareNum = Number(rawShares)
    if (!purchaseDate || !Number.isFinite(shareNum) || shareNum <= 0) {
      setQuoteAddError('Fyll inn kjøpsdato og antall enheter (større enn 0).')
      return
    }

    setQuoteAddSaving(true)
    try {
      let q: QuoteSnapshot | undefined = quoteAddModal.quote
      if (!q || !q.ok) {
        const { results } = await fetchQuoteSnapshots([quoteAddModal.symbol.trim()])
        q = results[0]
      }
      if (!q || !q.ok) {
        setQuoteAddError('Kunne ikke hente kurs for denne tickeren.')
        return
      }
      const price = q.regularMarketPrice
      if (price == null || !Number.isFinite(price) || price <= 0) {
        setQuoteAddError('Ingen gyldig pris akkurat nå.')
        return
      }
      const cur = q.currency?.trim() || 'USD'
      const purchaseDigits = quoteAddForm.purchaseNok.replace(/\D/g, '')
      const manualPurchase = purchaseDigits ? Number(purchaseDigits) : 0

      let marketNok: number
      try {
        const rate = await fetchRateToNok(cur)
        marketNok = valueInNok(shareNum * price, cur, rate)
      } catch {
        if (quoteAddForm.useQuotePlusFee) {
          setQuoteAddError(
            'Kunne ikke hente valutakurs akkurat nå. Prøv igjen om et øyeblikk.',
          )
          return
        }
        if (manualPurchase > 0) {
          marketNok = manualPurchase
        } else {
          setQuoteAddError(
            'Kunne ikke hente valutakurs. Fyll inn kjøpsbeløp i NOK, eller prøv igjen senere.',
          )
          return
        }
      }

      let purchaseNok: number
      if (quoteAddForm.useQuotePlusFee) {
        purchaseNok = marketNok + DEFAULT_VALUTASURTASJE_NOK
      } else {
        purchaseNok = manualPurchase > 0 ? manualPurchase : marketNok
      }

      addInvestment({
        id: generateId(),
        name: quoteAddModal.description?.trim() || quoteAddModal.symbol,
        type: mapSearchTypeToInvestmentType(quoteAddModal.type || ''),
        purchaseValue: purchaseNok,
        currentValue: marketNok,
        purchaseDate,
        quoteSymbol: quoteAddModal.symbol.trim(),
        shares: shareNum,
        quoteCurrency: cur,
        history: [{ date: purchaseDate, value: purchaseNok }],
      })
      setQuoteAddModal(null)
      setQuoteAddForm({
        purchaseDate: '',
        shares: '',
        purchaseNok: '',
        useQuotePlusFee: false,
      })
      setQuoteRefreshTick((t) => t + 1)
    } catch (e) {
      setQuoteAddError(e instanceof Error ? e.message : 'Kunne ikke lagre.')
    } finally {
      setQuoteAddSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Investering" subtitle="Porteføljeoversikt og avkastning" />
      <div className="p-8 space-y-6">

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setDailyInsightOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            <Info size={14} aria-hidden />
            Mer om daglig verdi
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kjøpsverdi</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>{formatNOK(totalPurchased)}</p>

            <div className="mt-4 space-y-2">
              {top3ByPurchase.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{inv.name}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatNOK(inv.purchaseValue)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Markedsverdi</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--primary)' }}>{formatNOK(totalCurrent)}</p>

            <div className="mt-4 space-y-2">
              {top3ByMarket.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{inv.name}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatNOK(inv.currentValue)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total avkastning</p>
            <div className="flex items-center gap-2 mt-1">
              {totalReturn >= 0
                ? <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                : <TrendingDown size={18} style={{ color: 'var(--danger)' }} />}
              <p className="text-2xl font-bold" style={{ color: totalReturn >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatNOK(totalReturn)}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {top3ByReturnNOK.map((inv) => {
                const ret = inv.currentValue - inv.purchaseValue
                const good = ret >= 0
                return (
                  <div key={inv.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{inv.name}</span>
                    <span style={{ color: good ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{formatNOK(ret)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avkastning %</p>
            <p className="text-2xl font-bold mt-1" style={{ color: totalReturnPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(1)}%
            </p>

            <div className="mt-4 space-y-2">
              {top3ByReturnPct.map((inv) => {
                const ret = inv.currentValue - inv.purchaseValue
                const retPct = inv.purchaseValue > 0 ? (ret / inv.purchaseValue) * 100 : 0
                const good = retPct >= 0
                return (
                  <div key={inv.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{inv.name}</span>
                    <span style={{ color: good ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {good ? '+' : ''}{retPct.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 ${quoteSectionOpen ? 'pt-6 pb-0' : 'py-4'}`}
          >
            <button
              type="button"
              onClick={() => setQuoteSectionOpen((o) => !o)}
              className="flex items-center gap-3 min-w-0 text-left rounded-xl px-2 py-2 -ml-2 transition-colors hover:opacity-90"
              style={{ color: 'var(--text)' }}
              aria-expanded={quoteSectionOpen}
            >
              <ChevronDown
                size={20}
                className="shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{
                  color: 'var(--text-muted)',
                  transform: quoteSectionOpen ? 'rotate(180deg)' : undefined,
                }}
                aria-hidden
              />
              <span className="font-semibold">Kursoppslag</span>
              <span className="text-xs font-normal truncate hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                {quoteSectionOpen ? 'Skjul' : 'Åpne for søk i aksjer og fond'}
              </span>
            </button>
            {trackedSyncKey ? (
              <button
                type="button"
                onClick={() => setQuoteRefreshTick((t) => t + 1)}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:opacity-90 shrink-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                title="Hent fersk kurs og lagre dagens verdi i historikken"
              >
                <RefreshCw size={14} />
                Oppdater kurs og dagens verdi
              </button>
            ) : null}
          </div>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
            style={{ gridTemplateRows: quoteSectionOpen ? '1fr' : '0fr' }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="px-6 pb-6 pt-1 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <strong>Uten komma:</strong> søk på navn (f.eks. <code className="text-xs">apple</code> eller <code className="text-xs">vår energi</code>) — vi prøver også uten æ/ø/å og kjente tickere (EQNR). Bruk «Legg til» for å lagre posisjon.{' '}
            <strong>Med komma:</strong> bare oppslag (f.eks. <code className="text-xs">AAPL, MSFT</code>) uten å lagre posisjon.{' '}
            Instrumentvaluta (USD, EUR, …) fra kurs omregnes til NOK med Frankfurters gratiskurs (ECB) via vår server — samme ved hvert besøk eller når du oppdaterer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={quoteTickerInput}
              onChange={(e) => setQuoteTickerInput(e.target.value)}
              placeholder="Vår energi  eller  AAPL, MSFT"
              className="flex-1 px-3 py-2 rounded-xl text-sm min-w-0"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              disabled={quoteLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleFetchQuotes()
              }}
            />
            <button
              type="button"
              onClick={() => void handleFetchQuotes()}
              disabled={quoteLoading}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              <Search size={16} />
              {quoteLoading ? 'Henter…' : quoteTickerInput.includes(',') ? 'Hent kurs' : 'Søk'}
            </button>
          </div>
          {quoteError ? (
            <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{quoteError}</p>
          ) : null}
          {searchRowsLimited && searchRowsLimited.length > 0 ? (
            <div
              className="overflow-x-auto rounded-xl max-h-[28rem] overflow-y-auto"
              style={{ border: '1px solid var(--border)' }}
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Beskrivelse</th>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Ticker</th>
                    <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Type</th>
                    <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Siste</th>
                    <th className="text-right px-3 py-2 font-semibold hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Dag Δ</th>
                    <th className="text-right px-3 py-2 font-semibold hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Dag %</th>
                    <th className="text-left px-3 py-2 font-semibold hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Børs</th>
                    <th className="text-right px-3 py-2 font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Posisjon</th>
                  </tr>
                </thead>
                <tbody>
                  {searchRowsLimited.map((hit, idx) => {
                    const q = hit.quote
                    const ok = q && q.ok
                    const err = q && !q.ok ? q : null
                    return (
                      <tr key={`${hit.symbol}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 max-w-[14rem]" style={{ color: 'var(--text)' }}>
                          {hit.description || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {hit.displaySymbol ?? hit.symbol}
                        </td>
                        <td className="px-3 py-2 text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                          {hit.type || '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums align-top" style={{ color: 'var(--text)' }}>
                          {ok ? (
                            formatQuotePrice(q.regularMarketPrice, q.currency)
                          ) : err ? (
                            <span className="text-xs" style={{ color: 'var(--danger)' }} title={err.error}>
                              {err.error.length > 40 ? `${err.error.slice(0, 40)}…` : err.error}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums hidden md:table-cell"
                          style={{
                            color:
                              ok && q.regularMarketChange != null && q.regularMarketChange >= 0
                                ? 'var(--success)'
                                : 'var(--danger)',
                          }}
                        >
                          {ok ? formatQuoteChange(q.regularMarketChange) : '—'}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums hidden md:table-cell"
                          style={{
                            color:
                              ok && q.regularMarketChangePercent != null && q.regularMarketChangePercent >= 0
                                ? 'var(--success)'
                                : 'var(--danger)',
                          }}
                        >
                          {ok ? formatQuotePct(q.regularMarketChangePercent) : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>
                          {ok ? `${q.exchange} (${q.marketState})` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right align-top">
                          <button
                            type="button"
                            onClick={() => openQuoteAddModal(hit)}
                            className="px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
                            style={{
                              background: 'var(--primary-pale)',
                              color: 'var(--primary)',
                              border: '1px solid var(--accent)',
                            }}
                          >
                            Legg til
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {searchRows && searchRows.length > SEARCH_RESULTS_LIMIT ? (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Viser første {SEARCH_RESULTS_LIMIT} av {searchRows.length} treff — presiser søket for færre resultater.
            </p>
          ) : null}
          {quoteRows && quoteRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Navn</th>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Ticker</th>
                    <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Siste</th>
                    <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Dag Δ</th>
                    <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Dag %</th>
                    <th className="text-left px-3 py-2 font-semibold hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Børs</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteRows.map((row, idx) =>
                    row.ok ? (
                      <tr key={`${row.symbol}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{row.shortName}</td>
                        <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{row.symbol}</td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                          {formatQuotePrice(row.regularMarketPrice, row.currency)}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums"
                          style={{
                            color:
                              row.regularMarketChange != null && row.regularMarketChange >= 0
                                ? 'var(--success)'
                                : 'var(--danger)',
                          }}
                        >
                          {formatQuoteChange(row.regularMarketChange)}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums"
                          style={{
                            color:
                              row.regularMarketChangePercent != null && row.regularMarketChangePercent >= 0
                                ? 'var(--success)'
                                : 'var(--danger)',
                          }}
                        >
                          {formatQuotePct(row.regularMarketChangePercent)}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                          {row.exchange} ({row.marketState})
                        </td>
                      </tr>
                    ) : (
                      <tr key={`${row.symbol}-err-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 font-mono text-xs" colSpan={6} style={{ color: 'var(--danger)' }}>
                          {row.symbol}: {row.error}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Data fra Finnhub under deres vilkår og kvoter. Priser i instrumentets valuta — ikke bland med NOK uten egen omregning.
          </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Utvikling i porteføljen</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Samlet markedsverdi over tid. Grafen krever minst tre historikkpunkter (bygges blant annet automatisk for kurskoblede posisjoner når du åpner siden flere dager).
          </p>

          {showPortfolioGraph ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                  <XAxis dataKey="date" tickFormatter={(d) => formatDateLabel(String(d))} tick={{ fill: '#6B7A99', fontSize: 12 }} />
                  <YAxis
                    domain={portfolioDomain}
                    tickFormatter={(v) => formatNOK(Number(v))}
                    tick={{ fill: '#6B7A99', fontSize: 12 }}
                  />
                  <Tooltip formatter={(v) => formatNOK(v == null ? 0 : Number(v))} />
                  <Line type="monotone" dataKey="total" stroke="#3B5BDB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Legg inn historikk manuelt (minst 3 verdier), eller bruk kurskoblede posisjoner og besøk siden flere dager slik at det logges nok punkter til en kurve.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Portefølje</h2>
            <div className="space-y-3">
              {investments.map((inv) => {
                const isQuoteTracked =
                  Boolean(inv.quoteSymbol?.trim()) && inv.shares != null && inv.shares > 0
                const ret = inv.currentValue - inv.purchaseValue
                const retPct = inv.purchaseValue > 0 ? (ret / inv.purchaseValue) * 100 : 0
                const color = typeColors[inv.type]
                const historySorted = (inv.history ?? []).slice().sort((a, b) => dateToTime(a.date) - dateToTime(b.date))
                const last3 = historySorted.slice(-3)
                const last3Values = last3.map((p) => p.value)
                const retColor = ret >= 0 ? 'var(--success)' : 'var(--danger)'
                const retPctGood = retPct >= 0
                return (
                  <div
                    key={inv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setHistoryOpenFor(inv.id)
                      setHistoryForm({ date: todayISO(), value: '' })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setHistoryOpenFor(inv.id)
                        setHistoryForm({ date: todayISO(), value: '' })
                      }
                    }}
                    className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 p-3 rounded-xl cursor-pointer min-w-0"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex gap-3 items-start md:items-center min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '20' }}>
                        <span className="text-xs font-bold" style={{ color }}>{inv.type.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{inv.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{typeLabels[inv.type]}</p>
                        {isQuoteTracked ? (
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--primary)' }}>
                            {inv.shares} stk · {inv.quoteSymbol}
                            {inv.quoteCurrency ? ` · ${inv.quoteCurrency}` : ''} · markedsverdi oppdateres ved besøk
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full md:w-auto md:min-w-[220px] md:max-w-md md:flex-shrink-0 text-xs md:text-sm">
                      <div>
                        <p className="text-[10px] md:text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Kjøp</p>
                        <p className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{formatNOK(inv.purchaseValue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Marked</p>
                        <p className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{formatNOK(inv.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Avkastning</p>
                        <p className="font-semibold tabular-nums" style={{ color: retColor }}>{formatNOK(ret)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Avkastning %</p>
                        <p className="font-semibold tabular-nums" style={{ color: retPctGood ? 'var(--success)' : 'var(--danger)' }}>
                          {retPctGood ? '+' : ''}{retPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {last3Values.length > 0 ? (
                      <div
                        className="hidden md:flex flex-col gap-1 flex-shrink-0"
                        title="Siste tre registrerte historikkverdier for posisjonen"
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Historikk
                        </p>
                        <div className="flex items-center gap-2">
                          <MiniSparkline values={last3Values} color={color} />
                          <div className="flex flex-col" style={{ lineHeight: '1.1' }}>
                            {last3.map((p) => (
                              <div key={p.id ?? `${p.date}-${p.value}`} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {formatNOKCompact(p.value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div
                      className="flex items-center gap-2 w-full md:w-auto md:flex-shrink-0 mt-0.5 md:mt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isQuoteTracked ? (
                        <div
                          className="min-w-0 flex-1 md:flex-initial md:w-28 px-2 py-1.5 rounded-lg text-xs text-right tabular-nums"
                          style={{ border: '1px dashed var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
                          title="Markedsverdi i NOK fra siste kurs; historikk får et punkt per dag du åpner siden"
                        >
                          {formatNOK(inv.currentValue)}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentValueInputs[inv.id] ?? formatNOKThousandsInput(String(inv.currentValue))}
                          onFocus={() => {
                            setCurrentValueInputs((s) => ({
                              ...s,
                              [inv.id]: s[inv.id] ?? formatNOKThousandsInput(String(inv.currentValue)),
                            }))
                          }}
                          onBlur={() => {
                            setCurrentValueInputs((s) => {
                              const next = { ...s }
                              delete next[inv.id]
                              return next
                            })
                          }}
                          onChange={(e) => {
                            const formatted = formatNOKThousandsInput(e.target.value)
                            setCurrentValueInputs((s) => ({ ...s, [inv.id]: formatted }))
                            const digits = formatted.replace(/\D/g, '')
                            const valueNum = digits ? Number(digits) : 0
                            if (!Number.isFinite(valueNum)) return
                            updateInvestment(inv.id, { currentValue: valueNum })
                          }}
                          className="min-w-0 flex-1 md:flex-initial md:w-28 px-2 py-1.5 rounded-lg text-xs text-right"
                          style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                          placeholder="Oppdater verdi"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryOpenFor(inv.id)
                          setHistoryForm({ date: todayISO(), value: '' })
                        }}
                        className="p-2 rounded-lg transition-colors hover:opacity-70 flex-shrink-0"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                        title="Legg til historikk"
                      >
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button type="button" className="flex-shrink-0" onClick={() => removeInvestment(inv.id)}>
                        <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Fordeling</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                  {byType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNOK(v == null ? 0 : Number(v))} />
                <Legend formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {showForm ? (
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Legg til investering</h2>
            <div className="grid grid-cols-3 gap-4">
              <input placeholder="Navn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Investment['type'] })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input placeholder="Kjøpsverdi (NOK)" type="number" value={form.purchaseValue} onChange={(e) => setForm({ ...form, purchaseValue: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              <input placeholder="Nåværende verdi (NOK)" type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAdd} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
                Legg til
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--primary)' }}>
            <Plus size={16} />
            Legg til investering
          </button>
        )}

      </div>

      {quoteAddModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => {
            if (!quoteAddSaving) setQuoteAddModal(null)
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Legg til posisjon
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                  {quoteAddModal.description?.trim() || quoteAddModal.symbol}
                </p>
                <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {quoteAddModal.displaySymbol ?? quoteAddModal.symbol}
                </p>
                {quoteModalFxHint ? (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {quoteModalFxHint}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!quoteAddSaving) setQuoteAddModal(null)
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                title="Lukk"
                disabled={quoteAddSaving}
              >
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {quoteAddError ? (
              <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{quoteAddError}</p>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Kjøpsdato
                </label>
                <input
                  type="date"
                  value={quoteAddForm.purchaseDate}
                  onChange={(e) => setQuoteAddForm((s) => ({ ...s, purchaseDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  disabled={quoteAddSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Antall (aksjer / enheter)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quoteAddForm.shares}
                  onChange={(e) => setQuoteAddForm((s) => ({ ...s, shares: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  placeholder="F.eks. 10 eller 2,5"
                  disabled={quoteAddSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Kjøpsbeløp (NOK)
                </label>
                <input
                  type="text"
                  value={quoteAddForm.purchaseNok}
                  onChange={(e) => {
                    const formatted = formatNOKThousandsInput(e.target.value)
                    setQuoteAddForm((s) => ({
                      ...s,
                      purchaseNok: formatted,
                      useQuotePlusFee: false,
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    border: '1px solid var(--border)',
                    background: quoteAddForm.useQuotePlusFee ? 'var(--surface)' : 'var(--bg)',
                    color: quoteAddForm.useQuotePlusFee ? 'var(--text-muted)' : 'var(--text)',
                  }}
                  placeholder="Hva du faktisk betalte totalt"
                  disabled={quoteAddSaving || quoteAddForm.useQuotePlusFee}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Brukes som kjøpsverdi for avkastning (kurs, valuta og megler varierer). Tomt felt uten avkrysning under ≈
                  dagens markedsverdi i NOK.
                </p>
              </div>

              <label
                className="flex items-start gap-3 cursor-pointer rounded-xl p-3"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                }}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded"
                  checked={quoteAddForm.useQuotePlusFee}
                  disabled={quoteAddSaving}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setQuoteAddForm((s) => ({
                      ...s,
                      useQuotePlusFee: checked,
                      purchaseNok: checked ? '' : s.purchaseNok,
                    }))
                  }}
                />
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Bruk siste kurs × antall i NOK + standard valutasurtasje {DEFAULT_VALUTASURTASJE_NOK} kr
                  <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Passer når du vil estimere kostnad uten eksakt beløp: markedsverdi etter Frankfurter-kurs pluss et fast
                    påslag (typisk bank/megler).
                  </span>
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => void handleQuoteAddSubmit()}
                disabled={quoteAddSaving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                {quoteAddSaving ? 'Lagrer…' : 'Lagre i porteføljen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quoteAddSaving) setQuoteAddModal(null)
                }}
                disabled={quoteAddSaving}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dailyInsightOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setDailyInsightOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-lg font-semibold pr-2" style={{ color: 'var(--text)' }}>
                Daglig innsikt i verdi
              </h2>
              <button
                type="button"
                onClick={() => setDailyInsightOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                title="Lukk"
              >
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              For aksjer og annet du har koblet til kurs, lagres et verdipunkt for dagens dato når du åpner siden eller trykker
              «Oppdater kurs og dagens verdi». I tillegg kjøres en daglig serverjobb (planlagt ca. kl. 16:00 norsk vintertid) som
              henter kurs på nytt og oppdaterer bare disse posisjonene i lagret data — slik at verdiene kan være ferske selv om du
              ikke har vært innom. Sommertid blir klokkeslettet tilsvarende én time annerledes (UTC).
            </p>
            <button
              type="button"
              onClick={() => setDailyInsightOpen(false)}
              className="mt-5 w-full px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Lukk
            </button>
          </div>
        </div>
      ) : null}

      {historyOpenFor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setHistoryOpenFor(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Historikk: {activeHistoryInvestment?.name ?? 'Investering'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Legg inn dato og nåværende verdi. Etter minst 3 verdier vises graf.
                </p>
              </div>

              <button
                onClick={() => setHistoryOpenFor(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                title="Lukk"
              >
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-5">
              <div
                className="rounded-xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Start og endring</h3>

                {activeHistoryInvestment ? (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Startverdi</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                          {formatNOK(activeHistoryInvestment.purchaseValue)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {activeHistoryInvestment.purchaseDate ? `Dato: ${formatDateLabel(activeHistoryInvestment.purchaseDate)}` : 'Dato: -'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nåværende verdi</p>
                        <p className="text-lg font-bold mt-1" style={{ color: 'var(--primary)' }}>
                          {formatNOK(activeHistoryInvestment.currentValue)}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const delta = activeHistoryInvestment.currentValue - activeHistoryInvestment.purchaseValue
                      const pct = activeHistoryInvestment.purchaseValue !== 0
                        ? (delta / activeHistoryInvestment.purchaseValue) * 100
                        : 0
                      const good = delta >= 0

                      return (
                        <div className="rounded-xl p-3" style={{ background: 'var(--primary-pale)', border: '1px solid var(--accent)' }}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Endring</p>
                            <p className="text-sm font-semibold" style={{ color: good ? 'var(--success)' : 'var(--danger)' }}>
                              {good ? '+' : ''}{formatNOK(delta)} ({good ? '+' : ''}{pct.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ingen investering valgt.</p>
                )}
              </div>

              <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Legg til ny verdi</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Dato</label>
                    <input
                      type="date"
                      value={historyForm.date}
                      onChange={(e) => setHistoryForm((s) => ({ ...s, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Verdi (NOK)</label>
                    <input
                      type="text"
                      value={historyForm.value}
                      onChange={(e) => {
                        const formatted = formatNOKThousandsInput(e.target.value)
                        setHistoryForm((s) => ({ ...s, value: formatted }))
                      }}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                      placeholder="F.eks. 148 000"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      if (!historyOpenFor) return
                      const date = historyForm.date
                      const digits = historyForm.value.replace(/\D/g, '')
                      const valueNum = Number(digits)
                      if (!date || !Number.isFinite(valueNum)) return
                      addInvestmentHistoryValue(historyOpenFor, { date, value: valueNum })
                      setHistoryForm((s) => ({ ...s, value: '' }))
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                    style={{ background: 'var(--primary)' }}
                    title="Legg til"
                  >
                    Legg til
                  </button>

                  <button
                    onClick={() => setHistoryForm({ date: historyForm.date || todayISO(), value: '' })}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    title="Nullstill"
                  >
                    Nullstill
                  </button>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Verdier</h3>

                {activeHistoryPoints.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ingen historikk ennå. Legg inn din første verdi over tid.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-auto pr-2">
                    {activeHistoryPoints
                      .slice()
                      .sort((a, b) => dateToTime(a.date) - dateToTime(b.date))
                      .map((p) => (
                        <div
                          key={p.id ?? `${p.date}-${p.value}`}
                          className="flex items-center justify-between text-sm"
                        >
                          <span style={{ color: 'var(--text-muted)' }}>{formatDateLabel(p.date)}</span>
                          <div className="flex items-center gap-3">
                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatNOK(p.value)}</span>
                            <button
                              onClick={() =>
                                removeInvestmentHistoryValue(historyOpenFor, {
                                  id: p.id,
                                  date: p.date,
                                  value: p.value,
                                })
                              }
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                              title="Slett verdi"
                            >
                              <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {activeHistoryPoints.length >= 3 ? (
                <>
                  <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Graf: verdi over tid</h3>

                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeHistoryPoints.map((p) => ({ date: p.date, value: p.value }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                          <XAxis dataKey="date" tickFormatter={(d) => formatDateLabel(String(d))} tick={{ fill: '#6B7A99', fontSize: 12 }} />
                          <YAxis
                            domain={historyValueDomain as [number, number]}
                            tickFormatter={(v) => formatNOK(Number(v))}
                            tick={{ fill: '#6B7A99', fontSize: 12 }}
                          />
                          <Tooltip formatter={(v) => formatNOK(v == null ? 0 : Number(v))} />
                          <Line type="monotone" dataKey="value" stroke="#3B5BDB" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Graf: trend i %</h3>
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeHistoryTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                          <XAxis dataKey="date" tickFormatter={(d) => formatDateLabel(String(d))} tick={{ fill: '#6B7A99', fontSize: 12 }} />
                          <YAxis
                            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                            tick={{ fill: '#6B7A99', fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(v) => `${Number(v ?? 0).toFixed(1)}%`}
                          />
                          <Line type="monotone" dataKey="pct" stroke="#0CA678" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Legg til minst 3 verdier for å se grafen.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
