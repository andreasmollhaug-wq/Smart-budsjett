'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { ChevronDown, MoreVertical, Plus } from 'lucide-react'
import type { CreditorRegistryGroup, CreditorRegistryLoan, LoanSortMode } from '@/lib/creditorRegistry/types'
import type { Debt } from '@/lib/store'
import { debtColors, debtIcons, debtTypeLabels } from '@/lib/debtDisplay'
import { computeGroupTotals } from '@/lib/creditorRegistry/aggregate'
import { sortLoans } from '@/lib/creditorRegistry/sort'

type Props = {
  groups: CreditorRegistryGroup[]
  loanSort: LoanSortMode
  expandedIds: Set<string>
  readOnly: boolean
  formatNOK: (n: number) => string
  onToggle: (creditorId: string, expanded: boolean) => void
  onEditLoan: (creditorId: string, loan: CreditorRegistryLoan) => void
  onAddLoan: (creditorId: string) => void
  onRenameCreditor: (creditorId: string, currentName: string) => void
  onDeleteCreditor: (creditorId: string, name: string, loanCount: number) => void
}

function LoanRow({
  loan,
  formatNOK,
  readOnly,
  onClick,
}: {
  loan: CreditorRegistryLoan
  formatNOK: (n: number) => string
  readOnly?: boolean
  onClick: () => void
}) {
  const Icon = debtIcons[loan.type as Debt['type']]
  const color = debtColors[loan.type as Debt['type']]
  const typeLabel = debtTypeLabels[loan.type as Debt['type']]

  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      disabled={readOnly}
      className="flex w-full items-center gap-3 min-h-[44px] py-3 px-3 sm:px-4 text-left touch-manipulation rounded-lg hover:brightness-[1.02] min-w-0 disabled:cursor-default disabled:hover:brightness-100"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}22` }}
      >
        <Icon size={16} style={{ color }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {loan.name}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {typeLabel}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs sm:text-sm space-y-0.5 tabular-nums">
        <p className="font-semibold" style={{ color: 'var(--danger)' }}>
          {formatNOK(loan.remainingAmount)}
        </p>
        <p style={{ color: 'var(--text-muted)' }}>
          {formatNOK(loan.monthlyPayment)}/mnd · {loan.interestRate}%
        </p>
      </div>
    </button>
  )
}

function CreditorMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl touch-manipulation"
        aria-label="Meny for kreditor"
        aria-expanded={open}
      >
        <MoreVertical size={18} style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border py-1 shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm min-h-[44px] touch-manipulation"
            style={{ color: 'var(--text)' }}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onRename()
            }}
          >
            Endre navn
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 text-sm min-h-[44px] touch-manipulation"
            style={{ color: 'var(--danger)' }}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
          >
            Slett kreditor
          </button>
        </div>
      )}
    </div>
  )
}

export default function CreditorRegistryAccordion({
  groups,
  loanSort,
  expandedIds,
  readOnly,
  formatNOK,
  onToggle,
  onEditLoan,
  onAddLoan,
  onRenameCreditor,
  onDeleteCreditor,
}: Props) {
  const groupsWithSortedLoans = useMemo(
    () =>
      groups.map((g) => ({
        group: g,
        totals: computeGroupTotals(g),
        loans: sortLoans(g.loans, loanSort),
      })),
    [groups, loanSort],
  )

  return (
    <div className="space-y-3 min-w-0" id="creditor-registry-accordion">
      {groupsWithSortedLoans.map(({ group, totals, loans }) => {
        const expanded = expandedIds.has(group.id)
        const panelId = `creditor-panel-${group.id}`
        const headerId = `creditor-header-${group.id}`
        const loanWord = totals.loanCount === 1 ? 'lån' : 'lån'

        return (
          <div
            key={group.id}
            className="rounded-2xl overflow-hidden min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-stretch gap-1 min-w-0">
              <button
                type="button"
                id={headerId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => onToggle(group.id, !expanded)}
                className="flex flex-1 min-w-0 items-center gap-3 p-4 sm:p-5 text-left touch-manipulation min-h-[44px]"
              >
                <ChevronDown
                  size={20}
                  className="shrink-0 transition-transform duration-200 motion-reduce:transition-none"
                  style={{
                    color: 'var(--text-muted)',
                    transform: expanded ? 'rotate(180deg)' : undefined,
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-semibold text-base truncate" style={{ color: 'var(--text)' }}>
                      {group.name}
                    </h3>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {totals.loanCount} {loanWord}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm tabular-nums">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Restgjeld{' '}
                      <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                        {formatNOK(totals.totalRemaining)}
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Mnd{' '}
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {formatNOK(totals.totalMonthly)}
                      </span>
                    </span>
                  </div>
                </div>
              </button>
              {!readOnly && (
                <div className="flex items-center pr-2 sm:pr-3">
                  <CreditorMenu
                    onRename={() => onRenameCreditor(group.id, group.name)}
                    onDelete={() => onDeleteCreditor(group.id, group.name, totals.loanCount)}
                  />
                </div>
              )}
            </div>

            {expanded && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className="border-t px-2 sm:px-3 pb-3 pt-1 space-y-1"
                style={{ borderColor: 'var(--border)' }}
              >
                {loans.length === 0 ? (
                  <div className="py-6 px-3 text-center">
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Ingen lån ennå under {group.name}.
                    </p>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onAddLoan(group.id)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-medium touch-manipulation border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <Plus size={16} aria-hidden />
                        Legg til lån
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      {loans.map((loan) => (
                        <LoanRow
                          key={loan.id}
                          loan={loan}
                          formatNOK={formatNOK}
                          readOnly={readOnly}
                          onClick={() => onEditLoan(group.id, loan)}
                        />
                      ))}
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onAddLoan(group.id)}
                        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl mt-2 py-2.5 text-sm font-medium touch-manipulation border border-dashed"
                        style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                      >
                        <Plus size={16} aria-hidden />
                        Legg til lån
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
