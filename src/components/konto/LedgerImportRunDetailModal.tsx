'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { LedgerImportLineSnapshot, LedgerImportRun } from '@/lib/ledgerImport/types'
import type { Transaction } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { X } from 'lucide-react'

const SOURCE_LABEL: Record<string, string> = {
  conta: 'Conta',
  tripletex: 'Tripletex',
  fiken: 'Fiken',
  twentyfourseven: '24SevenOffice',
  generic: 'Generisk',
}

type Props = {
  open: boolean
  onClose: () => void
  run: LedgerImportRun | null
  profileName: string
  importedTransactions: Transaction[]
}

function aggregateFromSnapshots(lines: LedgerImportLineSnapshot[]) {
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

export default function LedgerImportRunDetailModal({
  open,
  onClose,
  run,
  profileName,
  importedTransactions,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const backdropDismiss = useModalBackdropDismiss(onClose)

  const snapshots = run?.importedLines
  const hasSnapshots = (snapshots?.length ?? 0) > 0

  const sortedSnapshots = useMemo(() => {
    if (!snapshots?.length) return []
    return [...snapshots].sort((a, b) => b.dateIso.localeCompare(a.dateIso) || b.fileLine - a.fileLine)
  }, [snapshots])

  const { sumIncome, sumExpense, dateMin, dateMax, byCategory, lineCount } = useMemo(() => {
    if (hasSnapshots && snapshots) {
      const a = aggregateFromSnapshots(snapshots)
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

  if (!open || !run) return null

  const hasLineDetails = hasSnapshots || importedTransactions.length > 0
  const sourceLabel = SOURCE_LABEL[run.sourceId] ?? run.sourceId
  const titleDate = formatIsoDateDdMmYyyy(run.createdAt.slice(0, 10))
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
        aria-labelledby="ledger-import-run-detail-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
          <div className="min-w-0 pr-2">
            <h3 id="ledger-import-run-detail-title" className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              {run.displayName?.trim() ? run.displayName.trim() : `Import ${titleDate}`}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {run.displayName?.trim() ? `Import ${titleDate} · ` : ''}
              {sourceLabel}
              {run.fileName ? ` · ${run.fileName}` : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Profil: <span style={{ color: 'var(--text)' }}>{profileName}</span>
              {run.csvProfileId ? ` · Profil-ID: ${run.csvProfileId}` : ''}
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
                Linjer i opplasting
              </div>
              <div className="tabular-nums font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                {run.rowCountParsed}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Importert
              </div>
              <div className="tabular-nums font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                {run.rowCountImported}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Hoppet over
              </div>
              <div className="tabular-nums font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                {run.rowCountSkipped}
              </div>
            </div>
          </div>
          {run.errorSummary && (
            <p className="text-xs mt-2 rounded-lg px-2 py-2" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {run.errorSummary}
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
                {hasSnapshots ? (
                  <li style={{ color: 'var(--text)' }}>
                    <strong>{lineCount}</strong> linje{lineCount === 1 ? '' : 'r'} med full detalj (arkivert ved import)
                  </li>
                ) : (
                  <li style={{ color: 'var(--text)' }}>
                    <strong>{lineCount}</strong> transaksjon{lineCount === 1 ? '' : 'er'} knyttet til importen i appen
                  </li>
                )}
                {hasSnapshots && txLinkedCount !== lineCount && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    I transaksjonslisten nå: <strong style={{ color: 'var(--text)' }}>{txLinkedCount}</strong> med samme
                    import-ID{txLinkedCount < lineCount ? ' (noen kan være slettet eller fra eldre logikk)' : ''}
                  </li>
                )}
                {dateMin && dateMax && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    Datoer: {formatIsoDateDdMmYyyy(dateMin)} – {formatIsoDateDdMmYyyy(dateMax)}
                  </li>
                )}
                {sumIncome > 0 && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    Sum inntektslinjer: <strong style={{ color: 'var(--text)' }}>{formatNOK(sumIncome)}</strong>
                  </li>
                )}
                {sumExpense > 0 && (
                  <li style={{ color: 'var(--text-muted)' }}>
                    Sum utgiftslinjer: <strong style={{ color: 'var(--text)' }}>{formatNOK(sumExpense)}</strong>
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
              <section className="mb-4" aria-label="Alle linjer fra filen">
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Hver linje (dato, beløp, konto, bilag, tekst)
                </h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="overflow-x-auto max-h-[min(52vh,22rem)] overflow-y-auto">
                    <table className="w-full text-[11px] min-w-[720px]">
                      <thead>
                        <tr style={{ background: 'color-mix(in srgb, var(--surface) 90%, var(--border))' }}>
                          <th className="text-right font-medium px-1.5 py-2 tabular-nums whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Rad
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Dato
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Konto
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 min-w-[6rem]" style={{ color: 'var(--text-muted)' }}>
                            Kontonavn
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Bilag
                          </th>
                          <th className="text-right font-medium px-1.5 py-2 tabular-nums whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Beløp
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 min-w-[5rem]" style={{ color: 'var(--text-muted)' }}>
                            Kategori
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Type
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Regnskap
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 min-w-[8rem]" style={{ color: 'var(--text-muted)' }}>
                            Tekst (fil)
                          </th>
                          <th className="text-left font-medium px-1.5 py-2 min-w-[8rem]" style={{ color: 'var(--text-muted)' }}>
                            I appen
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSnapshots.map((l, idx) => (
                          <tr key={`${l.fileLine}-${l.dateIso}-${idx}`} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                              {l.fileLine}
                            </td>
                            <td className="px-1.5 py-1.5 tabular-nums whitespace-nowrap" style={{ color: 'var(--text)' }}>
                              {formatIsoDateDdMmYyyy(l.dateIso)}
                            </td>
                            <td className="px-1.5 py-1.5 font-mono whitespace-nowrap" style={{ color: 'var(--text)' }}>
                              {l.accountCode}
                            </td>
                            <td className="px-1.5 py-1.5 min-w-0 break-words" style={{ color: 'var(--text-muted)' }} title={l.accountName}>
                              {l.accountName || '—'}
                            </td>
                            <td className="px-1.5 py-1.5 whitespace-nowrap max-w-[5rem] truncate" style={{ color: 'var(--text-muted)' }} title={l.voucherRef}>
                              {l.voucherRef || '—'}
                            </td>
                            <td className="px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap font-medium" style={{ color: 'var(--text)' }}>
                              {formatNOK(l.amount)}
                            </td>
                            <td className="px-1.5 py-1.5 min-w-0" style={{ color: 'var(--text)' }} title={l.categoryName}>
                              <span className="line-clamp-2 break-words">{l.categoryName}</span>
                            </td>
                            <td className="px-1.5 py-1.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                              {l.type === 'income' ? 'Inntekt' : 'Utgift'}
                            </td>
                            <td className="px-1.5 py-1.5 whitespace-nowrap text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {l.ledgerSide === 'income' ? 'Innt. (fil)' : 'Utg. (fil)'}
                            </td>
                            <td className="px-1.5 py-1.5 min-w-0" style={{ color: 'var(--text-muted)' }}>
                              <span className="line-clamp-2 break-words" title={l.description}>
                                {l.description || '—'}
                              </span>
                            </td>
                            <td className="px-1.5 py-1.5 min-w-0" style={{ color: 'var(--text-muted)' }}>
                              <span className="line-clamp-2 break-words" title={l.transactionDescription}>
                                {l.transactionDescription || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-4" aria-label="Alle importerte linjer">
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Alle poster (fra transaksjonsliste)
                </h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="overflow-x-auto max-h-[min(40vh,18rem)] overflow-y-auto">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr style={{ background: 'color-mix(in srgb, var(--surface) 90%, var(--border))' }}>
                          <th className="text-left font-medium px-2 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            Dato
                          </th>
                          <th className="text-left font-medium px-2 py-2" style={{ color: 'var(--text-muted)' }}>
                            Kategori
                          </th>
                          <th className="text-right font-medium px-2 py-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            Beløp
                          </th>
                          <th className="text-left font-medium px-2 py-2 min-w-[8rem]" style={{ color: 'var(--text-muted)' }}>
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
                              <span className="block truncate max-w-[10rem] sm:max-w-[14rem]" title={t.category}>
                                {t.category}
                              </span>
                              <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>
                                {t.type === 'income' ? 'Inntekt' : 'Utgift'}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap font-medium" style={{ color: 'var(--text)' }}>
                              {formatNOK(t.amount)}
                            </td>
                            <td className="px-2 py-1.5 min-w-0" style={{ color: 'var(--text-muted)' }}>
                              <span className="line-clamp-2 break-words" title={t.description}>
                                {t.description || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            <p className="text-sm">
              <Link
                href={transaksjonerHref}
                className="font-medium underline-offset-2 hover:underline touch-manipulation"
                style={{ color: 'var(--primary)' }}
                onClick={onClose}
              >
                Åpne transaksjoner for dette året
              </Link>
            </p>
          </>
        ) : (
          <div
            className="rounded-xl border px-3 py-3 text-sm mb-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
          >
            <p className="m-0" style={{ color: 'var(--text)' }}>
              Ingen lagrede linjedetaljer for denne importen.
            </p>
            <p className="m-0 mt-2 text-xs">
              Nye importer lagrer hver linje (dato, beløp, konto, bilag m.m.). For eldre kjøringer vises bare tallene over.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
