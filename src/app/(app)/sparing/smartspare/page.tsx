'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'
import { useActivePersonFinance, useStore } from '@/lib/store'
import {
  computeIncomeSprintDerived,
  defaultNewIncomeSprintPlan,
  defaultNewIncomeSprintPlanWithOneSource,
  formatIncomeSprintPlanPeriodNb,
  listMonthKeysInRange,
  reconcileIncomeSprintPlan,
  type IncomeSprintGoalBasis,
} from '@/lib/incomeSprint'
import { formatNOK, formatThousands, generateId, parseThousands } from '@/lib/utils'
import { AlertTriangle, ChevronRight, PiggyBank, Target, TrendingUp, Wallet, X } from 'lucide-react'

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

  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false)
  const [modalStart, setModalStart] = useState('')
  const [modalEnd, setModalEnd] = useState('')
  const [modalGoalBasis, setModalGoalBasis] = useState<IncomeSprintGoalBasis>('afterTax')
  const [modalTargetStr, setModalTargetStr] = useState('')
  const [modalApplyTax, setModalApplyTax] = useState(false)
  const [modalTaxPercent, setModalTaxPercent] = useState(40)
  const [modalError, setModalError] = useState<string | null>(null)
  const createModalFirstFieldRef = useRef<HTMLInputElement>(null)

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
    setModalError(null)
  }, [createPlanModalOpen])

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
    const newPlan = reconcileIncomeSprintPlan({
      ...base,
      startDate: modalStart,
      endDate: modalEnd,
      goalBasis: modalGoalBasis,
      targetAmount: parseThousands(modalTargetStr),
      applyTax: modalApplyTax,
      taxPercent: modalTaxPercent,
    })
    upsertIncomeSprintPlan(newPlan)
    setCreatePlanModalOpen(false)
    router.push(`/sparing/smartspare/${newPlan.id}`)
  }

  const allDashboardRows = useMemo(() => {
    const rows = profiles.flatMap((p) =>
      (people[p.id]?.incomeSprintPlans ?? []).map((plan) => ({
        profileId: p.id,
        profileName: p.name,
        plan,
        derived: computeIncomeSprintDerived(plan),
      })),
    )
    rows.sort((a, b) => b.plan.endDate.localeCompare(a.plan.endDate))
    return rows
  }, [people, profiles])

  const aggregateKpi = useMemo(() => {
    let target = 0
    let earnedToward = 0
    let paid = 0
    let remaining = 0
    for (const row of allDashboardRows) {
      const d = row.derived
      if (!d) continue
      target += d.targetAmount
      earnedToward += d.earnedInGoalBasis
      paid += d.paidTowardGoal
      remaining += d.remaining
    }
    return { target, earnedToward, paid, remaining }
  }, [allDashboardRows])

  const safePad = 'max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom))'

  return (
    <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
      <Header title="smartSpare" subtitle="Oversikt over planer — åpne en plan for detaljer og redigering" />
      <SparingSubnav />
      <div
        className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full min-w-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
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
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setCreatePlanModalOpen(false)
              }}
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
              <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
                <h2 id="smartspare-create-title" className="text-lg font-semibold pr-2" style={{ color: 'var(--text)' }}>
                  Opprett plan
                </h2>
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
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Fyll inn det viktigste først. Innbetalt beløp og kilder kan du legge inn etterpå under «Brutto per måned»
                  og «Innstillinger» på plansiden.
                </p>
                {modalError && (
                  <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--primary-pale)', color: 'var(--text)' }}>
                    {modalError}
                  </p>
                )}
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
                <fieldset className="space-y-2 border-0 p-0 m-0">
                  <legend className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Målgrunnlag
                  </legend>
                  <label className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name="smartspare-modal-goal"
                      checked={modalGoalBasis === 'afterTax'}
                      onChange={() => setModalGoalBasis('afterTax')}
                      className="shrink-0"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Mål etter skatt
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name="smartspare-modal-goal"
                      checked={modalGoalBasis === 'beforeTax'}
                      onChange={() => setModalGoalBasis('beforeTax')}
                      className="shrink-0"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
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
                      <span className="shrink-0">Skatteprosent</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={modalTaxPercent}
                        onChange={(e) => setModalTaxPercent(Number(e.target.value) || 0)}
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
              plan: bytt til <strong>én profil</strong> (ikke husholdning), eller trykk <strong>Åpne</strong> på et kort
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
              <div className="min-w-0">
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                  Samlet oversikt
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isHouseholdAggregate
                    ? 'Sum av alle planer i husholdningen (per plan brukes valgt målgrunnlag).'
                    : 'Sum av alle dine planer (per plan brukes valgt målgrunnlag).'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <StatCard
                  label="Mål"
                  value={formatNOK(aggregateKpi.target)}
                  sub="Summert målbeløp på tvers av planene."
                  icon={Target}
                  color="#3B5BDB"
                  info="Hver plan har eget mål i valgt målgrunnlag (før eller etter skatt). Her er summen av disse målene."
                />
                <StatCard
                  label="Tjent hittil"
                  value={formatNOK(aggregateKpi.earnedToward)}
                  sub="Summert «tjent hittil» per plan (brutto eller netto etter innstilling på hver plan)."
                  icon={TrendingUp}
                  color="#0CA678"
                  info="Beløpet er summen av hver plans «tjent hittil» i målgrunnlaget for den planen. Planer med ulikt målgrunnlag kan derfor ikke sammenlignes som én homogen total, men summen gir et samlet bilde."
                />
                <StatCard
                  label="Innbetalt mot mål"
                  value={formatNOK(aggregateKpi.paid)}
                  sub="Summert manuelt innbetalt beløp på tvers av planene."
                  icon={PiggyBank}
                  color="#7048E8"
                />
                <StatCard
                  label="Resterende"
                  value={formatNOK(aggregateKpi.remaining)}
                  sub="Summert rest per plan (mål minus innbetaling og tjent hittil)."
                  icon={Wallet}
                  color="#F08C00"
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
                    Trykk på en plan for å se diagrammer, tabell og innstillinger.
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
                const title = p.name?.trim() || formatIncomeSprintPlanPeriodNb(p)
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
                return (
                  <div
                    key={`${profileId}-${p.id}`}
                    className="rounded-xl p-4 min-w-0 flex flex-col gap-2"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium break-words" style={{ color: 'var(--text)' }}>
                        {title}
                      </p>
                      {isHouseholdAggregate && (
                        <span
                          className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-lg max-w-full truncate"
                          style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                          title={profileName}
                        >
                          {profileName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs break-words" style={{ color: 'var(--text-muted)' }}>
                      {basis} · {formatIncomeSprintPlanPeriodNb(p)}
                    </p>
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
                    <button
                      type="button"
                      onClick={() => goToPlan(p.id, profileId)}
                      className="mt-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium touch-manipulation w-full sm:w-auto self-stretch sm:self-start"
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      Åpne
                      <ChevronRight size={18} className="shrink-0" aria-hidden />
                    </button>
                    {isHouseholdAggregate && !isOwner && (
                      <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                        Åpne bytter til {profileName} og åpner plansiden (enkeltprofilvisning).
                      </p>
                    )}
                  </div>
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
            <p className="text-sm max-w-xl" style={{ color: 'var(--text-muted)' }}>
              Sett start- og sluttdato, mål (før eller etter skatt), og legg inn forventet bruttoinntekt per kilde og
              måned etter at planen er opprettet. Du får oppsummering, KPI og grafer på plansiden.
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
