'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { periodSubtitle } from '@/lib/budgetPeriod'
import { useActivePersonFinance, useStore } from '@/lib/store'
import {
  computeIncomeSprintDerived,
  defaultNewIncomeSprintPlan,
  defaultNewIncomeSprintPlanWithOneSource,
  formatIncomeSprintPlanPeriodNb,
  listMonthKeysInRange,
  parseTaxPercentFieldInput,
  reconcileIncomeSprintPlan,
  smartSpareOverviewReferenceDate,
  yearOptionsTouchingPlan,
  type IncomeSprintGoalBasis,
} from '@/lib/incomeSprint'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { formatNOK, formatThousands, generateId, parseThousands } from '@/lib/utils'
import { AlertTriangle, ChevronRight, CircleHelp, Clock, PiggyBank, Target, TrendingUp, Wallet, X } from 'lucide-react'

export default function SmartSparePage() {
  const {
    upsertIncomeSprintPlan,
    isHouseholdAggregate,
    activeProfileId,
    profiles,
    setActiveProfileId,
    setFinanceScope,
  } = useActivePersonFinance()

  const people = useStore((s) => s.people)
  const router = useRouter()
  const searchParams = useSearchParams()

  const readOnly = isHouseholdAggregate

  const activeProfileName = profiles.find((p) => p.id === activeProfileId)?.name ?? 'Profil'

  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false)
  const createPlanBackdropDismiss = useModalBackdropDismiss(() => setCreatePlanModalOpen(false))
  const [modalStart, setModalStart] = useState('')
  const [modalEnd, setModalEnd] = useState('')
  const [modalGoalBasis, setModalGoalBasis] = useState<IncomeSprintGoalBasis>('afterTax')
  const [modalTargetStr, setModalTargetStr] = useState('')
  const [modalApplyTax, setModalApplyTax] = useState(false)
  const [modalTaxPercent, setModalTaxPercent] = useState(40)
  const [modalTaxPercentStr, setModalTaxPercentStr] = useState('')
  const [modalPlanName, setModalPlanName] = useState('')
  const [createPlanHelpOpen, setCreatePlanHelpOpen] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const createModalFirstFieldRef = useRef<HTMLInputElement>(null)
  const createPlanHelpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const legacyPlan = searchParams.get('plan')
    if (legacyPlan) {
      router.replace(`/sparing/smartspare/${encodeURIComponent(legacyPlan)}`)
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!createPlanModalOpen) return
    const d = defaultNewIncomeSprintPlan()
    setModalStart(d.startDate)
    setModalEnd(d.endDate)
    setModalGoalBasis(d.goalBasis)
    setModalTargetStr(d.targetAmount > 0 ? formatThousands(String(d.targetAmount)) : '')
    setModalApplyTax(d.applyTax)
    setModalTaxPercent(d.taxPercent)
    setModalTaxPercentStr(d.taxPercent === 0 ? '' : String(d.taxPercent))
    setModalPlanName('')
    setCreatePlanHelpOpen(false)
    setModalError(null)
  }, [createPlanModalOpen])

  useEffect(() => {
    if (!createPlanHelpOpen) return
    const close = (e: PointerEvent) => {
      if (createPlanHelpRef.current && !createPlanHelpRef.current.contains(e.target as Node)) {
        setCreatePlanHelpOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [createPlanHelpOpen])

  useEffect(() => {
    if (!createPlanModalOpen) return
    const id = requestAnimationFrame(() => createModalFirstFieldRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [createPlanModalOpen])

  useEffect(() => {
    if (!createPlanModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreatePlanModalOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [createPlanModalOpen])

  const goToPlan = useCallback(
    (planId: string, ownerProfileId: string) => {
      setFinanceScope('profile')
      if (ownerProfileId !== activeProfileId) setActiveProfileId(ownerProfileId)
      router.push(`/sparing/smartspare/${planId}`)
    },
    [activeProfileId, router, setActiveProfileId, setFinanceScope],
  )

  const handleCreatePlanSubmit = () => {
    if (readOnly) return
    const keys = listMonthKeysInRange(modalStart, modalEnd)
    if (keys.length === 0) {
      setModalError('Velg start- og sluttdato slik at perioden inneholder minst én måned (start før eller samme måned som slutt).')
      return
    }
    const base = defaultNewIncomeSprintPlanWithOneSource(generateId())
    const tax = modalApplyTax ? parseTaxPercentFieldInput(modalTaxPercentStr) : modalTaxPercent
    const newPlan = reconcileIncomeSprintPlan({
      ...base,
      name: modalPlanName.trim() || undefined,
      startDate: modalStart,
      endDate: modalEnd,
      goalBasis: modalGoalBasis,
      targetAmount: parseThousands(modalTargetStr),
      applyTax: modalApplyTax,
      taxPercent: tax,
    })
    upsertIncomeSprintPlan(newPlan)
    setCreatePlanModalOpen(false)
    router.push(`/sparing/smartspare/${newPlan.id}`)
  }

  const plansForToolbar = useMemo(() => {
    const profileIds = isHouseholdAggregate ? profiles.map((p) => p.id) : [activeProfileId]
    return profileIds.flatMap((pid) => people[pid]?.incomeSprintPlans ?? [])
  }, [people, profiles, isHouseholdAggregate, activeProfileId])

  const overviewYearOptions = useMemo(() => {
    const s = new Set<number>([new Date().getFullYear()])
    for (const p of plansForToolbar) {
      for (const y of yearOptionsTouchingPlan(p)) s.add(y)
    }
    return [...s].sort((a, b) => b - a)
  }, [plansForToolbar])

  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear())
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())

  useEffect(() => {
    const s = new Set<number>([new Date().getFullYear()])
    for (const p of plansForToolbar) {
      for (const y of yearOptionsTouchingPlan(p)) s.add(y)
    }
    const opts = [...s].sort((a, b) => b - a)
    if (opts.length === 0) return
    const y = new Date().getFullYear()
    setFilterYear(opts.includes(y) ? y : opts[0]!)
  }, [isHouseholdAggregate, activeProfileId, plansForToolbar])

  const overviewReferenceDate = useMemo(
    () => smartSpareOverviewReferenceDate(filterYear, periodMode, monthIndex),
    [filterYear, periodMode, monthIndex],
  )

  const allDashboardRows = useMemo(() => {
    const profileIds = isHouseholdAggregate ? profiles.map((p) => p.id) : [activeProfileId]
    const rows = profileIds.flatMap((pid) => {
      const prof = profiles.find((p) => p.id === pid)
      const profileName = prof?.name ?? ''
      return (people[pid]?.incomeSprintPlans ?? []).map((plan) => ({
        profileId: pid,
        profileName,
        plan,
        derived: computeIncomeSprintDerived(plan, overviewReferenceDate, {
          filterYear,
          periodMode,
          monthIndex,
        }),
      }))
    })
    rows.sort((a, b) => b.plan.endDate.localeCompare(a.plan.endDate))
    return rows
  }, [people, profiles, isHouseholdAggregate, activeProfileId, overviewReferenceDate, filterYear, periodMode, monthIndex])

  const aggregateKpi = useMemo(() => {
    let target = 0
    let earnedToward = 0
    let paid = 0
    let pending = 0
    let remaining = 0
    for (const row of allDashboardRows) {
      const d = row.derived
      if (!d) continue
      target += d.targetAmount
      earnedToward += d.earnedInGoalBasis
      paid += d.paidTotalToDate
      pending += d.pendingNotReceived
      remaining += d.remaining
    }
    return { target, earnedToward, paid, pending, remaining }
  }, [allDashboardRows])

  const safePad = 'max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom))'

  return (
    <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
      <Header
        title="SmartSpare"
        subtitle={
          isHouseholdAggregate
            ? 'Oversikt over planer — åpne en plan for detaljer og redigering'
            : `Planer for ${activeProfileName} — bytt profil i menyen for andre medlemmers planer`
        }
      />
      <SparingSubnav />
      <div
        className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl xl:max-w-[90rem] mx-auto w-full min-w-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        {createPlanModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center touch-manipulation"
            style={{ padding: safePad }}
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Lukk"
              {...createPlanBackdropDismiss}
            />
            <div
              className="relative flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden touch-manipulation"
              role="dialog"
              aria-modal="true"
              aria-labelledby="smartspare-create-title"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                marginTop: 'max(0.5rem, env(safe-area-inset-top))',
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h2
                    id="smartspare-create-title"
                    className="text-lg font-semibold pr-1 min-w-0 break-words"
                    style={{ color: 'var(--text)' }}
                  >
                    Opprett plan
                  </h2>
                  <div className="relative flex shrink-0 items-center" ref={createPlanHelpRef}>
                    <button
                      type="button"
                      onClick={() => setCreatePlanHelpOpen((o) => !o)}
                      aria-expanded={createPlanHelpOpen}
                      aria-label="Forklaring av feltene"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <CircleHelp size={20} strokeWidth={2} aria-hidden />
                    </button>
                    {createPlanHelpOpen && (
                      <div
                        className="absolute left-0 top-full z-[110] mt-1.5 w-[min(calc(100vw-2rem),20rem)] max-w-[calc(100vw-2rem)] rounded-xl p-3 shadow-lg"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        role="region"
                      >
                        <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Start og slutt</strong> avgrenser hvilke måneder som
                            inngår i planen.
                          </li>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Navn</strong> er valgfritt — vises på kort og i
                            overskrift (ellers brukes periodelinje).
                          </li>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Målgrunnlag</strong> sier om målet er før eller etter
                            skatt; «Tjent» på plansiden følger dette.
                          </li>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Skatt i tabellen</strong> trekker valgfritt skatt av
                            bruttoinntekt per kilde i oppsummering og grafer.
                          </li>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Målbeløp</strong> er sparemålet i samme målgrunnlag.
                          </li>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Kilder og innbetalt</strong> legges inn etterpå under
                            «Brutto per måned» og via kildenavn på plansiden.
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatePlanModalOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl shrink-0 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Lukk"
                >
                  <X size={22} strokeWidth={2} />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 space-y-4 flex-1 min-h-0">
                <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                  Planen knyttes til profilen <strong style={{ color: 'var(--text)' }}>{activeProfileName}</strong> (den du
                  har valgt under «Viser data for»). Fyll inn det viktigste først. Innbetalt beløp og kilder kan du legge
                  inn etterpå under «Brutto per måned» og «Innstillinger» på plansiden.
                </p>
                {modalError && (
                  <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--primary-pale)', color: 'var(--text)' }}>
                    {modalError}
                  </p>
                )}
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Navn på plan (valgfritt)
                  <input
                    type="text"
                    value={modalPlanName}
                    onChange={(e) => setModalPlanName(e.target.value)}
                    placeholder="f.eks. Egenkapital bolig"
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                    Startdato
                    <input
                      ref={createModalFirstFieldRef}
                      type="date"
                      value={modalStart}
                      onChange={(e) => setModalStart(e.target.value)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                    Sluttdato
                    <input
                      type="date"
                      value={modalEnd}
                      onChange={(e) => setModalEnd(e.target.value)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </label>
                </div>
                <fieldset className="space-y-4 border-0 p-0 m-0">
                  <legend className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Målgrunnlag
                  </legend>
                  <label className="flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name="smartspare-modal-goal"
                      checked={modalGoalBasis === 'afterTax'}
                      onChange={() => setModalGoalBasis('afterTax')}
                      className="shrink-0"
                    />
                    <span className="text-sm leading-snug" style={{ color: 'var(--text)' }}>
                      Mål etter skatt
                    </span>
                  </label>
                  <label className="flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name="smartspare-modal-goal"
                      checked={modalGoalBasis === 'beforeTax'}
                      onChange={() => setModalGoalBasis('beforeTax')}
                      className="shrink-0"
                    />
                    <span className="text-sm leading-snug" style={{ color: 'var(--text)' }}>
                      Mål før skatt
                    </span>
                  </label>
                </fieldset>
                <div className="space-y-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Skatt på inntekt i tabellen
                  </p>
                  <label className="inline-flex items-center gap-3 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalApplyTax}
                      onChange={(e) => setModalApplyTax(e.target.checked)}
                      className="shrink-0 w-5 h-5"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Trekk skatt av inntekten i tabellen (brutto → netto i oppsummering)
                    </span>
                  </label>
                  {modalApplyTax && (
                    <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                      <span className="shrink-0">Skatteprosent (0–100)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={modalTaxPercentStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 3)
                          setModalTaxPercentStr(raw)
                          setModalTaxPercent(parseTaxPercentFieldInput(raw))
                        }}
                        onBlur={() => {
                          const c = parseTaxPercentFieldInput(modalTaxPercentStr)
                          setModalTaxPercent(c)
                          setModalTaxPercentStr(c === 0 ? '' : String(c))
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl w-full sm:w-28 text-base sm:text-sm tabular-nums"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </label>
                  )}
                </div>
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Målbeløp (kr)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={modalTargetStr}
                    onChange={(e) => setModalTargetStr(formatThousands(e.target.value))}
                    placeholder="f.eks. 150 000"
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
              </div>
              <div
                className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 sm:px-5 shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setCreatePlanModalOpen(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
                  style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlanSubmit}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Opprett
                </button>
              </div>
            </div>
          </div>
        )}

        {readOnly && (
          <div
            className="rounded-2xl p-4 flex gap-3 items-start"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
          >
            <AlertTriangle className="shrink-0 mt-0.5" size={20} style={{ color: 'var(--primary)' }} />
            <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text)' }}>
              Du viser <strong>husholdning</strong>. Her ser du alle medlemmers planer. For å opprette eller redigere en
              plan: bytt til <strong>én profil</strong> (ikke husholdning), eller trykk på et <strong>plan-kort</strong>{' '}
              (da byttes du til riktig profil og planside).
            </p>
          </div>
        )}

        {allDashboardRows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start min-w-0">
            <div
              className="rounded-2xl p-4 sm:p-5 space-y-4 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="min-w-0 space-y-3">
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                  Samlet oversikt
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {isHouseholdAggregate
                    ? 'Sum av alle planer i husholdningen (per plan brukes valgt målgrunnlag).'
                    : `Sum av planene til ${activeProfileName} (per plan brukes valgt målgrunnlag).`}{' '}
                  <strong style={{ color: 'var(--text)' }}>Periode:</strong> {periodSubtitle(periodMode, filterYear, monthIndex)}.{' '}
                  {periodMode === 'ytd'
                    ? 'KPI («tjent» og månedlig innbetalt) klippes til i dag og hver plan.'
                    : 'KPI summerer hele valgt periode i brutto-tabellen (også fremtidige måneder i vinduet).'}
                </p>
                {overviewYearOptions.length > 0 && (
                  <DashboardPeriodToolbar
                    variant="inline"
                    filterYear={filterYear}
                    onFilterYearChange={setFilterYear}
                    periodMode={periodMode}
                    onPeriodModeChange={setPeriodMode}
                    monthIndex={monthIndex}
                    onMonthIndexChange={setMonthIndex}
                    yearOptions={overviewYearOptions}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 min-w-0 md:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label="Mål"
                  value={formatNOK(aggregateKpi.target)}
                  sub="Summert målbeløp på tvers av planene."
                  icon={Target}
                  color="#3B5BDB"
                  valueNoWrap
                  info="Hver plan har eget mål i valgt målgrunnlag (før eller etter skatt). Her er summen av disse målene."
                />
                <StatCard
                  label="Tjent hittil"
                  value={formatNOK(aggregateKpi.earnedToward)}
                  sub="Summert «tjent hittil» per plan innenfor valgt periode."
                  icon={TrendingUp}
                  color="#0CA678"
                  valueNoWrap
                  info="Beløpet er summen av hver plans «tjent hittil» i målgrunnlaget for den planen. Planer med ulikt målgrunnlag kan derfor ikke sammenlignes som én homogen total, men summen gir et samlet bilde."
                />
                <StatCard
                  label="Innbetalt hittil"
                  value={formatNOK(aggregateKpi.paid)}
                  sub="Summert innbetalt (månedlig + engangs) per plan, valgt periode."
                  icon={PiggyBank}
                  color="#7048E8"
                  valueNoWrap
                />
                <StatCard
                  label="Ventende"
                  value={formatNOK(aggregateKpi.pending)}
                  sub="Summert ventende (tjent minus innbetalt) per plan."
                  icon={Clock}
                  color="#AE3EC9"
                  valueNoWrap
                />
                <StatCard
                  label="Resterende"
                  value={formatNOK(aggregateKpi.remaining)}
                  sub="Summert rest (mål minus innbetalt) per plan."
                  icon={Wallet}
                  color="#F08C00"
                  valueNoWrap
                />
              </div>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-4 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                    {isHouseholdAggregate ? 'Planer i husholdningen' : 'Dine planer'}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {isHouseholdAggregate
                      ? 'Trykk på en plan for å se diagrammer, tabell og innstillinger.'
                      : `Kun planer som tilhører ${activeProfileName}. Trykk på en plan for detaljer.`}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setCreatePlanModalOpen(true)}
                    className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm touch-manipulation shrink-0"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    Opprett plan
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              {allDashboardRows.map(({ profileId, profileName, plan: p, derived: d }) => {
                const planName = p.name?.trim() ?? ''
                const periodNb = formatIncomeSprintPlanPeriodNb(p)
                const headline = planName || periodNb
                const basis = p.goalBasis === 'beforeTax' ? 'Mål før skatt' : 'Mål etter skatt'
                const refToday = new Date().toISOString().slice(0, 10)
                const ended = p.endDate < refToday
                const statusLine = !d
                  ? 'Ugyldig periode'
                  : ended && d.daysLeft === 0
                    ? 'Avsluttet'
                    : `${d.daysLeft} dager igjen`
                const progress = d && d.targetAmount > 0 ? `${Math.round(d.progressPercent)} %` : '—'
                const isOwner = profileId === activeProfileId
                const showOwnerBadge = isHouseholdAggregate || profiles.length >= 2
                const openLabel =
                  isHouseholdAggregate && !isOwner
                    ? `Åpne planen «${headline}». Bytter til ${profileName} og åpner detaljer.`
                    : `Åpne planen «${headline}»`
                return (
                  <button
                    key={`${profileId}-${p.id}`}
                    type="button"
                    onClick={() => goToPlan(p.id, profileId)}
                    aria-label={openLabel}
                    className="rounded-xl p-4 min-w-0 w-full flex flex-col gap-2 text-left touch-manipulation transition-[box-shadow,border-color,transform] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="min-w-0 space-y-1.5">
                      <p className="font-semibold text-base break-words leading-snug" style={{ color: 'var(--text)' }}>
                        {headline}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs leading-snug">
                        {planName ? (
                          <span className="break-words" style={{ color: 'var(--text-muted)' }}>
                            {periodNb}
                          </span>
                        ) : null}
                        <span className="break-words" style={{ color: 'var(--text-muted)' }}>
                          {planName ? `· ${basis}` : basis}
                        </span>
                        {showOwnerBadge && (
                          <span
                            className="inline-flex max-w-full items-center px-2 py-0.5 rounded-lg break-words font-medium"
                            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                          >
                            {profileName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm min-w-0">
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Mål
                        </p>
                        <p className="font-semibold tabular-nums truncate" style={{ color: 'var(--text)' }}>
                          {formatNOK(p.targetAmount)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Fremdrift
                        </p>
                        <p className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {progress}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {statusLine}
                    </p>
                    <div className="mt-auto flex flex-col gap-2 min-w-0">
                      {isHouseholdAggregate && !isOwner && (
                        <p className="text-xs leading-snug text-left" style={{ color: 'var(--text-muted)' }}>
                          Åpne bytter til {profileName} og åpner plansiden (enkeltprofilvisning).
                        </p>
                      )}
                      <span
                        className="min-h-[44px] inline-flex items-center justify-start gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium w-full sm:w-auto self-stretch sm:self-start pointer-events-none"
                        style={{ background: 'var(--primary)', color: '#fff' }}
                        aria-hidden
                      >
                        Åpne
                        <ChevronRight size={18} className="shrink-0" aria-hidden />
                      </span>
                    </div>
                  </button>
                )
              })}
              </div>
            </div>
          </div>
        )}

        {allDashboardRows.length === 0 && !readOnly && (
          <div
            className="rounded-2xl p-6 space-y-4 text-center sm:text-left"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              Kom i gang
            </h2>
            <p className="text-sm max-w-xl mx-auto sm:mx-0" style={{ color: 'var(--text-muted)' }}>
              Planen lagres på <strong style={{ color: 'var(--text)' }}>{activeProfileName}</strong>. Sett start- og
              sluttdato, mål (før eller etter skatt), og legg inn forventet bruttoinntekt per kilde og måned etter at
              planen er opprettet. Du får oppsummering, KPI og grafer på plansiden.
            </p>
            <button
              type="button"
              onClick={() => setCreatePlanModalOpen(true)}
              className="min-h-[44px] w-full max-w-sm mx-auto sm:mx-0 sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm touch-manipulation"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Opprett plan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
