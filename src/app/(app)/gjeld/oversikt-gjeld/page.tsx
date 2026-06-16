'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import GjeldSubnav from '@/components/debt/GjeldSubnav'
import CreditorRegistryInfoButton from '@/components/debt/creditorRegistry/CreditorRegistryInfoButton'
import CreditorRegistrySetupChecklist from '@/components/debt/creditorRegistry/CreditorRegistrySetupChecklist'
import CreditorRegistryKpiRow from '@/components/debt/creditorRegistry/CreditorRegistryKpiRow'
import CreditorRegistryToolbar from '@/components/debt/creditorRegistry/CreditorRegistryToolbar'
import CreditorRegistryAccordion from '@/components/debt/creditorRegistry/CreditorRegistryAccordion'
import CreditorRegistryEmptyState from '@/components/debt/creditorRegistry/CreditorRegistryEmptyState'
import CreditorGroupNameModal from '@/components/debt/creditorRegistry/CreditorGroupNameModal'
import CreditorRegistryLoanModal from '@/components/debt/creditorRegistry/CreditorRegistryLoanModal'
import CreditorRegistryConfirmDialog from '@/components/debt/creditorRegistry/CreditorRegistryConfirmDialog'
import { useActivePersonFinance } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { computeRegistryOverview } from '@/lib/creditorRegistry/aggregate'
import { sortCreditorGroups } from '@/lib/creditorRegistry/sort'
import { normalizeCreditorRegistryPrefs } from '@/lib/creditorRegistry/prefs'
import type { CreditorRegistryChecklistItem } from '@/lib/creditorRegistry/checklist'
import type { CreditorRegistryLoan } from '@/lib/creditorRegistry/types'
import type { CreditorRegistryLoanFormPayload } from '@/components/debt/creditorRegistry/CreditorRegistryLoanForm'

type GroupModalMode = { kind: 'add' } | { kind: 'rename'; creditorId: string; name: string }

type LoanModalState =
  | { open: false }
  | { open: true; mode: 'add'; creditorId: string; creditorName: string }
  | { open: true; mode: 'edit'; creditorId: string; creditorName: string; loan: CreditorRegistryLoan }

type DeleteCreditorState = { id: string; name: string; loanCount: number } | null

export default function OversiktGjeldPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const {
    creditorRegistry,
    activeProfileId,
    isHouseholdAggregate,
    addCreditorGroup,
    renameCreditorGroup,
    removeCreditorGroup,
    addCreditorRegistryLoan,
    updateCreditorRegistryLoan,
    removeCreditorRegistryLoan,
    setCreditorRegistryPrefs,
    setCreditorRegistryChecklistOverride,
    acknowledgeCreditorRegistryStandaloneInfo,
    markCreditorRegistrySubtotalsReviewed,
  } = useActivePersonFinance()

  const readOnly = isHouseholdAggregate
  const prefs = normalizeCreditorRegistryPrefs(creditorRegistry.prefs)
  const accordionRef = useRef<HTMLDivElement>(null)

  const overview = useMemo(
    () => computeRegistryOverview(creditorRegistry.creditors),
    [creditorRegistry.creditors],
  )

  const sortedGroups = useMemo(
    () => sortCreditorGroups(creditorRegistry.creditors, prefs.creditorSort),
    [creditorRegistry.creditors, prefs.creditorSort],
  )

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [groupModal, setGroupModal] = useState<GroupModalMode | null>(null)
  const [loanModal, setLoanModal] = useState<LoanModalState>({ open: false })
  const [deleteCreditor, setDeleteCreditor] = useState<DeleteCreditorState>(null)
  const [deleteLoan, setDeleteLoan] = useState<{ creditorId: string; loanId: string } | null>(null)

  useEffect(() => {
    setExpandedIds(new Set())
  }, [activeProfileId])

  const openAddCreditor = useCallback(() => setGroupModal({ kind: 'add' }), [])

  const openAddLoan = useCallback(
    (creditorId: string) => {
      const g = creditorRegistry.creditors.find((c) => c.id === creditorId)
      if (!g) return
      setExpandedIds((prev) => new Set(prev).add(creditorId))
      setLoanModal({ open: true, mode: 'add', creditorId, creditorName: g.name })
    },
    [creditorRegistry.creditors],
  )

  const handleToggle = useCallback(
    (creditorId: string, expanded: boolean) => {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (expanded) {
          next.add(creditorId)
          markCreditorRegistrySubtotalsReviewed()
        } else next.delete(creditorId)
        return next
      })
    },
    [markCreditorRegistrySubtotalsReviewed],
  )

  const findFirstCreditorNeedingFields = useCallback(() => {
    for (const g of creditorRegistry.creditors) {
      const incomplete = g.loans.some(
        (l) => !(l.remainingAmount > 0 && (l.monthlyPayment > 0 || l.interestRate > 0)),
      )
      if (incomplete) return g
    }
    return creditorRegistry.creditors[0] ?? null
  }, [creditorRegistry.creditors])

  const handleChecklistCta = useCallback(
    (kind: CreditorRegistryChecklistItem['ctaKind'], _item: CreditorRegistryChecklistItem) => {
      switch (kind) {
        case 'add_creditor':
          openAddCreditor()
          break
        case 'add_loan': {
          const first = creditorRegistry.creditors[0]
          if (first) openAddLoan(first.id)
          else openAddCreditor()
          break
        }
        case 'expand_creditor': {
          const g = findFirstCreditorNeedingFields()
          if (g) {
            setExpandedIds((prev) => new Set(prev).add(g.id))
            const firstIncomplete = g.loans.find(
              (l) => !(l.remainingAmount > 0 && (l.monthlyPayment > 0 || l.interestRate > 0)),
            )
            if (firstIncomplete) {
              setLoanModal({
                open: true,
                mode: 'edit',
                creditorId: g.id,
                creditorName: g.name,
                loan: firstIncomplete,
              })
            } else if (g.loans.length > 0) {
              setLoanModal({
                open: true,
                mode: 'edit',
                creditorId: g.id,
                creditorName: g.name,
                loan: g.loans[0]!,
              })
            } else {
              openAddLoan(g.id)
            }
          }
          break
        }
        case 'scroll_accordion':
          accordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          if (sortedGroups.length > 0) {
            const largest = [...sortedGroups].sort(
              (a, b) =>
                b.loans.reduce((s, l) => s + l.remainingAmount, 0) -
                a.loans.reduce((s, l) => s + l.remainingAmount, 0),
            )[0]
            if (largest) {
              setExpandedIds((prev) => new Set(prev).add(largest.id))
              markCreditorRegistrySubtotalsReviewed()
            }
          }
          break
        case 'acknowledge_info':
          acknowledgeCreditorRegistryStandaloneInfo()
          break
        default:
          break
      }
    },
    [
      openAddCreditor,
      openAddLoan,
      creditorRegistry.creditors,
      findFirstCreditorNeedingFields,
      sortedGroups,
      markCreditorRegistrySubtotalsReviewed,
      acknowledgeCreditorRegistryStandaloneInfo,
    ],
  )

  const handleManualComplete = useCallback(
    (stepId: CreditorRegistryChecklistItem['id']) => {
      if (stepId === 'understand_standalone') {
        acknowledgeCreditorRegistryStandaloneInfo()
      } else {
        setCreditorRegistryChecklistOverride(stepId, true)
      }
    },
    [acknowledgeCreditorRegistryStandaloneInfo, setCreditorRegistryChecklistOverride],
  )

  const handleGroupSubmit = (name: string) => {
    if (groupModal?.kind === 'add') {
      addCreditorGroup(name)
    } else if (groupModal?.kind === 'rename') {
      renameCreditorGroup(groupModal.creditorId, name)
    }
    setGroupModal(null)
  }

  const handleGroupSubmitAndAddLoan = (name: string) => {
    if (groupModal?.kind !== 'add') return
    const result = addCreditorGroup(name)
    setGroupModal(null)
    if (result.ok && result.id) {
      setExpandedIds((prev) => new Set(prev).add(result.id!))
      setLoanModal({
        open: true,
        mode: 'add',
        creditorId: result.id,
        creditorName: name.trim(),
      })
    }
  }

  const handleLoanSave = (payload: CreditorRegistryLoanFormPayload) => {
    if (!loanModal.open) return
    if (loanModal.mode === 'add') {
      addCreditorRegistryLoan(loanModal.creditorId, payload)
    } else {
      updateCreditorRegistryLoan(loanModal.creditorId, loanModal.loan.id, payload)
    }
    setLoanModal({ open: false })
  }

  const contentPadding =
    'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pt-6 lg:px-8 lg:py-8'

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Gjeld" subtitle="Oversikt gjeld — gruppert etter kreditor" />
      <GjeldSubnav />
      <div className={`flex-1 min-w-0 w-full space-y-4 sm:space-y-6 ${contentPadding}`}>
        <div className="flex items-center justify-end gap-2 min-w-0">
          <CreditorRegistryInfoButton />
        </div>

        <CreditorRegistrySetupChecklist
          state={creditorRegistry}
          readOnly={readOnly}
          onCta={handleChecklistCta}
          onManualComplete={handleManualComplete}
          onDismiss={() => setCreditorRegistryPrefs({ checklistDismissed: true, checklistCollapsed: false })}
          onRestore={() => setCreditorRegistryPrefs({ checklistDismissed: false, checklistCollapsed: false })}
          onCollapse={() => setCreditorRegistryPrefs({ checklistCollapsed: true })}
          onExpand={() => setCreditorRegistryPrefs({ checklistCollapsed: false })}
        />

        <CreditorRegistryKpiRow overview={overview} formatNOK={formatNOK} />

        {readOnly && (
          <p
            className="text-xs sm:text-sm rounded-xl px-3 py-2"
            style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            I husholdningsvisning kan du se oversikt gjeld for aktiv profil, men ikke legge til eller redigere. Bytt
            til én profil for å administrere.
          </p>
        )}

        <CreditorRegistryToolbar
          prefs={prefs}
          readOnly={readOnly}
          onPrefsChange={setCreditorRegistryPrefs}
          onAddCreditor={openAddCreditor}
        />

        {creditorRegistry.creditors.length === 0 ? (
          <CreditorRegistryEmptyState onAddCreditor={openAddCreditor} readOnly={readOnly} />
        ) : (
          <div ref={accordionRef} className="min-w-0">
            <CreditorRegistryAccordion
              groups={sortedGroups}
              loanSort={prefs.loanSort}
              expandedIds={expandedIds}
              readOnly={readOnly}
              formatNOK={formatNOK}
              onToggle={handleToggle}
              onEditLoan={(creditorId, loan) => {
                const g = creditorRegistry.creditors.find((c) => c.id === creditorId)
                if (!g) return
                setLoanModal({
                  open: true,
                  mode: 'edit',
                  creditorId,
                  creditorName: g.name,
                  loan,
                })
              }}
              onAddLoan={openAddLoan}
              onRenameCreditor={(creditorId, name) =>
                setGroupModal({ kind: 'rename', creditorId, name })
              }
              onDeleteCreditor={(id, name, loanCount) => setDeleteCreditor({ id, name, loanCount })}
            />
          </div>
        )}
      </div>

      <CreditorGroupNameModal
        open={groupModal !== null}
        initialName={groupModal?.kind === 'rename' ? groupModal.name : ''}
        title={groupModal?.kind === 'rename' ? 'Endre kreditornavn' : 'Legg til kreditor'}
        submitLabel={groupModal?.kind === 'rename' ? 'Lagre' : 'Legg til'}
        addLoanLabel={groupModal?.kind === 'add' ? 'Legg til lån' : undefined}
        onSubmit={handleGroupSubmit}
        onSubmitAndAddLoan={groupModal?.kind === 'add' ? handleGroupSubmitAndAddLoan : undefined}
        onClose={() => setGroupModal(null)}
      />

      {loanModal.open && (
        <CreditorRegistryLoanModal
          open
          mode={loanModal.mode}
          creditorName={loanModal.creditorName}
          loan={loanModal.mode === 'edit' ? loanModal.loan : null}
          onClose={() => setLoanModal({ open: false })}
          onSave={handleLoanSave}
          onDelete={
            loanModal.mode === 'edit'
              ? () => setDeleteLoan({ creditorId: loanModal.creditorId, loanId: loanModal.loan.id })
              : undefined
          }
        />
      )}

      <CreditorRegistryConfirmDialog
        open={deleteCreditor !== null}
        title="Slett kreditor?"
        message={
          deleteCreditor
            ? `Dette sletter ${deleteCreditor.name} og alle ${deleteCreditor.loanCount} lån under kreditor.`
            : ''
        }
        confirmLabel="Slett"
        danger
        onConfirm={() => {
          if (deleteCreditor) removeCreditorGroup(deleteCreditor.id)
          setDeleteCreditor(null)
        }}
        onCancel={() => setDeleteCreditor(null)}
      />

      <CreditorRegistryConfirmDialog
        open={deleteLoan !== null}
        title="Slett lån?"
        message="Lånet fjernes permanent fra oversikten."
        confirmLabel="Slett"
        danger
        onConfirm={() => {
          if (deleteLoan) {
            removeCreditorRegistryLoan(deleteLoan.creditorId, deleteLoan.loanId)
            setLoanModal({ open: false })
          }
          setDeleteLoan(null)
        }}
        onCancel={() => setDeleteLoan(null)}
      />
    </div>
  )
}
