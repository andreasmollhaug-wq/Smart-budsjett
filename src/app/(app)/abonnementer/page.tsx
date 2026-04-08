'use client'

import { useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import SubscriptionModuleInfoModal from '@/components/subscriptions/SubscriptionModuleInfoModal'
import {
  findDuplicatePresetServiceGroups,
  monthlyEquivalentNok,
  yearlyEquivalentNok,
} from '@/lib/serviceSubscriptionHelpers'
import { SERVICE_SUBSCRIPTION_PRESETS } from '@/lib/serviceSubscriptionPresets'
import { useActivePersonFinance, type ServiceSubscription } from '@/lib/store'
import { formatNOK } from '@/lib/utils'
import { Info, Pencil, Plus, Trash2 } from 'lucide-react'

export default function AbonnementerPage() {
  const {
    serviceSubscriptions,
    isHouseholdAggregate,
    addServiceSubscription,
    updateServiceSubscription,
    removeServiceSubscription,
    profiles,
  } = useActivePersonFinance()

  const [infoOpen, setInfoOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [newBilling, setNewBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [newSync, setNewSync] = useState(true)
  const [presetKey, setPresetKey] = useState('')

  const totals = useMemo(() => {
    let m = 0
    let y = 0
    let activeCount = 0
    for (const s of serviceSubscriptions) {
      if (!s.active) continue
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
    const res = addServiceSubscription({
      label,
      amountNok: Math.max(0, newAmount),
      billing: newBilling,
      active: true,
      syncToBudget: newSync,
      presetKey: presetKey || undefined,
    })
    if (res.ok) {
      setNewLabel('')
      setNewAmount(0)
      setNewBilling('monthly')
      setNewSync(true)
      setPresetKey('')
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
      <SubscriptionModuleInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />

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

        {readonly && duplicatePresetGroups.length > 0 && (
          <div
            className="rounded-xl border px-4 py-3 text-sm space-y-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--primary-pale)',
              color: 'var(--text-muted)',
            }}
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
              Mulig å samle abonnement
            </p>
            <ul className="list-none space-y-2 m-0 p-0">
              {duplicatePresetGroups.map((g) => (
                <li key={g.presetKey}>
                  <DuplicateServiceHintSentence
                    serviceLabel={g.serviceLabel}
                    profileNames={g.profileIds.map((id) => profileName(id))}
                  />
                </li>
              ))}
            </ul>
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
          </div>
          {serviceSubscriptions.length === 0 ? (
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
              {serviceSubscriptions.map((s) => (
                <li
                  key={s.id}
                  className="border-t px-4 py-4 first:border-t-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {editingId === s.id && !readonly ? (
                    <EditRow
                      initial={s}
                      onSave={(patch) => {
                        updateServiceSubscription(s.id, patch)
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
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
                          {formatNOK(s.amountNok)} / {s.billing === 'monthly' ? 'mnd' : 'år'} · ca.{' '}
                          {formatNOK(monthlyEquivalentNok(s))} / mnd
                        </p>
                        {s.syncToBudget && s.active && (
                          <p className="mt-1 text-xs" style={{ color: 'var(--primary)' }}>
                            Synket til budsjett (Regninger)
                          </p>
                        )}
                      </div>
                      {!readonly && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={`Rediger ${subLabelForAria(s.label)}`}
                            onClick={() => setEditingId(s.id)}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2"
                            style={{ color: 'var(--danger)' }}
                            aria-label={`Slett ${subLabelForAria(s.label)}`}
                            onClick={() => {
                              if (window.confirm(`Fjerne «${s.label}» fra listen?`)) removeServiceSubscription(s.id)
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
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
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billing"
                      checked={newBilling === 'monthly'}
                      onChange={() => setNewBilling('monthly')}
                    />
                    Månedlig
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
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
              <label className="flex items-center gap-2 text-sm sm:col-span-2 cursor-pointer">
                <input type="checkbox" checked={newSync} onChange={(e) => setNewSync(e.target.checked)} />
                <span style={{ color: 'var(--text)' }}>Legg inn i budsjettet under Regninger</span>
              </label>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
              disabled={newAmount <= 0}
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

function subLabelForAria(label: string): string {
  const t = label.trim()
  return t || 'abonnement'
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
  onSave,
  onCancel,
}: {
  initial: ServiceSubscription
  onSave: (patch: Partial<ServiceSubscription>) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initial.label)
  const [amount, setAmount] = useState(initial.amountNok)
  const [billing, setBilling] = useState(initial.billing)
  const [active, setActive] = useState(initial.active)
  const [sync, setSync] = useState(initial.syncToBudget)

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
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="edb"
              checked={billing === 'monthly'}
              onChange={() => setBilling('monthly')}
            />
            Månedlig
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="radio" name="edb" checked={billing === 'yearly'} onChange={() => setBilling('yearly')} />
            Årlig
          </label>
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Aktiv
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} />
        Synk til budsjett (Regninger)
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}
          onClick={() =>
            onSave({
              label,
              amountNok: amount,
              billing,
              active,
              syncToBudget: sync,
            })
          }
        >
          Lagre
        </button>
        <button
          type="button"
          className="rounded-xl px-4 py-2 text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          onClick={onCancel}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
