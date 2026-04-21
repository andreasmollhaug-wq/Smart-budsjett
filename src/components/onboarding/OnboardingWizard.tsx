'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore, ONBOARDING_MAIN_INCOME_CATEGORY_ID } from '@/lib/store'
import { normalizeIncomeWithholdingRule } from '@/lib/incomeWithholding'
import { formatThousands, parseThousands } from '@/lib/utils'

const TOTAL_STEPS = 6
const MAX_MONTHLY_INCOME = 10_000_000

export default function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const profileName = useStore((s) => s.profiles.find((p) => p.id === s.activeProfileId)?.name ?? '')
  const budgetYear = useStore((s) => s.budgetYear)
  const archivedBudgetsByYear = useStore((s) => s.archivedBudgetsByYear)
  const renameProfile = useStore((s) => s.renameProfile)
  const setBudgetYear = useStore((s) => s.setBudgetYear)
  const updateBudgetCategory = useStore((s) => s.updateBudgetCategory)
  const recalcBudgetSpent = useStore((s) => s.recalcBudgetSpent)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const skipOnboarding = useStore((s) => s.skipOnboarding)
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const setDemoDataEnabled = useStore((s) => s.setDemoDataEnabled)
  const setDefaultIncomeWithholding = useStore((s) => s.setDefaultIncomeWithholding)

  const [nameInput, setNameInput] = useState(profileName)
  const [yearInput, setYearInput] = useState(budgetYear)
  const [incomeInput, setIncomeInput] = useState('')
  const [incomeWithholdApply, setIncomeWithholdApply] = useState(false)
  const [incomeWithholdPercent, setIncomeWithholdPercent] = useState('32')

  const archiveEmpty = Object.keys(archivedBudgetsByYear).length === 0
  const cy = new Date().getFullYear()
  const yearOptions = [cy - 2, cy - 1, cy, cy + 1, cy + 2]

  useEffect(() => {
    setStep(0)
    const st = useStore.getState()
    setNameInput(st.profiles.find((p) => p.id === st.activeProfileId)?.name ?? '')
    setYearInput(st.budgetYear)
    const person = st.people[st.activeProfileId]
    const cat = person?.budgetCategories.find((c) => c.id === ONBOARDING_MAIN_INCOME_CATEGORY_ID)
    const m = cat?.budgeted[0] ?? 0
    setIncomeInput(m > 0 ? formatThousands(String(m)) : '')
    const lineRule = normalizeIncomeWithholdingRule(cat?.incomeWithholding)
    const defRule = normalizeIncomeWithholdingRule(person?.defaultIncomeWithholding)
    if (lineRule.apply) {
      setIncomeWithholdApply(true)
      setIncomeWithholdPercent(String(lineRule.percent > 0 ? lineRule.percent : 32))
    } else if (defRule.apply) {
      setIncomeWithholdApply(true)
      setIncomeWithholdPercent(String(defRule.percent > 0 ? defRule.percent : 32))
    } else {
      setIncomeWithholdApply(false)
      setIncomeWithholdPercent('32')
    }
  }, [])

  useEffect(() => {
    setNameInput(profileName)
  }, [profileName])

  useEffect(() => {
    setYearInput(budgetYear)
  }, [budgetYear])

  const goNext = () => {
    if (step === 1) {
      const n = nameInput.trim()
      if (!n) return
      renameProfile(activeProfileId, n)
    }
    if (step === 2 && archiveEmpty) {
      setBudgetYear(yearInput)
    }
    if (step === 3) {
      const raw = parseThousands(incomeInput)
      if (raw <= 0 || raw > MAX_MONTHLY_INCOME) return
      const budgeted = Array(12).fill(raw)
      const wh = normalizeIncomeWithholdingRule({
        apply: incomeWithholdApply,
        percent: Number(String(incomeWithholdPercent).replace(',', '.')) || 0,
      })
      setDefaultIncomeWithholding(wh)
      updateBudgetCategory(ONBOARDING_MAIN_INCOME_CATEGORY_ID, {
        budgeted,
        incomeWithholding: wh.apply ? { apply: true, percent: wh.percent } : undefined,
      })
      recalcBudgetSpent('Lønn')
    }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1)
  }

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const canProceed = (): boolean => {
    if (step === 1) return nameInput.trim().length > 0
    if (step === 2) return archiveEmpty ? yearOptions.includes(yearInput) : true
    if (step === 3) {
      const raw = parseThousands(incomeInput)
      return raw > 0 && raw <= MAX_MONTHLY_INCOME
    }
    return true
  }

  const handleFinish = () => {
    completeOnboarding()
  }

  const handleSkip = () => {
    skipOnboarding()
  }

  const stepLabel = `Steg ${step + 1} av ${TOTAL_STEPS}`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          {stepLabel}
        </p>
        <div className="flex gap-1 mb-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: i <= step ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 id="onboarding-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Velkommen til Smart Budsjett
            </h2>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Her får du oversikt over inntekter og utgifter, budsjett per måned, transaksjoner og sparing — på ett
              sted. Vi setter opp noen få ting sammen, så du kan komme i gang.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 id="onboarding-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Navn på profilen
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Dette vises i appen (f.eks. ved flere profiler i familieabonnement).
            </p>
            <label className="block mt-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
              Visningsnavn
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                autoComplete="name"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 id="onboarding-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Budsjettår
            </h2>
            {archiveEmpty ? (
              <>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  Hvilket år vil du planlegge for?
                </p>
                <label className="block mt-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
                  År
                  <select
                    value={yearInput}
                    onChange={(e) => setYearInput(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Du har arkiverte budsjettår. Aktivt år er <strong>{budgetYear}</strong>. Du kan bytte år fra
                budsjettsiden når du trenger det.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 id="onboarding-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Hovedinntekt per måned
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Beløpet legges inn på linjen «Lønn». Som standard er dette beløpet det som brukes i summeringer (f.eks.
              utbetalt lønn). Du kan også legge inn <strong>brutto</strong> og la appen trekke en forenklet prosent —
              dette er ikke offisiell skatt, bare et praktisk verktøy i appen.
            </p>
            <label className="block mt-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
              Beløp (kr)
              <input
                type="text"
                inputMode="numeric"
                value={incomeInput}
                onChange={(e) => setIncomeInput(formatThousands(e.target.value))}
                placeholder="f.eks. 45 000"
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px]"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </label>
            <label className="flex items-start gap-3 mt-4 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={incomeWithholdApply}
                onChange={(e) => setIncomeWithholdApply(e.target.checked)}
                className="mt-1 h-4 w-4 rounded shrink-0"
              />
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                Jeg legger inn <strong>brutto</strong> og vil bruke <strong>forenklet trekk</strong> i appen
              </span>
            </label>
            {incomeWithholdApply && (
              <label className="block mt-3 text-sm font-medium" style={{ color: 'var(--text)' }}>
                Trekk (prosent)
                <input
                  type="text"
                  inputMode="decimal"
                  value={incomeWithholdPercent}
                  onChange={(e) => setIncomeWithholdPercent(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="f.eks. 32"
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm min-h-[44px]"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </label>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 id="onboarding-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Demodata (valgfritt)
            </h2>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Vil du se hvordan alt henger sammen før du legger inn mer selv? Slå på ferdige eksempeltall for budsjett,
              transaksjoner, sparemål, investeringer og lån. Dine egne data lagres trygt mens demodata er på, og
              gjenopprettes når du slår det av igjen.
            </p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              I familiehusholdning med flere profiler får hvert medlem et eget eksempelsett (ulike tall per person;
              første profil følger standarddemoen).
            </p>
            <div
              className="mt-5 rounded-xl px-4 py-4"
              style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm mb-3 leading-snug" style={{ color: 'var(--text-muted)' }}>
                Du kan slå på demodata direkte her — uten å gå til innstillinger først.
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={demoDataEnabled}
                onClick={() => setDemoDataEnabled(!demoDataEnabled)}
                className="inline-flex items-center gap-3 text-left w-full min-h-[44px]"
              >
                <span
                  className="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors"
                  style={{ background: demoDataEnabled ? 'var(--primary)' : 'var(--border)' }}
                >
                  <span
                    className="inline-block h-5 w-5 rounded-full bg-white shadow mt-1 transition-transform"
                    style={{ transform: demoDataEnabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                  />
                </span>
                <span className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>
                  {demoDataEnabled ? 'Demodata er på — utforsk appen med eksempeldata' : 'Slå på demodata for full oversikt'}
                </span>
              </button>
            </div>
            {demoDataEnabled && (
              <p className="text-xs mt-3 rounded-lg px-3 py-2" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                Du ser nå eksempeldata. Slå av bryteren over, eller under Min konto → Innstillinger, for å gå tilbake til
                dine egne tall.
              </p>
            )}
            <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Samme bryter finnes senere under{' '}
              <Link href="/konto/innstillinger#demodata" className="underline font-medium" style={{ color: 'var(--primary)' }}>
                Min konto → Innstillinger
              </Link>
              .
            </p>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 id="onboarding-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Du er klar
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Utforsk <Link href="/dashboard" className="underline font-medium" style={{ color: 'var(--primary)' }}>oversikten</Link>
              , legg inn <Link href="/transaksjoner" className="underline font-medium" style={{ color: 'var(--primary)' }}>transaksjoner</Link>, eller gå rett til{' '}
              <Link href="/budsjett" className="underline font-medium" style={{ color: 'var(--primary)' }}>budsjettet</Link>.
            </p>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Vil du sikre at budsjettet blir «komplett nok» fra start? På{' '}
              <Link href="/konto/innstillinger" className="underline font-medium" style={{ color: 'var(--primary)' }}>
                Min konto → Innstillinger
              </Link>{' '}
              finner du en sjekkliste som haker av automatisk og sier hva som mangler (f.eks. flere utgiftsposter). Du kan
              også markere «ferdig» hvis det holder for deg.
            </p>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Vil du ha en lengre gjennomgang med anbefalt rekkefølge og tips?{' '}
              <Link
                href="/konto/kom-i-gang"
                className="underline font-medium"
                style={{ color: 'var(--primary)' }}
                onClick={() => completeOnboarding()}
              >
                Les utvidet guide
              </Link>
              .
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-between gap-3 mt-8 pb-[max(0px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            onClick={handleSkip}
          >
            Hopp over
          </button>
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                disabled={!canProceed()}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 w-full sm:w-auto touch-manipulation"
                style={{ background: 'var(--primary)' }}
                onClick={goNext}
              >
                Neste
              </button>
            ) : (
              <button
                type="button"
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-white w-full sm:w-auto touch-manipulation"
                style={{ background: 'var(--primary)' }}
                onClick={handleFinish}
              >
                Ferdig
              </button>
            )}
            {step > 0 && (
              <button
                type="button"
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                onClick={goBack}
              >
                Tilbake
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
