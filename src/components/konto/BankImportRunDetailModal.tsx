'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { BankImportLineSnapshot, BankImportRun } from '@/lib/bankImport/types'
import type { Transaction } from '@/lib/store'
import { useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { X } from 'lucide-react'

const SOURCE_LABEL: Record<string, string> = {
  dnb_sbanken: 'DNB / Sbanken',
  sparebank1: 'Sparebank 1',
}

type Props = {
  open: boolean
  onClose: () => void
  run: BankImportRun | null
  profileName: string
  importedTransactions: Transaction[]
}

function aggregateFromBankSnapshots(lines: BankImportLineSnapshot[]) {
  let inc = 0
  let exp = 0
  let dMin: string | null = null
  let dMax: string | null = null
  const catMap = new Map<string, { category: string; type: 'income' | 'expense'; count: number; sum: number }>()

  for (const l of lines) {
    if (l.type === 'income') inc += l.amount
    else exp += l.amount
    const d = l.dateIso
    if (d && d.length >= 10) {
      if (!dMin || d < dMin) dMin = d
      if (!dMax || d > dMax) dMax = d
    }
    const key = `${l.type}\t${l.categoryName}`
    const cur = catMap.get(key) ?? { category: l.categoryName, type: l.type, count: 0, sum: 0 }
    cur.count += 1
    cur.sum += l.amount
    catMap.set(key, cur)
  }

  const byCategory = [...catMap.values()].sort((a, b) => b.sum - a.sum)
  return { sumIncome: inc, sumExpense: exp, dateMin: dMin, dateMax: dMax, byCategory }
}

function aggregateFromTransactions(txs: Transaction[]) {
  let inc = 0
  let exp = 0
  let dMin: string | null = null
  let dMax: string | null = null
  const catMap = new Map<string, { category: string; type: 'income' | 'expense'; count: number; sum: number }>()

  for (const t of txs) {
    if (t.type === 'income') inc += t.amount
    else exp += t.amount
    const d = t.date
    if (d && d.length >= 10) {
      if (!dMin || d < dMin) dMin = d
      if (!dMax || d > dMax) dMax = d
    }
    const key = `${t.type}\t${t.category}`
    const cur = catMap.get(key) ?? { category: t.category, type: t.type, count: 0, sum: 0 }
    cur.count += 1
    cur.sum += t.amount
    catMap.set(key, cur)
  }

  const byCategory = [...catMap.values()].sort((a, b) => b.sum - a.sum)
  return { sumIncome: inc, sumExpense: exp, dateMin: dMin, dateMax: dMax, byCategory }
}

export default function BankImportRunDetailModal({
  open,
  onClose,
  run,
  profileName,
  importedTransactions,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const backdropDismiss = useModalBackdropDismiss(onClose)
  const updateBankImportRunDisplayName = useStore((s) => s.updateBankImportRunDisplayName)
  const liveFromStore = useStore((s) => (run?.id ? s.bankImportHistory.find((r) => r.id === run.id) : undefined))
  const displayRun = liveFromStore ?? run ?? null
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [displayNameDraft, setDisplayNameDraft] = useState('')

  useEffect(() => {
    if (!open || !run) {
      setEditingDisplayName(false)
      setDisplayNameDraft('')
      return
    }
    setEditingDisplayName(false)
  }, [open, run])

  useEffect(() => {
    if (!displayRun || editingDisplayName) return
    setDisplayNameDraft(displayRun.displayName?.trim() ?? '')
  }, [displayRun?.displayName, displayRun?.id, editingDisplayName, displayRun])

  const snapshots = displayRun?.importedLines
  const hasSnapshots = (snapshots?.length ?? 0) > 0

  const sortedSnapshots = useMemo(() => {
    if (!snapshots?.length) return []
    return [...snapshots].sort((a, b) => b.dateIso.localeCompare(a.dateIso) || b.fileLine - a.fileLine)
  }, [snapshots])

  const { sumIncome, sumExpense, dateMin, dateMax, byCategory, lineCount } = useMemo(() => {
    if (hasSnapshots && snapshots) {
      const a = aggregateFromBankSnapshots(snapshots)
      return { ...a, lineCount: snapshots.length }
    }
    const a = aggregateFromTransactions(importedTransactions)
    return { ...a, lineCount: importedTransactions.length }
  }, [hasSnapshots, snapshots, importedTransactions])

  const transaksjonerHref = useMemo(() => {
    const y = dateMin?.slice(0, 4) ?? dateMax?.slice(0, 4)
    if (!y) return '/transaksjoner'
    return `/transaksjoner?year=${encodeURIComponent(y)}&month=all`
  }, [dateMin, dateMax])

  if (!open || !run || !displayRun) return null

  const hasLineDetails = hasSnapshots || importedTransactions.length > 0
  const sourceLabel = SOURCE_LABEL[displayRun.sourceId] ?? displayRun.sourceId
  const titleDate = formatIsoDateDdMmYyyy(displayRun.createdAt.slice(0, 10))
  const txLinkedCount = importedTransactions.length

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      role="presentation"
      {...backdropDismiss}
    >
      <div
        className="w-full max-w-5xl min-w-0 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-import-run-detail-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
          <div className="min-w-0 pr-2 flex-1">
            {editingDisplayName ? (
              <div className="space-y-2">
                <h3 id="bank-import-run-detail-title" className="sr-only">
                  Rediger visningsnavn for import
                </h3>
                <label htmlFor="bank-import-edit-display-name" className="sr-only">
                  Visningsnavn for import
                </label>
                <input
                  id="bank-import-edit-display-name"
                  type="text"
                  value={displayNameDraft}
                  onChange={(e) => setDisplayNameDraft(e.target.value)}
                  maxLength={120}
                  autoComplete="off"
                  className="w-full max-w-md rounded-xl border px-3 py-2.5 text-sm min-h-[44px] touch-manipulation"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white min-h-[44px] touch-manipulation"
                    style={{ background: 'var(--primary)' }}
                    onClick={() => {
                      const t = displayNameDraft.trim()
                      updateBankImportRunDisplayName(displayRun.id, t.length ? t : null)
                      setEditingDisplayName(false)
                    }}
                  >
                    Lagre
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-medium min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                    onClick={() => {
                      setDisplayNameDraft(displayRun.displayName?.trim() ?? '')
                      setEditingDisplayName(false)
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 id="bank-import-run-detail-title" className="font-semibold text-lg m-0" style={{ color: 'var(--text)' }}>
                  {displayRun.displayName?.trim() ? displayRun.displayName.trim() : `Bankimport ${titleDate}`}
                </h3>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium touch-manipulation min-h-[44px] px-1 -ml-1 text-left"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    setDisplayNameDraft(displayRun.displayName?.trim() ?? '')
                    setEditingDisplayName(true)
                  }}
                >
                  Rediger navn
                </button>
              </>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {displayRun.displayName?.trim() ? `Import ${titleDate} · ` : ''}
              {sourceLabel}
              {displayRun.fileName ? ` · ${displayRun.fileName}` : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Profil: <span style={{ color: 'var(--text)' }}>{profileName}</span>
              {displayRun.csvProfileId ? ` · Profil-ID: ${displayRun.csvProfileId}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg shrink-0 touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        <section className="mb-5" aria-label="Sammendrag fra import">
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Tall fra import
          </h4>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm rounded-xl border p-3"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Rader i opplasting
              </div>
              <div className="tabular-nums font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                {displayRun.rowCountParsed}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Importert
              </div>
              <div className="tabular-nums font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                {displayRun.rowCountImported}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Hoppet over
              </div>
              <div className="tabular-nums font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                {displayRun.rowCountSkipped}
              </div>
            </div>
          </div>
          {displayRun.errorSummary && (
            <p className="text-xs mt-2 rounded-lg px-2 py-2" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {displayRun.errorSummary}
            </p>
          )}
        </section>

        {hasLineDetails ? (
          <>
            <section className="mb-4" aria-label="Oppsummering">
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Oppsummering
              </h4>
              <ul className="text-sm space-y-1 rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                <li style={{ color: 'var(--text)' }}>
                  <strong>{lineCount}</strong> linje{lineCount === 1 ? '' : 'r'}{' '}
                  {hasSnapshots ? '(arkivert ved import)' : 'knyttet til importen'}
                </li>
                {hasSnapshots && txLinkedCount !== lineCount && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    I transaksjonslisten nå:{' '}
                    <strong style={{ color: 'var(--text)' }}>{txLinkedCount}</strong>{' '}
                    med samme import-ID
                  </li>
                )}
                {dateMin && dateMax && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    Datoer: {formatIsoDateDdMmYyyy(dateMin)} – {formatIsoDateDdMmYyyy(dateMax)}
                  </li>
                )}
                {sumIncome > 0 && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    Sum inntektslinjer:{' '}
                    <strong style={{ color: 'var(--text)' }}>{formatNOK(sumIncome)}</strong>
                  </li>
                )}
                {sumExpense > 0 && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    Sum utgiftslinjer:{' '}
                    <strong style={{ color: 'var(--text)' }}>{formatNOK(sumExpense)}</strong>
                  </li>
                )}
              </ul>
            </section>

            {byCategory.length > 0 && (
              <section className="mb-4" aria-label="Per kategori">
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Per kategori
                </h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="overflow-x-auto max-h-[min(30vh,12rem)] overflow-y-auto">
                    <table className="w-full text-sm min-w-[320px]">
                      <thead>
                        <tr style={{ background: 'color-mix(in srgb, var(--surface) 90%, var(--border))' }}>
                          <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                            Kategori
                          </th>
                          <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                            Type
                          </th>
                          <th className="text-right font-medium px-3 py-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            Ant.
                          </th>
                          <th className="text-right font-medium px-3 py-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            Sum
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {byCategory.map((row) => (
                          <tr key={`${row.type}-${row.category}`} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-3 py-2 min-w-0" style={{ color: 'var(--text)' }}>
                              {row.category}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                              {row.type === 'income' ? 'Inntekt' : 'Utgift'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                              {row.count}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                              {formatNOK(row.sum)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {hasSnapshots ? (
              <section className="mb-4" aria-label="Alle linjer">
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Hver linje
                </h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="overflow-x-auto max-h-[min(52vh,22rem)] overflow-y-auto">
                    <table className="w-full text-[11px] min-w-[560px]">
                      <thead>
                        <tr style={{ background: 'color-mix(in srgb, var(--surface) 90%, var(--border))' }}>
                          <th className="text-right font-medium px-1.5 py-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            Rad
                          </th>
                          <th className="text-left font-medium px-1.5 py-2" style={{ color: 'var(--text-muted)' }}>
                            Dato
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 min-w-[8rem]" style={{ color: 'var(--text-muted)' }}>
                            Forklaring
                          </th>
                          <th className="text-right font-medium px-1.5 py-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            Beløp
                          </th>
                          <th className="text-left font-medium px-1.5 py-2" style={{ color: 'var(--text-muted)' }}>
                            Kategori
                          </th>
                          <th className="text-left font-medium px-1.5 py-2" style={{ color: 'var(--text-muted)' }}>
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSnapshots.map((l, idx) => (
                          <tr key={`${l.fileLine}-${l.dateIso}-${idx}`} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-1.5 py-1.5 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                              {l.fileLine}
                            </td>
                            <td className="px-1.5 py-1.5 tabular-nums whitespace-nowrap" style={{ color: 'var(--text)' }}>
                              {formatIsoDateDdMmYyyy(l.dateIso)}
                            </td>
                            <td className="px-1.5 py-1.5 min-w-0 break-words" style={{ color: 'var(--text-muted)' }}>
                              {l.forklaringRaw || '—'}
                            </td>
                            <td className="px-1.5 py-1.5 text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                              {formatNOK(l.amount)}
                            </td>
                            <td className="px-1.5 py-1.5 min-w-0" style={{ color: 'var(--text)' }}>
                              {l.categoryName}
                            </td>
                            <td className="px-1.5 py-1.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                              {l.type === 'income' ? 'Inntekt' : 'Utgift'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-4" aria-label="Transaksjoner">
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Poster fra transaksjonsliste
                </h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="overflow-x-auto max-h-[min(40vh,18rem)] overflow-y-auto">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead>
                        <tr style={{ background: 'color-mix(in srgb, var(--surface) 90%, var(--border))' }}>
                          <th className="text-left font-medium px-2 py-2" style={{ color: 'var(--text-muted)' }}>
                            Dato
                          </th>
                          <th className="text-left font-medium px-2 py-2" style={{ color: 'var(--text-muted)' }}>
                            Kategori
                          </th>
                          <th className="text-right font-medium px-2 py-2" style={{ color: 'var(--text-muted)' }}>
                            Beløp
                          </th>
                          <th className="text-left font-medium px-2 py-2" style={{ color: 'var(--text-muted)' }}>
                            Beskrivelse
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedTransactions.map((t) => (
                          <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-2 py-1.5 tabular-nums whitespace-nowrap" style={{ color: 'var(--text)' }}>
                              {formatIsoDateDdMmYyyy(t.date)}
                            </td>
                            <td className="px-2 py-1.5 min-w-0" style={{ color: 'var(--text)' }}>
                              {t.category}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                              {formatNOK(t.amount)}
                            </td>
                            <td className="px-2 py-1.5 min-w-0" style={{ color: 'var(--text-muted)' }}>
                              {t.description || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            <p className="text-sm m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <Link
                href={transaksjonerHref}
                className="font-medium underline-offset-2 hover:underline touch-manipulation"
                style={{ color: 'var(--primary)' }}
                onClick={onClose}
              >
                Åpne transaksjoner for dette året
              </Link>
              {' — '}Juster enkelttransaksjoner der.
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen detaljer for denne importen.
          </p>
        )}
      </div>
    </div>
  )
}
