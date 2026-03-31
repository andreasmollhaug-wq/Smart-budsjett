'use client'
import { useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance, Investment } from '@/lib/store'
import { formatNOK, generateId } from '@/lib/utils'
import { Plus, Trash2, TrendingUp, TrendingDown, Clock, X } from 'lucide-react'
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

export default function InvesteringPage() {
  const { investments, addInvestment, removeInvestment, updateInvestment, addInvestmentHistoryValue, removeInvestmentHistoryValue } = useActivePersonFinance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'funds' as Investment['type'],
    purchaseValue: '', currentValue: '', purchaseDate: ''
  })

  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null)
  const [historyForm, setHistoryForm] = useState({ date: '', value: '' })
  const [currentValueInputs, setCurrentValueInputs] = useState<Record<string, string>>({})

  function todayISO() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = `${d.getMonth() + 1}`.padStart(2, '0')
    const dd = `${d.getDate()}`.padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
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

  const activeHistoryPoints = activeHistoryInvestment
    ? (activeHistoryInvestment.history ?? []).slice().sort((a, b) => dateToTime(a.date) - dateToTime(b.date))
    : []

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

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Investering" subtitle="Porteføljeoversikt og avkastning" />
      <div className="p-8 space-y-6">

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
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avkastning %</p>
            <p className="text-2xl font-bold mt-1" style={{ color: totalReturnPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Utvikling i porteføljen</h2>

          {showPortfolioGraph ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                  <XAxis dataKey="date" tickFormatter={(d) => formatDateLabel(String(d))} tick={{ fill: '#6B7A99', fontSize: 12 }} />
                  <YAxis
                    domain={portfolioDomain as any}
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
              Legg inn historikk (minst 3 verdier) for å se grafen.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Portefølje</h2>
            <div className="space-y-3">
              {investments.map((inv) => {
                const ret = inv.currentValue - inv.purchaseValue
                const retPct = inv.purchaseValue > 0 ? (ret / inv.purchaseValue) * 100 : 0
                const color = typeColors[inv.type]
                const historySorted = (inv.history ?? []).slice().sort((a, b) => dateToTime(a.date) - dateToTime(b.date))
                const last3 = historySorted.slice(-3)
                const last3Values = last3.map((p) => p.value)
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
                    className="flex items-center gap-4 p-3 rounded-xl cursor-pointer"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: color + '20' }}>
                      <span className="text-xs font-bold" style={{ color }}>{inv.type.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{inv.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{typeLabels[inv.type]}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{formatNOK(inv.currentValue)}</p>
                      <p className="text-xs" style={{ color: ret >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {ret >= 0 ? '+' : ''}{retPct.toFixed(1)}%
                      </p>
                    </div>

                    {last3Values.length > 0 ? (
                      <div className="flex items-center gap-2 flex-shrink-0 hidden md:flex">
                        <MiniSparkline values={last3Values} color={color} />
                        <div className="flex flex-col" style={{ lineHeight: '1.1' }}>
                          {last3.map((p) => (
                            <div key={p.id ?? `${p.date}-${p.value}`} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {formatNOKCompact(p.value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                        className="w-28 px-2 py-1.5 rounded-lg text-xs text-right"
                        style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        placeholder="Oppdater verdi"
                      />
                      <button
                        onClick={() => {
                          setHistoryOpenFor(inv.id)
                          setHistoryForm({ date: todayISO(), value: '' })
                        }}
                        className="p-2 rounded-lg transition-colors hover:opacity-70"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                        title="Legg til historikk"
                      >
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button onClick={() => removeInvestment(inv.id)}>
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
