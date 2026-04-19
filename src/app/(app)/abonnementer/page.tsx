'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import AbonnementerSubnav from '@/components/subscriptions/AbonnementerSubnav'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import SubscriptionModuleInfoModal from '@/components/subscriptions/SubscriptionModuleInfoModal'
import {
  findDuplicatePresetServiceGroups,
  monthlyEquivalentNok,
  subscriptionPriceSummaryLine,
  yearlyEquivalentNok,
} from '@/lib/serviceSubscriptionHelpers'
import {
  AUTO_SELECT_ABONNEMENTER_VALUE,
  AUTO_SELECT_TV_STREAMING_VALUE,
  desiredNameForAutoSelectValue,
  ensureSubscriptionSharedRegningerLine,
} from '@/lib/ensureSubscriptionSharedRegningerLine'
import {
  partitionRegningerForSubscriptionSharedLine,
  subscriptionSharedLineLegacyCategory,
  type SubscriptionSharedLinePartition,
} from '@/lib/regningerCategoryPicker'
import { clampBillingDay } from '@/lib/subscriptionTransactions'
import NewBudgetCategoryModal from '@/components/transactions/NewBudgetCategoryModal'
import { SERVICE_SUBSCRIPTION_PRESETS } from '@/lib/serviceSubscriptionPresets'
import {
  useActivePersonFinance,
  useStore,
  type BudgetCategory,
  type ServiceSubscription,
  type Transaction,
  type UpdateServiceSubscriptionPatch,
} from '@/lib/store'
import { formatNOK } from '@/lib/utils'
import { Info, Pencil, Plus, Trash2, X } from 'lucide-react'

const MONTH_OPTIONS = [
  { v: 1, label: 'Januar' },
  { v: 2, label: 'Februar' },
  { v: 3, label: 'Mars' },
  { v: 4, label: 'April' },
  { v: 5, label: 'Mai' },
  { v: 6, label: 'Juni' },
  { v: 7, label: 'Juli' },
  { v: 8, label: 'August' },
  { v: 9, label: 'September' },
  { v: 10, label: 'Oktober' },
  { v: 11, label: 'November' },
  { v: 12, label: 'Desember' },
] as const

function plannedTxEditDefaults(
  sub: ServiceSubscription,
  txs: Transaction[],
  budgetYear: number,
): { enabled: boolean; startMonth: number; endMonth: number; day: number } {
  const y = String(budgetYear)
  const linked = txs.filter(
    (t) =>
      t.linkedServiceSubscriptionId === sub.id &&
      t.type === 'expense' &&
      t.date.startsWith(`${y}-`),
  )
  if (linked.length === 0) {
    const n = new Date()
    return {
      enabled: false,
      startMonth: n.getMonth() + 1,
      endMonth: 12,
      day: clampBillingDay(n.getDate()),
    }
  }
  linked.sort((a, b) => a.date.localeCompare(b.date))
  const first = linked[0]!
  const dayRaw = parseInt(first.date.slice(8, 10), 10) || 1
  const months = linked
    .map((t) => parseInt(t.date.slice(5, 7), 10))
    .filter((m) => m >= 1 && m <= 12)
  if (months.length === 0) {
    const n = new Date()
    return {
      enabled: true,
      startMonth: n.getMonth() + 1,
      endMonth: 12,
      day: clampBillingDay(dayRaw),
    }
  }
  return {
    enabled: true,
    startMonth: Math.min(...months),
    endMonth: Math.max(...months),
    day: clampBillingDay(dayRaw),
  }
}

export default function AbonnementerPage() {
  const {
    serviceSubscriptions,
    transactions,
    budgetCategories,
    debts,
    isHouseholdAggregate,
    addServiceSubscription,
    updateServiceSubscription,
    removeServiceSubscription,
    profiles,
    budgetYear,
    customBudgetLabels,
    addBudgetCategory,
    addCustomBudgetLabel,
  } = useActivePersonFinance()

  const now = new Date()
  const defaultDay = clampBillingDay(now.getDate())

  const [infoOpen, setInfoOpen] = useState(false)
  /** Åpen redigeringsdialog for valgt abonnement (kun profilmodus). */
  const [editingSubscription, setEditingSubscription] = useState<ServiceSubscription | null>(null)

  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [newBilling, setNewBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [newSync, setNewSync] = useState(true)
  const [newPlannedTx, setNewPlannedTx] = useState(true)
  /** Månedsvindu for budsjett (kun månedlig); planlagte trekk kopierer herfra som standard. */
  const [budgetStartMonth, setBudgetStartMonth] = useState(1)
  const [budgetEndMonth, setBudgetEndMonth] = useState(12)
  const [txStartMonth, setTxStartMonth] = useState(1)
  const [txEndMonth, setTxEndMonth] = useState(12)
  const [txDay, setTxDay] = useState(defaultDay)
  const [presetKey, setPresetKey] = useState('')
  /** Synk: egen budsjettlinje (standard) vs eksisterende Regninger-linje */
  const [newBudgetDedicated, setNewBudgetDedicated] = useState(true)
  const [newSharedCategoryId, setNewSharedCategoryId] = useState('')
  /** Tom = jevn fordeling for årlig; ellers månedsnummer 1–12 */
  const [newYearlyChargeMonth, setNewYearlyChargeMonth] = useState<number | ''>('')

  const debtLinkedCategoryIds = useMemo(() => {
    const ids = new Set<string>()
    for (const d of debts) {
      if (d.linkedBudgetCategoryId) ids.add(d.linkedBudgetCategoryId)
    }
    return ids
  }, [debts])

  const regningerCategoryOptions = useMemo(
    () =>
      budgetCategories.filter(
        (c) => c.parentCategory === 'regninger' && !debtLinkedCategoryIds.has(c.id),
      ),
    [budgetCategories, debtLinkedCategoryIds],
  )

  const subscriptionSharedLinePartition = useMemo(
    () => partitionRegningerForSubscriptionSharedLine(regningerCategoryOptions),
    [regningerCategoryOptions],
  )

  const legacyNewSharedCategory = useMemo(
    () =>
      subscriptionSharedLineLegacyCategory(
        regningerCategoryOptions,
        subscriptionSharedLinePartition,
        newSharedCategoryId,
      ),
    [regningerCategoryOptions, subscriptionSharedLinePartition, newSharedCategoryId],
  )

  const handleNewSharedCategoryChange = useCallback(
    (value: string) => {
      const desired = desiredNameForAutoSelectValue(value)
      if (desired) {
        const id = ensureSubscriptionSharedRegningerLine(
          desired,
          budgetCategories,
          addBudgetCategory,
          addCustomBudgetLabel,
          customBudgetLabels,
        )
        setNewSharedCategoryId(id)
        return
      }
      setNewSharedCategoryId(value)
    },
    [budgetCategories, addBudgetCategory, addCustomBudgetLabel, customBudgetLabels],
  )

  const [newRegningerLineModalOpen, setNewRegningerLineModalOpen] = useState(false)
  const prevNewYearlyChargeRef = useRef<number | ''>('')
  const prevNewPlannedTxRef = useRef(false)

  useEffect(() => {
    if (newPlannedTx && !prevNewPlannedTxRef.current && newSync && newBilling === 'monthly') {
      setTxStartMonth(budgetStartMonth)
      setTxEndMonth(budgetEndMonth)
    }
    prevNewPlannedTxRef.current = newPlannedTx
  }, [newPlannedTx, newSync, newBilling, budgetStartMonth, budgetEndMonth])

  useEffect(() => {
    if (!newPlannedTx || newBilling !== 'yearly' || newYearlyChargeMonth === '') return
    const m = Math.min(12, Math.max(1, Math.floor(Number(newYearlyChargeMonth))))
    setTxStartMonth(m)
    setTxEndMonth(m)
  }, [newBilling, newYearlyChargeMonth, newPlannedTx])

  useEffect(() => {
    if (!newPlannedTx || newBilling !== 'yearly') {
      prevNewYearlyChargeRef.current = newYearlyChargeMonth
      return
    }
    if (
      newYearlyChargeMonth === '' &&
      prevNewYearlyChargeRef.current !== '' &&
      prevNewYearlyChargeRef.current !== undefined
    ) {
      const n = new Date()
      setTxStartMonth(n.getMonth() + 1)
      setTxEndMonth(12)
    }
    prevNewYearlyChargeRef.current = newYearlyChargeMonth
  }, [newBilling, newYearlyChargeMonth, newPlannedTx])

  const visibleSubscriptions = useMemo(
    () => serviceSubscriptions.filter((s) => !s.cancelledFrom),
    [serviceSubscriptions],
  )

  const totals = useMemo(() => {
    let m = 0
    let y = 0
    let activeCount = 0
    for (const s of serviceSubscriptions) {
      if (!s.active || s.cancelledFrom) continue
      activeCount += 1
      m += monthlyEquivalentNok(s)
      y += yearlyEquivalentNok(s)
    }
    return { monthly: m, yearly: y, activeCount }
  }, [serviceSubscriptions])

  const duplicatePresetGroups = useMemo(
    () => (isHouseholdAggregate ? findDuplicatePresetServiceGroups(serviceSubscriptions) : []),
    [isHouseholdAggregate, serviceSubscriptions],
  )

  const dismissedDuplicateSubscriptionPresetKeys = useStore((s) => s.dismissedDuplicateSubscriptionPresetKeys)
  const dismissDuplicateSubscriptionHint = useStore((s) => s.dismissDuplicateSubscriptionHint)
  const dismissAllDuplicateSubscriptionHints = useStore((s) => s.dismissAllDuplicateSubscriptionHints)
  const resetDismissedDuplicateSubscriptionHints = useStore((s) => s.resetDismissedDuplicateSubscriptionHints)

  const visibleDuplicatePresetGroups = useMemo(
    () => duplicatePresetGroups.filter((g) => !dismissedDuplicateSubscriptionPresetKeys.includes(g.presetKey)),
    [duplicatePresetGroups, dismissedDuplicateSubscriptionPresetKeys],
  )

  const readonly = isHouseholdAggregate

  const profileName = (id?: string) => profiles.find((p) => p.id === id)?.name ?? 'Profil'

  const applyPreset = (key: string) => {
    setPresetKey(key)
    for (const g of SERVICE_SUBSCRIPTION_PRESETS) {
      const hit = g.items.find((i) => i.key === key)
      if (hit) {
        setNewLabel(hit.label === 'Annet (fritekst)' ? '' : hit.label)
        return
      }
    }
  }

  const handleAdd = () => {
    const label = newLabel.trim() || 'Abonnement'
    if (newSync && newBilling === 'monthly' && budgetStartMonth > budgetEndMonth) {
      return
    }
    if (newSync && newPlannedTx && txStartMonth > txEndMonth) {
      return
    }
    if (newSync && !newBudgetDedicated && !newSharedCategoryId.trim()) {
      window.alert('Velg hvilken Regninger-linje abonnementet skal ligge under.')
      return
    }
    const plannedTransactions =
      newSync && newPlannedTx
        ? {
            startMonth1: txStartMonth,
            endMonth1: txEndMonth,
            dayOfMonth: clampBillingDay(txDay),
            budgetYear,
          }
        : null
    const ycm =
      newBilling === 'yearly' && newYearlyChargeMonth !== ''
        ? Math.min(12, Math.max(1, Math.floor(Number(newYearlyChargeMonth))))
        : undefined
    const res = addServiceSubscription({
      label,
      amountNok: Math.max(0, newAmount),
      billing: newBilling,
      active: true,
      syncToBudget: newSync,
      budgetLinkMode: newSync ? (newBudgetDedicated ? 'dedicated' : 'shared') : undefined,
      existingBudgetCategoryId:
        newSync && !newBudgetDedicated ? newSharedCategoryId.trim() : undefined,
      yearlyChargeMonth1: newBilling === 'yearly' ? ycm : undefined,
      budgetStartMonth1: newSync && newBilling === 'monthly' ? budgetStartMonth : undefined,
      budgetEndMonth1: newSync && newBilling === 'monthly' ? budgetEndMonth : undefined,
      presetKey: presetKey || undefined,
      plannedTransactions,
    })
    if (res.ok) {
      setNewLabel('')
      setNewAmount(0)
      setNewBilling('monthly')
      setNewSync(true)
      setNewPlannedTx(true)
      setNewBudgetDedicated(true)
      setNewSharedCategoryId('')
      setNewYearlyChargeMonth('')
      setBudgetStartMonth(1)
      setBudgetEndMonth(12)
      setTxStartMonth(1)
      setTxEndMonth(12)
      setTxDay(clampBillingDay(new Date().getDate()))
      setPresetKey('')
    } else if (res.reason === 'invalid_budget_category') {
      window.alert('Fant ikke valgt budsjettlinje under Regninger. Oppdater siden og prøv igjen.')
    }
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Tjenesteabonnementer"
        subtitle="Oversikt over faste abonnementer"
        titleAddon={
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
            aria-label="Om denne siden"
            onClick={() => setInfoOpen(true)}
          >
            <Info size={18} aria-hidden />
          </button>
        }
      />
      <AbonnementerSubnav />
      <SubscriptionModuleInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      {!readonly && (
        <NewBudgetCategoryModal
          open={newRegningerLineModalOpen}
          onClose={() => setNewRegningerLineModalOpen(false)}
          onCreated={({ id }) => {
            setNewSharedCategoryId(id)
            setNewRegningerLineModalOpen(false)
          }}
          customBudgetLabels={customBudgetLabels}
          budgetCategories={budgetCategories}
          addCustomBudgetLabel={addCustomBudgetLabel}
          addBudgetCategory={addBudgetCategory}
          initialKind="expense"
          initialExpenseParent="regninger"
        />
      )}
      {editingSubscription && !readonly && (
        <EditSubscriptionDialog
          subscription={editingSubscription}
          transactions={transactions}
          budgetYear={budgetYear}
          allRegningerCategoryOptions={regningerCategoryOptions}
          subscriptionSharedLinePartition={subscriptionSharedLinePartition}
          onClose={() => setEditingSubscription(null)}
          onSave={(patch) => {
            const res = updateServiceSubscription(editingSubscription.id, patch)
            if (res.ok) setEditingSubscription(null)
            else if (res.reason === 'invalid_budget_category') {
              window.alert('Fant ikke valgt budsjettlinje. Velg en gyldig linje under Regninger.')
            }
          }}
        />
      )}

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {readonly && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
          >
            Du viser <strong style={{ color: 'var(--text)' }}>samlet husholdning</strong>. Abonnementer kan bare
            redigeres når du har valgt én profil i menyen øverst.
          </div>
        )}

        {readonly && visibleDuplicatePresetGroups.length > 0 && (
          <div
            className="rounded-xl border px-4 py-3 text-sm space-y-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--primary-pale)',
              color: 'var(--text-muted)',
            }}
            role="status"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide m-0" style={{ color: 'var(--primary)' }}>
                Mulig å samle abonnement
              </p>
              <button
                type="button"
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
                aria-label="Skjul alle tips om å samle abonnement som vises nå"
                onClick={() =>
                  dismissAllDuplicateSubscriptionHints(visibleDuplicatePresetGroups.map((g) => g.presetKey))
                }
              >
                Skjul alle
              </button>
            </div>
            <ul className="list-none space-y-3 m-0 p-0">
              {visibleDuplicatePresetGroups.map((g) => (
                <li key={g.presetKey} className="space-y-2">
                  <DuplicateServiceHintSentence
                    serviceLabel={g.serviceLabel}
                    profileNames={g.profileIds.map((id) => profileName(id))}
                  />
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="m-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Vi har det slik med vilje
                    </p>
                    <button
                      type="button"
                      className="self-start rounded-lg px-3 py-1.5 text-xs font-medium sm:self-auto"
                      style={{
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                      aria-label={`Skjul tips om å samle ${g.serviceLabel}`}
                      onClick={() => dismissDuplicateSubscriptionHint(g.presetKey)}
                    >
                      Skjul dette tipset
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {dismissedDuplicateSubscriptionPresetKeys.length > 0 ? (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  className="text-xs font-medium underline-offset-2 hover:underline"
                  style={{ color: 'var(--primary)' }}
                  aria-label="Vis skjulte abonnementsforslag om å samle tjenester igjen"
                  onClick={() => resetDismissedDuplicateSubscriptionHints()}
                >
                  Vis skjulte abonnementsforslag igjen
                </button>
              </div>
            ) : null}
          </div>
        )}

        {readonly &&
          visibleDuplicatePresetGroups.length === 0 &&
          dismissedDuplicateSubscriptionPresetKeys.length > 0 && (
            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              <button
                type="button"
                className="text-sm font-medium underline-offset-2 hover:underline"
                style={{ color: 'var(--primary)' }}
                aria-label="Vis skjulte abonnementsforslag om å samle tjenester igjen"
                onClick={() => resetDismissedDuplicateSubscriptionHints()}
              >
                Vis skjulte abonnementsforslag igjen
              </button>
            </div>
          )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Sum per måned (aktive)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(totals.monthly)}
            </p>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Sum per år (aktive)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(totals.yearly)}
            </p>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Antall aktive abonnementer
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {totals.activeCount}
            </p>
          </div>
        </div>

        <section
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Registrerte abonnementer
            </h2>
            {!readonly && visibleSubscriptions.length > 0 && (
              <p className="text-xs mt-1 m-0" style={{ color: 'var(--text-muted)' }}>
                Trykk på en rad for å endre beløp, navn eller synk til budsjett.
              </p>
            )}
          </div>
          {visibleSubscriptions.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {readonly ? (
                <>
                  Ingen abonnementer registrert i denne visningen ennå. Velg <strong style={{ color: 'var(--text)' }}>én
                  profil</strong> i menyen øverst for å legge inn eller redigere tjenesteabonnementer.
                </>
              ) : (
                <>Ingen abonnementer ennå. Legg til under.</>
              )}
            </p>
          ) : (
            <ul>
              {visibleSubscriptions.map((s) => (
                <li
                  key={s.id}
                  className="border-t px-4 py-3 sm:py-4 first:border-t-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* grid: unngå at flex-1-raden visuelt overlapper ikonkolonnen (pennen fikk da ikke klikk) */}
                  <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-2 items-start">
                    {readonly ? (
                      <div className="min-w-0">
                        <SubscriptionRowContent
                          s={s}
                          isHouseholdAggregate={isHouseholdAggregate}
                          profileName={profileName}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="min-w-0 text-left rounded-xl px-2 -mx-2 py-2 -my-1 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        style={{ color: 'inherit' }}
                        aria-label={`Rediger ${subLabelForAria(s.label)}`}
                        onClick={() => setEditingSubscription(s)}
                      >
                        <SubscriptionRowContent
                          s={s}
                          isHouseholdAggregate={isHouseholdAggregate}
                          profileName={profileName}
                        />
                        <span className="sr-only">. Åpner redigering.</span>
                      </button>
                    )}
                    {!readonly && (
                      <div className="relative z-10 flex shrink-0 gap-0.5 self-center">
                        <button
                          type="button"
                          className="rounded-lg p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label={`Rediger ${subLabelForAria(s.label)}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditingSubscription(s)
                          }}
                        >
                          <Pencil size={18} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                          style={{ color: 'var(--danger)' }}
                          aria-label={`Slett ${subLabelForAria(s.label)}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Fjerne «${s.label}» fra listen?`)) removeServiceSubscription(s.id)
                          }}
                        >
                          <Trash2 size={18} aria-hidden />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!readonly && (
          <section
            className="rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Legg til abonnement
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Velg fra liste</span>
                <select
                  value={presetKey}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="">— Velg —</option>
                  {SERVICE_SUBSCRIPTION_PRESETS.map((g) => (
                    <optgroup key={g.group} label={g.groupLabel}>
                      {g.items.map((i) => (
                        <option key={i.key} value={i.key}>
                          {i.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Navn</span>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  placeholder="f.eks. Netflix"
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Beløp (NOK)</span>
                <FormattedAmountInput
                  value={newAmount}
                  onChange={setNewAmount}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  aria-label="Beløp"
                />
              </label>
              <fieldset className="text-sm">
                <legend className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  Periode
                </legend>
                <div className="flex flex-wrap gap-4 touch-manipulation">
                  <label className="inline-flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      name="billing"
                      checked={newBilling === 'monthly'}
                      onChange={() => {
                        setNewBilling('monthly')
                        setNewYearlyChargeMonth('')
                      }}
                    />
                    Månedlig
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      name="billing"
                      checked={newBilling === 'yearly'}
                      onChange={() => setNewBilling('yearly')}
                    />
                    Årlig
                  </label>
                </div>
              </fieldset>
              {newBilling === 'yearly' && (
                <label className="block text-sm sm:col-span-2">
                  <span style={{ color: 'var(--text-muted)' }}>Forfallsmåned (årlig beløp)</span>
                  <select
                    value={newYearlyChargeMonth === '' ? '' : String(newYearlyChargeMonth)}
                    onChange={(e) => {
                      const v = e.target.value
                      setNewYearlyChargeMonth(v === '' ? '' : parseInt(v, 10))
                    }}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="">Jevnt fordelt over året (standard)</option>
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Valgfritt. Ved valgt måned: hele beløpet i budsjett og ett planlagt trekk den måneden (typisk årlig
                    forsikring).
                  </span>
                </label>
              )}
              <label className="flex items-center gap-2 text-sm sm:col-span-2 cursor-pointer min-h-[44px] touch-manipulation">
                <input
                  type="checkbox"
                  checked={newSync}
                  onChange={(e) => {
                    const v = e.target.checked
                    setNewSync(v)
                    if (!v) {
                      setNewPlannedTx(false)
                      setNewBudgetDedicated(true)
                    }
                  }}
                />
                <span style={{ color: 'var(--text)' }}>Legg inn i budsjettet under Regninger</span>
              </label>
              {newSync && (
                <div className="sm:col-span-2 space-y-3 rounded-xl border px-3 py-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="space-y-2">
                    <p className="text-xs font-medium m-0" style={{ color: 'var(--text-muted)' }}>
                      Budsjettlinje
                    </p>
                    <label className="flex items-start gap-2 text-sm cursor-pointer touch-manipulation">
                      <input
                        type="radio"
                        name="newBudgetLineMode"
                        className="mt-1 shrink-0"
                        checked={newBudgetDedicated}
                        onChange={() => setNewBudgetDedicated(true)}
                      />
                      <span style={{ color: 'var(--text)' }}>Egen linje under Regninger (standard)</span>
                    </label>
                    <label className="flex items-start gap-2 text-sm cursor-pointer touch-manipulation">
                      <input
                        type="radio"
                        name="newBudgetLineMode"
                        className="mt-1 shrink-0"
                        checked={!newBudgetDedicated}
                        onChange={() => setNewBudgetDedicated(false)}
                      />
                      <span style={{ color: 'var(--text)' }}>
                        Bruk eksisterende linje (samle flere abonnement under én post)
                      </span>
                    </label>
                    {!newBudgetDedicated && (
                      <div className="pl-7 sm:pl-8 space-y-2 min-w-0">
                        <label className="block text-sm min-w-0">
                          <span style={{ color: 'var(--text-muted)' }}>Velg linje under Regninger</span>
                          <select
                            value={newSharedCategoryId}
                            onChange={(e) => handleNewSharedCategoryChange(e.target.value)}
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                            style={{
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              color: 'var(--text)',
                            }}
                          >
                            <option value="">— Velg —</option>
                            <SubscriptionSharedLineOptgroups
                              partition={subscriptionSharedLinePartition}
                              legacy={legacyNewSharedCategory}
                            />
                          </select>
                        </label>
                        <button
                          type="button"
                          className="text-sm font-medium rounded-xl px-3 py-2.5 min-h-[44px] w-full sm:w-auto touch-manipulation text-left sm:text-center"
                          style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
                          onClick={() => setNewRegningerLineModalOpen(true)}
                        >
                          Opprett ny linje under Regninger …
                        </button>
                      </div>
                    )}
                  </div>
                  {newBilling === 'monthly' && (
                    <div className="space-y-2 min-w-0">
                      <p className="text-xs font-medium m-0" style={{ color: 'var(--text-muted)' }}>
                        Budsjett: hvilke måneder (budsjettår {budgetYear})
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block text-sm min-w-0">
                          <span style={{ color: 'var(--text-muted)' }}>Fra måned</span>
                          <select
                            value={budgetStartMonth}
                            onChange={(e) => setBudgetStartMonth(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            {MONTH_OPTIONS.map((o) => (
                              <option key={o.v} value={o.v}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm min-w-0">
                          <span style={{ color: 'var(--text-muted)' }}>Til måned</span>
                          <select
                            value={budgetEndMonth}
                            onChange={(e) => setBudgetEndMonth(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            {MONTH_OPTIONS.map((o) => (
                              <option key={o.v} value={o.v}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Planbeløpet i budsjettet gjelder bare valgte måneder. «Planlagte utgifter» bruker samme periode som
                        standard når du huker av nedenfor.
                      </p>
                      {budgetStartMonth > budgetEndMonth && (
                        <p className="text-xs m-0" style={{ color: 'var(--danger)' }}>
                          Startmåned kan ikke være etter sluttmåned.
                        </p>
                      )}
                    </div>
                  )}
                  <label className="flex items-start gap-2 text-sm cursor-pointer touch-manipulation">
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={newPlannedTx}
                      onChange={(e) => setNewPlannedTx(e.target.checked)}
                    />
                    <span>
                      <span style={{ color: 'var(--text)' }}>Legg også inn planlagte utgifter i transaksjoner</span>
                      <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {newBilling === 'yearly' && newYearlyChargeMonth !== '' && newPlannedTx ? (
                          <>
                            Ett planlagt trekk i forfallsmåneden med hele årsbeløpet (budsjettår {budgetYear}). Dette er
                            planlagte trekk, ikke bankimport. Brukt-beløp og budsjett kan overlappe — se hjelpeteksten om
                            abonnement.
                          </>
                        ) : (
                          <>
                            {newBilling === 'monthly' ? (
                              <>
                                Én linje per måned i valgt periode (budsjettår {budgetYear}). Som standard brukes samme
                                måneder som under «Budsjett» ovenfor — du kan endre her. Planlagte trekk, ikke bankimport.
                              </>
                            ) : (
                              <>
                                Én linje per måned i valgt periode (budsjettår {budgetYear}). Dette er planlagte trekk,
                                ikke bankimport. Brukt-beløp og budsjett kan overlappe — se hjelpeteksten om abonnement.
                              </>
                            )}
                          </>
                        )}
                      </span>
                    </span>
                  </label>
                  {newPlannedTx &&
                    (newBilling === 'yearly' && newYearlyChargeMonth !== '' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>
                            Planlagt trekk (samme som forfallsmåned)
                          </span>
                          <div
                            className="mt-1 w-full rounded-lg px-2 py-2 text-sm min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            {MONTH_OPTIONS.find((o) => o.v === newYearlyChargeMonth)?.label ?? '—'}
                          </div>
                        </label>
                        <label className="block text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>Dag i måneden (1–31)</span>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={txDay}
                            onChange={(e) => setTxDay(clampBillingDay(parseInt(e.target.value, 10) || 1))}
                            className="mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="block text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>Fra måned</span>
                          <select
                            value={txStartMonth}
                            onChange={(e) => setTxStartMonth(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-lg px-2 py-2 text-sm min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            {MONTH_OPTIONS.map((o) => (
                              <option key={o.v} value={o.v}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>Til måned</span>
                          <select
                            value={txEndMonth}
                            onChange={(e) => setTxEndMonth(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-lg px-2 py-2 text-sm min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            {MONTH_OPTIONS.map((o) => (
                              <option key={o.v} value={o.v}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>Dag i måneden (1–31)</span>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={txDay}
                            onChange={(e) => setTxDay(clampBillingDay(parseInt(e.target.value, 10) || 1))}
                            className="mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums min-h-[44px] touch-manipulation"
                            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                        </label>
                      </div>
                    ))}
                  {newPlannedTx && txStartMonth > txEndMonth && (
                    <p className="text-xs m-0" style={{ color: 'var(--danger)' }}>
                      Startmåned kan ikke være etter sluttmåned.
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 min-h-[44px] min-w-[44px] text-sm font-medium text-white disabled:opacity-50 touch-manipulation"
              style={{ background: 'var(--primary)' }}
              disabled={
                newAmount <= 0 ||
                (newSync && newBilling === 'monthly' && budgetStartMonth > budgetEndMonth) ||
                (newSync && newPlannedTx && txStartMonth > txEndMonth)
              }
              onClick={handleAdd}
            >
              <Plus size={18} />
              Legg til
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

function SubscriptionSharedLineOptgroups({
  partition,
  legacy,
}: {
  partition: SubscriptionSharedLinePartition
  legacy?: BudgetCategory
}) {
  return (
    <>
      {legacy ? (
        <optgroup label="Annet valg (fra før)">
          <option value={legacy.id}>{legacy.name}</option>
        </optgroup>
      ) : null}
      <optgroup label="Streaming">
        {partition.streaming.length > 0 ? (
          partition.streaming.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))
        ) : (
          <option value={AUTO_SELECT_TV_STREAMING_VALUE}>Streaming (legges til)</option>
        )}
      </optgroup>
      <optgroup label="Abonnementer">
        {partition.abonnement.length > 0 ? (
          partition.abonnement.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))
        ) : (
          <option value={AUTO_SELECT_ABONNEMENTER_VALUE}>Abonnementer (legges til)</option>
        )}
      </optgroup>
    </>
  )
}

function subLabelForAria(label: string): string {
  const t = label.trim()
  return t || 'abonnement'
}

function SubscriptionRowContent({
  s,
  isHouseholdAggregate,
  profileName,
}: {
  s: ServiceSubscription
  isHouseholdAggregate: boolean
  profileName: (id?: string) => string
}) {
  return (
    <>
      <p className="font-medium" style={{ color: 'var(--text)' }}>
        {s.label}
        {!s.active && (
          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
            (på pause)
          </span>
        )}
      </p>
      {isHouseholdAggregate && s.sourceProfileId && (
        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          Profil: {profileName(s.sourceProfileId)}
        </p>
      )}
      <p className="mt-1 text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {subscriptionPriceSummaryLine(s)}
      </p>
      {s.syncToBudget && s.active && !s.cancelledFrom && (
        <p className="mt-1 text-xs" style={{ color: 'var(--primary)' }}>
          {s.budgetLinkMode === 'shared'
            ? 'Synket til budsjett (delt Regninger-linje)'
            : 'Synket til budsjett (Regninger)'}
        </p>
      )}
    </>
  )
}

function EditSubscriptionDialog({
  subscription,
  transactions,
  budgetYear,
  allRegningerCategoryOptions,
  subscriptionSharedLinePartition,
  onClose,
  onSave,
}: {
  subscription: ServiceSubscription
  transactions: Transaction[]
  budgetYear: number
  allRegningerCategoryOptions: BudgetCategory[]
  subscriptionSharedLinePartition: SubscriptionSharedLinePartition
  onClose: () => void
  onSave: (patch: UpdateServiceSubscriptionPatch) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    // Etter neste paint: unngår at klikket som åpnet dialogen samtidig lukker/stopper modal (native <dialog>)
    const frame = requestAnimationFrame(() => {
      const d = dialogRef.current
      if (!d || d.open) return
      try {
        d.showModal()
      } catch {
        requestAnimationFrame(() => {
          try {
            dialogRef.current?.showModal()
          } catch {
            /* f.eks. annen modal åpen */
          }
        })
      }
    })
    return () => {
      cancelAnimationFrame(frame)
      if (el.open) el.close()
    }
  }, [subscription.id])

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[200] m-0 w-[min(100vw-1.5rem,28rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-0 p-0 backdrop:bg-black/40"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
      onClose={onClose}
    >
      <div className="max-h-[min(90dvh,40rem)] overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold m-0 pr-2" style={{ color: 'var(--text)' }}>
            Rediger abonnement
          </h2>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
            onClick={onClose}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <p className="text-xs mt-2 m-0" style={{ color: 'var(--text-muted)' }}>
          Oppdater beløp, navn, faktureringsperiode, synk til budsjett og eventuelle planlagte transaksjoner.
        </p>
        <div className="mt-4">
          <EditRow
            key={subscription.id}
            initial={subscription}
            transactions={transactions}
            budgetYear={budgetYear}
            allRegningerCategoryOptions={allRegningerCategoryOptions}
            subscriptionSharedLinePartition={subscriptionSharedLinePartition}
            onSave={(patch) => {
              onSave(patch)
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </dialog>
  )
}

const DUPLICATE_HINT_SUFFIX =
  ' Mange slike tjenester tilbyr familie- eller delt abonnement – det kan være verdt å sjekke om dere kan samle det.'

function DuplicateServiceHintSentence({
  serviceLabel,
  profileNames,
}: {
  serviceLabel: string
  profileNames: string[]
}) {
  const namesPart =
    profileNames.length === 2 ? (
      <>
        for både <strong>{profileNames[0]}</strong> og <strong>{profileNames[1]}</strong>
      </>
    ) : (
      <>
        for{' '}
        {profileNames.map((n, i) => (
          <span key={`${n}-${i}`}>
            {i > 0 && (i === profileNames.length - 1 ? ' og ' : ', ')}
            <strong>{n}</strong>
          </span>
        ))}
      </>
    )

  return (
    <p className="m-0" style={{ color: 'var(--text)' }}>
      Dere har registrert <strong>{serviceLabel}</strong> {namesPart}
      {'.'}
      {DUPLICATE_HINT_SUFFIX}
    </p>
  )
}

function EditRow({
  initial,
  transactions,
  budgetYear,
  allRegningerCategoryOptions,
  subscriptionSharedLinePartition,
  onSave,
  onCancel,
}: {
  initial: ServiceSubscription
  transactions: Transaction[]
  budgetYear: number
  allRegningerCategoryOptions: BudgetCategory[]
  subscriptionSharedLinePartition: SubscriptionSharedLinePartition
  onSave: (patch: UpdateServiceSubscriptionPatch) => void
  onCancel: () => void
}) {
  const { customBudgetLabels, budgetCategories, addBudgetCategory, addCustomBudgetLabel } =
    useActivePersonFinance()

  const [label, setLabel] = useState(initial.label)
  const [amount, setAmount] = useState(initial.amountNok)
  const [billing, setBilling] = useState(initial.billing)
  const [active, setActive] = useState(initial.active)
  const [sync, setSync] = useState(initial.syncToBudget)
  const [linkDedicated, setLinkDedicated] = useState(initial.budgetLinkMode !== 'shared')
  const [sharedCatId, setSharedCatId] = useState(
    initial.budgetLinkMode === 'shared' && initial.linkedBudgetCategoryId
      ? initial.linkedBudgetCategoryId
      : '',
  )
  const [yearlyChargeMonth, setYearlyChargeMonth] = useState<number | ''>(initial.yearlyChargeMonth1 ?? '')
  const [plannedTx, setPlannedTx] = useState(() => plannedTxEditDefaults(initial, transactions, budgetYear))
  const [budgetStartMonth, setBudgetStartMonth] = useState(
    () =>
      initial.budgetStartMonth1 ??
      plannedTxEditDefaults(initial, transactions, budgetYear).startMonth,
  )
  const [budgetEndMonth, setBudgetEndMonth] = useState(
    () =>
      initial.budgetEndMonth1 ??
      plannedTxEditDefaults(initial, transactions, budgetYear).endMonth,
  )
  const [newRegningerLineModalOpen, setNewRegningerLineModalOpen] = useState(false)
  const prevEditYearlyChargeRef = useRef<number | ''>('')
  const prevEditPlannedEnabledRef = useRef(false)

  const legacyEditSharedCategory = useMemo(
    () =>
      subscriptionSharedLineLegacyCategory(
        allRegningerCategoryOptions,
        subscriptionSharedLinePartition,
        sharedCatId,
      ),
    [allRegningerCategoryOptions, subscriptionSharedLinePartition, sharedCatId],
  )

  const handleEditSharedCategoryChange = useCallback(
    (value: string) => {
      const desired = desiredNameForAutoSelectValue(value)
      if (desired) {
        const id = ensureSubscriptionSharedRegningerLine(
          desired,
          budgetCategories,
          addBudgetCategory,
          addCustomBudgetLabel,
          customBudgetLabels,
        )
        setSharedCatId(id)
        return
      }
      setSharedCatId(value)
    },
    [budgetCategories, addBudgetCategory, addCustomBudgetLabel, customBudgetLabels],
  )

  useEffect(() => {
    if (!plannedTx.enabled || billing !== 'yearly' || yearlyChargeMonth === '') return
    const m = Math.min(12, Math.max(1, Math.floor(Number(yearlyChargeMonth))))
    setPlannedTx((p) => {
      if (p.startMonth === m && p.endMonth === m) return p
      return { ...p, startMonth: m, endMonth: m }
    })
  }, [billing, yearlyChargeMonth, plannedTx.enabled])

  useEffect(() => {
    if (!plannedTx.enabled || billing !== 'yearly') {
      prevEditYearlyChargeRef.current = yearlyChargeMonth
      return
    }
    if (
      yearlyChargeMonth === '' &&
      prevEditYearlyChargeRef.current !== '' &&
      prevEditYearlyChargeRef.current !== undefined
    ) {
      const n = new Date()
      setPlannedTx((p) => ({
        ...p,
        startMonth: n.getMonth() + 1,
        endMonth: 12,
      }))
    }
    prevEditYearlyChargeRef.current = yearlyChargeMonth
  }, [billing, yearlyChargeMonth, plannedTx.enabled])

  useEffect(() => {
    if (
      plannedTx.enabled &&
      !prevEditPlannedEnabledRef.current &&
      sync &&
      billing === 'monthly'
    ) {
      setPlannedTx((p) => ({ ...p, startMonth: budgetStartMonth, endMonth: budgetEndMonth }))
    }
    prevEditPlannedEnabledRef.current = plannedTx.enabled
  }, [plannedTx.enabled, sync, billing, budgetStartMonth, budgetEndMonth])

  const invalidPlannedRange = sync && plannedTx.enabled && plannedTx.startMonth > plannedTx.endMonth
  const invalidBudgetMonth = sync && billing === 'monthly' && budgetStartMonth > budgetEndMonth
  const invalidShared = sync && !linkDedicated && !sharedCatId.trim()

  const handleSave = () => {
    if (invalidPlannedRange || invalidShared || invalidBudgetMonth) return
    let plannedPart: UpdateServiceSubscriptionPatch['plannedTransactions']
    if (!sync) {
      plannedPart = null
    } else if (plannedTx.enabled) {
      plannedPart = {
        startMonth1: plannedTx.startMonth,
        endMonth1: plannedTx.endMonth,
        dayOfMonth: clampBillingDay(plannedTx.day),
        budgetYear,
      }
    } else {
      plannedPart = null
    }
    const patch: UpdateServiceSubscriptionPatch = {
      label,
      amountNok: amount,
      billing,
      active,
      syncToBudget: sync,
      plannedTransactions: plannedPart,
      yearlyChargeMonth1: billing === 'yearly' ? (yearlyChargeMonth === '' ? undefined : yearlyChargeMonth) : undefined,
      budgetStartMonth1: sync && billing === 'monthly' ? budgetStartMonth : undefined,
      budgetEndMonth1: sync && billing === 'monthly' ? budgetEndMonth : undefined,
    }
    if (sync) {
      patch.budgetLinkMode = linkDedicated ? 'dedicated' : 'shared'
      if (!linkDedicated) {
        patch.existingBudgetCategoryId = sharedCatId.trim()
      }
    }
    onSave(patch)
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Navn</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        <label className="block text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Beløp</span>
          <FormattedAmountInput
            value={amount}
            onChange={setAmount}
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
            aria-label="Beløp"
          />
        </label>
      </div>
      <fieldset className="text-sm">
        <div className="flex flex-wrap gap-4 touch-manipulation">
          <label className="inline-flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input
              type="radio"
              name="edb"
              checked={billing === 'monthly'}
              onChange={() => {
                setBilling('monthly')
                setYearlyChargeMonth('')
              }}
            />
            Månedlig
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input type="radio" name="edb" checked={billing === 'yearly'} onChange={() => setBilling('yearly')} />
            Årlig
          </label>
        </div>
      </fieldset>
      {billing === 'yearly' && (
        <label className="block text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Forfallsmåned (årlig beløp)</span>
          <select
            value={yearlyChargeMonth === '' ? '' : String(yearlyChargeMonth)}
            onChange={(e) => {
              const v = e.target.value
              setYearlyChargeMonth(v === '' ? '' : parseInt(v, 10))
            }}
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="">Jevnt fordelt over året (standard)</option>
            {MONTH_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px] touch-manipulation">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Aktiv
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px] touch-manipulation">
        <input
          type="checkbox"
          checked={sync}
          onChange={(e) => {
            const v = e.target.checked
            setSync(v)
            if (!v) {
              setPlannedTx((p) => ({ ...p, enabled: false }))
              setLinkDedicated(true)
            }
          }}
        />
        Synk til budsjett (Regninger)
      </label>
      {sync && (
        <div className="space-y-3 rounded-xl border px-3 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="space-y-2">
            <p className="text-xs font-medium m-0" style={{ color: 'var(--text-muted)' }}>
              Budsjettlinje
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer touch-manipulation">
              <input
                type="radio"
                name="editBudgetLineMode"
                className="mt-1 shrink-0"
                checked={linkDedicated}
                onChange={() => setLinkDedicated(true)}
              />
              <span style={{ color: 'var(--text)' }}>Egen linje (standard)</span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer touch-manipulation">
              <input
                type="radio"
                name="editBudgetLineMode"
                className="mt-1 shrink-0"
                checked={!linkDedicated}
                onChange={() => setLinkDedicated(false)}
              />
              <span style={{ color: 'var(--text)' }}>Bruk eksisterende Regninger-linje</span>
            </label>
            {!linkDedicated && (
              <div className="pl-7 sm:pl-8 space-y-2 min-w-0">
                <label className="block text-sm min-w-0">
                  <span style={{ color: 'var(--text-muted)' }}>Velg linje</span>
                  <select
                    value={sharedCatId}
                    onChange={(e) => handleEditSharedCategoryChange(e.target.value)}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="">— Velg —</option>
                    <SubscriptionSharedLineOptgroups
                      partition={subscriptionSharedLinePartition}
                      legacy={legacyEditSharedCategory}
                    />
                  </select>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium rounded-xl px-3 py-2.5 min-h-[44px] w-full sm:w-auto touch-manipulation text-left sm:text-center"
                  style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
                  onClick={() => setNewRegningerLineModalOpen(true)}
                >
                  Opprett ny linje under Regninger …
                </button>
              </div>
            )}
          </div>
          {billing === 'monthly' && (
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-medium m-0" style={{ color: 'var(--text-muted)' }}>
                Budsjett: hvilke måneder (budsjettår {budgetYear})
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm min-w-0">
                  <span style={{ color: 'var(--text-muted)' }}>Fra måned</span>
                  <select
                    value={budgetStartMonth}
                    onChange={(e) => setBudgetStartMonth(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm min-w-0">
                  <span style={{ color: 'var(--text-muted)' }}>Til måned</span>
                  <select
                    value={budgetEndMonth}
                    onChange={(e) => setBudgetEndMonth(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Planbeløpet i budsjettet gjelder bare valgte måneder. «Planlagte utgifter» bruker samme periode som standard
                når du huker av nedenfor.
              </p>
              {budgetStartMonth > budgetEndMonth && (
                <p className="text-xs m-0" style={{ color: 'var(--danger)' }}>
                  Startmåned kan ikke være etter sluttmåned.
                </p>
              )}
            </div>
          )}
          <label className="flex items-start gap-2 text-sm cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              checked={plannedTx.enabled}
              onChange={(e) => setPlannedTx((p) => ({ ...p, enabled: e.target.checked }))}
            />
            <span>
              <span style={{ color: 'var(--text)' }}>Legg også inn planlagte utgifter i transaksjoner</span>
              <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {billing === 'yearly' && yearlyChargeMonth !== '' && plannedTx.enabled ? (
                  <>
                    Ett planlagt trekk i forfallsmåneden med hele årsbeløpet (budsjettår {budgetYear}). Planlagte trekk,
                    ikke bankimport. Brukt-beløp og budsjett kan overlappe — se hjelpeteksten om abonnement.
                  </>
                ) : billing === 'monthly' ? (
                  <>
                    Én linje per måned i valgt periode (budsjettår {budgetYear}). Som standard brukes samme måneder som
                    under «Budsjett» ovenfor — du kan endre her. Planlagte trekk, ikke bankimport.
                  </>
                ) : (
                  <>
                    Én linje per måned i valgt periode (budsjettår {budgetYear}). Planlagte trekk, ikke bankimport. Brukt-beløp
                    og budsjett kan overlappe — se hjelpeteksten om abonnement.
                  </>
                )}
              </span>
            </span>
          </label>
          {plannedTx.enabled &&
            (billing === 'yearly' && yearlyChargeMonth !== '' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>
                    Planlagt trekk (samme som forfallsmåned)
                  </span>
                  <div
                    className="mt-1 w-full rounded-lg px-2 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.find((o) => o.v === yearlyChargeMonth)?.label ?? '—'}
                  </div>
                </label>
                <label className="block text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Dag i måneden (1–31)</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={plannedTx.day}
                    onChange={(e) =>
                      setPlannedTx((p) => ({
                        ...p,
                        day: clampBillingDay(parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs min-w-0">
                  <span style={{ color: 'var(--text-muted)' }}>Fra måned</span>
                  <select
                    value={plannedTx.startMonth}
                    onChange={(e) =>
                      setPlannedTx((p) => ({ ...p, startMonth: parseInt(e.target.value, 10) }))
                    }
                    className="mt-1 w-full rounded-lg px-2 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs min-w-0">
                  <span style={{ color: 'var(--text-muted)' }}>Til måned</span>
                  <select
                    value={plannedTx.endMonth}
                    onChange={(e) =>
                      setPlannedTx((p) => ({ ...p, endMonth: parseInt(e.target.value, 10) }))
                    }
                    className="mt-1 w-full rounded-lg px-2 py-2 text-sm min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs min-w-0">
                  <span style={{ color: 'var(--text-muted)' }}>Dag i måneden (1–31)</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={plannedTx.day}
                    onChange={(e) =>
                      setPlannedTx((p) => ({
                        ...p,
                        day: clampBillingDay(parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums min-h-[44px] touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
              </div>
            ))}
          {plannedTx.enabled && invalidPlannedRange && (
            <p className="text-xs m-0" style={{ color: 'var(--danger)' }}>
              Startmåned kan ikke være etter sluttmåned.
            </p>
          )}
          {invalidShared && (
            <p className="text-xs m-0" style={{ color: 'var(--danger)' }}>
              Velg hvilken Regninger-linje abonnementet skal synkes til.
            </p>
          )}
        </div>
      )}
      <NewBudgetCategoryModal
        open={newRegningerLineModalOpen}
        onClose={() => setNewRegningerLineModalOpen(false)}
        onCreated={({ id }) => {
          setSharedCatId(id)
          setNewRegningerLineModalOpen(false)
        }}
        customBudgetLabels={customBudgetLabels}
        budgetCategories={budgetCategories}
        addCustomBudgetLabel={addCustomBudgetLabel}
        addBudgetCategory={addBudgetCategory}
        initialKind="expense"
        initialExpenseParent="regninger"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-medium text-white disabled:opacity-50 touch-manipulation inline-flex items-center justify-center"
          style={{ background: 'var(--primary)' }}
          disabled={invalidPlannedRange || invalidShared || invalidBudgetMonth}
          onClick={handleSave}
        >
          Lagre
        </button>
        <button
          type="button"
          className="rounded-xl px-4 py-2.5 min-h-[44px] text-sm touch-manipulation inline-flex items-center justify-center"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          onClick={onCancel}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
