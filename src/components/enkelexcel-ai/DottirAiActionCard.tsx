'use client'

import { useState } from 'react'
import { formatBudgetPeriodLabel } from '@/lib/dottirAiActions/periodLabels'
import {
  isBlockedAction,
  isValidatedBudgetAction,
  isValidatedTransactionAction,
  type ValidatedAction,
} from '@/lib/dottirAiActions/validate'
import type {
  ActionStatus,
  AppliedActionSummary,
  BudgetPeriod,
  ValidatedBudgetAction,
  ValidatedTransactionAction,
} from '@/lib/dottirAiActions/types'
import { formatNOK } from '@/lib/utils'
import DottirAiHouseholdBlockCard from '@/components/enkelexcel-ai/DottirAiHouseholdBlockCard'

type Props = {
  action: ValidatedAction
  status: ActionStatus
  appliedSummary?: AppliedActionSummary | null
  isHouseholdAggregate: boolean
  onConfirm: (action: ValidatedAction) => void
  onCancel: () => void
  onUpdateAction: (action: ValidatedAction) => void
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-3 gap-y-0.5 items-baseline min-w-0">
      <dt className="text-xs font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd className="text-sm font-medium tabular-nums break-words min-w-0" style={{ color: 'var(--text)' }}>
        {value}
      </dd>
    </div>
  )
}

function KindBadge({ kind }: { kind: 'budget' | 'transaction' }) {
  const label = kind === 'budget' ? 'Budsjett' : 'Transaksjon'
  return (
    <span
      className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        background: kind === 'budget' ? 'var(--primary-pale)' : 'color-mix(in srgb, #0CA678 18%, var(--bg))',
        color: kind === 'budget' ? 'var(--primary)' : '#0CA678',
        border: '1px solid var(--border)',
      }}
    >
      {label}
    </span>
  )
}

function BudgetEditForm({
  action,
  onSave,
  onCancelEdit,
}: {
  action: ValidatedBudgetAction
  onSave: (next: ValidatedBudgetAction) => void
  onCancelEdit: () => void
}) {
  const [amount, setAmount] = useState(String(action.amountNok))
  const [periodMode, setPeriodMode] = useState<BudgetPeriod['mode']>(action.period.mode)

  function handleSave() {
    const n = parseInt(amount.replace(/\s/g, ''), 10)
    if (!Number.isFinite(n) || n <= 0) return
    let period: BudgetPeriod =
      periodMode === 'monthly_all' ? { mode: 'monthly_all' } : action.period
    if (periodMode === 'monthly_all') {
      period = { mode: 'monthly_all' }
    }
    const periodLabel = formatBudgetPeriodLabel(period)
    onSave({
      ...action,
      amountNok: n,
      period,
      periodLabel,
      payload: { ...action.payload, amountNok: n, period },
    })
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
      <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Beløp (kr)
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm min-h-[44px] tabular-nums"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </label>
      <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Periode
        <select
          value={periodMode}
          onChange={(e) => setPeriodMode(e.target.value as BudgetPeriod['mode'])}
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm min-h-[44px]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        >
          <option value="monthly_all">Hver måned (jan–des)</option>
          {action.period.mode === 'single_month' ? (
            <option value="single_month">Én måned (uendret)</option>
          ) : null}
        </select>
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          Lagre endring
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation border"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Avbryt redigering
        </button>
      </div>
    </div>
  )
}

function TransactionEditForm({
  action,
  onSave,
  onCancelEdit,
}: {
  action: ValidatedTransactionAction
  onSave: (next: ValidatedTransactionAction) => void
  onCancelEdit: () => void
}) {
  const [amount, setAmount] = useState(String(action.amountNok))
  const [description, setDescription] = useState(action.description)
  const [date, setDate] = useState(action.date)

  function handleSave() {
    const n = parseInt(amount.replace(/\s/g, ''), 10)
    if (!Number.isFinite(n) || n <= 0 || !description.trim()) return
    onSave({
      ...action,
      amountNok: n,
      description: description.trim(),
      date,
      payload: { ...action.payload, amountNok: n, description: description.trim(), date },
    })
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
      <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Beløp (kr)
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm min-h-[44px]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </label>
      <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Beskrivelse
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm min-h-[44px]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </label>
      <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Dato
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm min-h-[44px]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          Lagre endring
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation border"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Avbryt redigering
        </button>
      </div>
    </div>
  )
}

export default function DottirAiActionCard({
  action,
  status,
  appliedSummary,
  isHouseholdAggregate,
  onConfirm,
  onCancel,
  onUpdateAction,
}: Props) {
  const [editing, setEditing] = useState(false)

  const amountLabel = (() => {
    if (isBlockedAction(action)) return ''
    if (isValidatedBudgetAction(action)) {
      const suffix = action.period.mode === 'monthly_all' ? ' / mnd' : ''
      return `${formatNOK(action.amountNok)}${suffix}`
    }
    if (isValidatedTransactionAction(action)) return formatNOK(action.amountNok)
    return ''
  })()

  if (isHouseholdAggregate && !isBlockedAction(action)) {
    return (
      <DottirAiHouseholdBlockCard message="Du ser samlet husholdning. Velg én profil for å legge inn budsjett eller transaksjoner via AI." />
    )
  }

  if (isBlockedAction(action)) {
    if (action.reason === 'household_readonly') {
      return <DottirAiHouseholdBlockCard message={action.message} />
    }
    return (
      <div
        className="mt-3 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        role="alert"
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Kan ikke foreslå endring
        </p>
        <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
          {action.message}
        </p>
      </div>
    )
  }

  if (status === 'confirmed' && appliedSummary) {
    return (
      <div
        className="mt-3 rounded-xl border px-4 py-3 space-y-2"
        style={{ borderColor: 'var(--success)', background: 'color-mix(in srgb, var(--success) 8%, var(--bg))' }}
        role="status"
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
          Lagret i {appliedSummary.kind === 'budget' ? 'budsjettet' : 'transaksjoner'}
        </p>
        <dl className="space-y-1.5">
          <SummaryRow label="Profil" value={appliedSummary.profileName} />
          {appliedSummary.kind === 'budget' ? (
            <>
              <SummaryRow label="Beløp" value={appliedSummary.amountLabel} />
              <SummaryRow label="Periode" value={appliedSummary.periodLabel} />
              <SummaryRow label="År" value={String(appliedSummary.budgetYear)} />
              <SummaryRow label="Linje" value={appliedSummary.lineLabel} />
            </>
          ) : (
            <>
              <SummaryRow label="Beløp" value={appliedSummary.amountLabel} />
              <SummaryRow label="Dato" value={appliedSummary.dateLabel} />
              <SummaryRow label="Beskrivelse" value={appliedSummary.description} />
              <SummaryRow label="Kategori" value={appliedSummary.lineLabel} />
              {appliedSummary.plannedFollowUp ? (
                <SummaryRow label="Status" value="Planlagt oppfølging" />
              ) : null}
            </>
          )}
        </dl>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }} role="status">
        Forslag avbrutt.
      </p>
    )
  }

  return (
    <div
      className="mt-3 rounded-xl border px-4 py-3 space-y-3 min-w-0"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <KindBadge kind={action.kind} />
        <span className="text-sm font-semibold break-words min-w-0" style={{ color: 'var(--text)' }}>
          {isValidatedBudgetAction(action) ? 'Foreslått budsjettendring' : 'Foreslått registrering'}
        </span>
        {isValidatedBudgetAction(action) && action.isNewLine ? (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            Ny linje
          </span>
        ) : null}
      </div>

      <p className="text-sm font-medium break-words" style={{ color: 'var(--text)' }}>
        {isValidatedBudgetAction(action) ? action.lineLabel : action.lineLabel}
      </p>

      {isValidatedBudgetAction(action) && action.subscriptionWarning ? (
        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          Linjen kan være knyttet til abonnement-synk. Sjekk at beløpet stemmer.
        </p>
      ) : null}

      {isValidatedBudgetAction(action) && action.previousAmountNok != null ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Før: {formatNOK(action.previousAmountNok)} / mnd
        </p>
      ) : null}

      <dl className="space-y-1.5">
        <SummaryRow label="Profil" value={action.profileName} />
        <SummaryRow label="Beløp" value={amountLabel} />
        {isValidatedBudgetAction(action) ? (
          <>
            <SummaryRow label="Periode" value={action.periodLabel} />
            <SummaryRow label="År" value={String(action.budgetYear)} />
          </>
        ) : isValidatedTransactionAction(action) ? (
          <>
            <SummaryRow label="Dato" value={action.dateLabel} />
            <SummaryRow label="Beskrivelse" value={action.description} />
            <SummaryRow label="Type" value={action.typeLabel} />
            {action.plannedFollowUp ? <SummaryRow label="Status" value="Planlagt" /> : null}
          </>
        ) : null}
      </dl>

      {editing && isValidatedBudgetAction(action) ? (
        <BudgetEditForm
          action={action}
          onSave={(next) => {
            onUpdateAction(next)
            setEditing(false)
          }}
          onCancelEdit={() => setEditing(false)}
        />
      ) : null}

      {editing && isValidatedTransactionAction(action) ? (
        <TransactionEditForm
          action={action}
          onSave={(next) => {
            onUpdateAction(next)
            setEditing(false)
          }}
          onCancelEdit={() => setEditing(false)}
        />
      ) : null}

      {!editing && (status === 'pending' || status === 'edited') ? (
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={() => onConfirm(action)}
            className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation flex-1 sm:flex-none"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            Bekreft
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation border flex-1 sm:flex-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Endre
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] touch-manipulation border flex-1 sm:flex-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Avbryt
          </button>
        </div>
      ) : null}
    </div>
  )
}
