'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { PersonProfile, Transaction } from '@/lib/store'
import { isIsoDateString, todayIsoLocal } from '@/lib/transactionPeriodFilter'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  categoryName: string
  txType: 'income' | 'expense'
  /** F.eks. «Hittil i år 2026» eller «April 2026». */
  periodLabel: string
  /** Sum vist i sammendragstabellen (samme periode og filtre). */
  lineTotal: number
  transactions: Transaction[]
  transactionsListeHref: string
  profiles: PersonProfile[]
  isHouseholdAggregate: boolean
  /** Når brukeren har valgt «hittil i år»: tabellsum er t.o.m. i dag; fremtidige linjer hentes inn utenom perioden. */
  ytdPerspective?: boolean
}

/** Nyeste først (typisk for transaksjoner til og med i dag). */
function sortByDateDesc(a: Transaction, b: Transaction): number {
  const da = typeof a.date === 'string' ? a.date : ''
  const db = typeof b.date === 'string' ? b.date : ''
  return db.localeCompare(da)
}

/** Nærmeste dato først (stigende) — riktig for fremtidige planlagte linjer (unngår desember øverst). */
function sortByDateAsc(a: Transaction, b: Transaction): number {
  const da = typeof a.date === 'string' ? a.date : ''
  const db = typeof b.date === 'string' ? b.date : ''
  return da.localeCompare(db)
}

export default function TransactionActualsCategoryModal({
  open,
  onClose,
  categoryName,
  txType,
  periodLabel,
  lineTotal,
  transactions,
  transactionsListeHref,
  profiles,
  isHouseholdAggregate,
  ytdPerspective = false,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const { pastOrToday, future } = useMemo(() => {
    const today = todayIsoLocal()
    const pastOrToday: Transaction[] = []
    const future: Transaction[] = []
    for (const t of transactions) {
      const d = t.date
      if (typeof d !== 'string' || !isIsoDateString(d)) {
        pastOrToday.push(t)
        continue
      }
      if (d > today) future.push(t)
      else pastOrToday.push(t)
    }
    pastOrToday.sort(sortByDateDesc)
    future.sort(sortByDateAsc)
    return { pastOrToday, future }
  }, [transactions])

  const sumPast = useMemo(
    () => pastOrToday.reduce((a, t) => a + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [pastOrToday],
  )
  const sumFuture = useMemo(
    () => future.reduce((a, t) => a + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [future],
  )

  const profileName = (pid: string | undefined) => {
    if (!isHouseholdAggregate) return null
    const id = pid ?? profiles[0]?.id
    return profiles.find((p) => p.id === id)?.name ?? null
  }

  const accent = txType === 'income' ? 'var(--success)' : 'var(--danger)'
  const sign = txType === 'income' ? '+' : '−'

  if (!open) return null

  const renderList = (list: Transaction[]) => (
    <ul className="space-y-1.5">
      {list.map((t) => {
        const pname = profileName(t.profileId)
        const amt = Number.isFinite(t.amount) ? t.amount : 0
        const dateStr =
          typeof t.date === 'string' && isIsoDateString(t.date) ? formatIsoDateDdMmYyyy(t.date) : t.date ?? '—'
        return (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bg)' }}
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium leading-snug truncate" style={{ color: 'var(--text)' }}>
                {t.description || 'Uten beskrivelse'}
              </p>
              <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {dateStr}
                {t.subcategory?.trim() ? ` · ${t.subcategory.trim()}` : ''}
                {pname ? ` · ${pname}` : ''}
              </p>
            </div>
            <p className="text-[14px] font-medium tabular-nums shrink-0" style={{ color: accent }}>
              {sign}
              {formatNOK(amt)}
            </p>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-actuals-cat-modal-title"
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90vh,800px)] w-full max-w-lg min-w-0 flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl md:max-w-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="tx-actuals-cat-modal-title"
              className="text-[17px] font-semibold tracking-tight truncate"
              style={{ color: 'var(--text)' }}
            >
              {categoryName}
            </h2>
            <p className="text-[13px] mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
              {periodLabel}
              {' · '}
              {txType === 'income' ? 'Inntekt' : 'Utgift'} i utvalget:{' '}
              <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                {sign}
                {formatNOK(lineTotal)}
              </span>
            </p>
            <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {ytdPerspective ? (
                <>
                  Summen i oversikten over gjelder <strong className="font-medium" style={{ color: 'var(--text)' }}>til og med i dag</strong> når
                  du har valgt «hittil i år». Under hovedlisten viser vi en egen blokk med{' '}
                  <strong className="font-medium" style={{ color: 'var(--text)' }}>ekstra informasjon</strong>: det du har registrert med
                  senere dato i året (ikke med i tallet over).
                </>
              ) : (
                <>Listen under viser først transaksjoner til og med i dag, deretter en egen blokk for fremtidige registrerte linjer — kun som tilleggsinfo.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0 touch-manipulation"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 space-y-6">
          <section aria-labelledby="tx-actuals-past-heading">
            <h3
              id="tx-actuals-past-heading"
              className="text-[13px] font-semibold mb-3 tracking-tight"
              style={{ color: 'var(--text)' }}
            >
              {ytdPerspective ? 'Hittil i år (til og med i dag)' : 'Til og med i dag'} ({pastOrToday.length})
            </h3>
            {pastOrToday.length === 0 ? (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Ingen transaksjoner med dato i dag eller tidligere i dette utvalget.
              </p>
            ) : (
              <>
                <p className="text-[12px] mb-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Sum:{' '}
                  <span className="font-medium" style={{ color: accent }}>
                    {sign}
                    {formatNOK(sumPast)}
                  </span>
                </p>
                {renderList(pastOrToday)}
              </>
            )}
          </section>

          {/* Egen blokk under — ikke blandet med listen over; kun tilleggsinformasjon om fremtidige registreringer. */}
          <section
            aria-labelledby="tx-actuals-future-heading"
            className="rounded-2xl p-4"
            style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Ekstra informasjon
            </p>
            <h3
              id="tx-actuals-future-heading"
              className="text-[13px] font-semibold mb-1.5 tracking-tight"
              style={{ color: 'var(--text)' }}
            >
              Registrerte transaksjoner for frem i tid ({future.length})
            </h3>
            <p className="text-[12px] mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Dette blandes ikke med «hittil i år» over. Her vises bare linjer du allerede har lagt inn med dato{' '}
              <strong className="font-medium" style={{ color: 'var(--text)' }}>etter i dag</strong> i samme år (f.eks. planlagt husleie).
              Samme visning som over (dato og beløp). Sortert etter dato med nærmeste først.
            </p>
            {future.length === 0 ? (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Ingen slike registreringer for denne kategorien.
              </p>
            ) : (
              <>
                <p className="text-[12px] mb-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Sum (kun denne blokken):{' '}
                  <span className="font-medium" style={{ color: accent }}>
                    {sign}
                    {formatNOK(sumFuture)}
                  </span>
                </p>
                {renderList(future)}
              </>
            )}
          </section>
        </div>

        <div
          className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end px-6 pt-2 shrink-0 border-t pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] py-2.5 px-4 rounded-xl text-[15px] font-medium w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={transactionsListeHref}
            onClick={onClose}
            className="min-h-[44px] inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-[15px] font-semibold text-white text-center w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Åpne i transaksjonslisten
          </Link>
        </div>
      </div>
    </div>
  )
}
