'use client'

import Link from 'next/link'
import { User, Bell, Sparkles, FlaskConical } from 'lucide-react'
import { useStore, type BudgetCategory } from '@/lib/store'
import { normalizeIncomeWithholdingRule } from '@/lib/incomeWithholding'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BudgetSetupChecklistCard from '@/components/konto/BudgetSetupChecklistCard'

/** Stabile tomme referanser — `?? []` / `?? {}` i Zustand-selectorer gir ny referanse hver gang og utløser React 18 getSnapshot-loop. */
const EMPTY_BUDGET_CATEGORIES: BudgetCategory[] = []

function editableNameFromMetadata(meta: Record<string, unknown> | undefined): string {
  const fromFull = meta?.full_name
  const fromName = meta?.name
  if (typeof fromFull === 'string' && fromFull.trim()) return fromFull.trim()
  if (typeof fromName === 'string' && fromName.trim()) return fromName.trim()
  return ''
}

function ProfileSettingsForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loadingUser, setLoadingUser] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled || !user) {
        if (!cancelled) setLoadingUser(false)
        return
      }
      const meta = user.user_metadata as Record<string, unknown> | undefined
      setName(editableNameFromMetadata(meta))
      setEmail(user.email ?? '')
      setLoadingUser(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setMessage('E-post kan ikke være tom.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setMessage('Ugyldig e-postadresse.')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setMessage('Fant ikke innlogget bruker.')
        return
      }
      const emailChanged = trimmedEmail !== (user.email ?? '')
      const { error } = await supabase.auth.updateUser({
        ...(emailChanged ? { email: trimmedEmail } : {}),
        data: { full_name: trimmedName },
      })
      if (error) {
        setMessage(error.message)
        return
      }
      setMessage('Profilen er oppdatert.')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (loadingUser) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Laster profil…
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-name" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Navn
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
            E-post
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            autoComplete="email"
            required
          />
        </div>
      </div>
      {message && (
        <p className="text-sm" style={{ color: message.startsWith('Profilen') ? 'var(--primary)' : '#c92a2a' }}>
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--primary)' }}
      >
        {saving ? 'Lagrer…' : 'Lagre endringer'}
      </button>
    </form>
  )
}

function DemoDataCard() {
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const setDemoDataEnabled = useStore((s) => s.setDemoDataEnabled)

  return (
    <div
      id="demodata"
      className="rounded-2xl p-6 scroll-mt-24"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <FlaskConical size={16} style={{ color: 'var(--primary)' }} />
        Demodata
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Vis eksempeldata for budsjett, transaksjoner, sparemål, investeringer og lån (boliglån utenfor snøball,
        studielån og kredittkort i snøball) slik at du kan utforske appen uten å fylle inn egne tall. Dine egne data
        lagres trygt mens demodata er på, og gjenopprettes når du slår det av. I familiehusholdning med flere profiler
        er eksempeltallene forskjellige per medlem (første profil tilsvarer standarddemoen).
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={demoDataEnabled}
          onClick={() => setDemoDataEnabled(!demoDataEnabled)}
          className="inline-flex items-center gap-3 text-left min-h-[44px]"
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
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {demoDataEnabled ? 'Demodata er på' : 'Demodata er av'}
          </span>
        </button>
      </div>
      {demoDataEnabled && (
        <p className="text-xs mt-3 rounded-lg px-3 py-2" style={{ background: 'var(--primary-pale)', color: 'var(--text-muted)' }}>
          Du ser nå eksempeldata. Slå av for å gå tilbake til dine egne tall.
        </p>
      )}
    </div>
  )
}

function IncomeWithholdingDefaultsCard() {
  const activeProfileId = useStore((s) => s.activeProfileId)
  const profileName = useStore((s) => s.profiles.find((p) => p.id === s.activeProfileId)?.name?.trim() ?? 'Profil')
  const rule = useStore((s) => s.people[s.activeProfileId]?.defaultIncomeWithholding)
  const setDefaultIncomeWithholding = useStore((s) => s.setDefaultIncomeWithholding)
  const n = normalizeIncomeWithholdingRule(rule)
  const [apply, setApply] = useState(n.apply)
  const [pct, setPct] = useState(String(n.percent > 0 ? n.percent : 32))
  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const r = normalizeIncomeWithholdingRule(rule)
    setApply(r.apply)
    setPct(String(r.percent > 0 ? r.percent : 32))
  }, [activeProfileId, rule])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const flashSaved = () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setShowSaved(true)
    savedTimerRef.current = setTimeout(() => {
      setShowSaved(false)
      savedTimerRef.current = null
    }, 2800)
  }

  return (
    <div
      className="rounded-2xl p-6 scroll-mt-24"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>
        Inntekt — standard for nye linjer
      </h2>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Gjelder <strong>{profileName}</strong> (aktiv budsjettprofil). Brukes som forhåndsvalg når du legger til nye
        inntektslinjer og som fallback for inntektstransaksjoner som er markert som brutto uten egen prosent. Forenklet
        modell — ikke offisiell skatt.
      </p>
      <label className="flex items-start gap-3 min-h-[44px] cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={apply}
          onChange={(e) => setApply(e.target.checked)}
          className="mt-1 h-4 w-4 rounded shrink-0"
        />
        <span className="text-sm" style={{ color: 'var(--text)' }}>
          Nye inntektslinjer: beløp er brutto med forenklet trekk
        </span>
      </label>
      {apply && (
        <label className="flex flex-col gap-2.5 mb-4">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Standard trekk (prosent)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={pct}
            onChange={(e) => setPct(e.target.value.replace(/[^\d.,]/g, ''))}
            className="w-full max-w-xs px-3 py-2 rounded-xl text-sm min-h-[44px]"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => {
            const r = normalizeIncomeWithholdingRule({
              apply,
              percent: Number(String(pct).replace(',', '.')) || 0,
            })
            setDefaultIncomeWithholding(r)
            flashSaved()
          }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white min-h-[44px] w-fit touch-manipulation"
          style={{ background: 'var(--primary)' }}
        >
          Lagre standard
        </button>
        {showSaved && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium"
            style={{ color: 'var(--success)' }}
          >
            Lagret
          </p>
        )}
      </div>
    </div>
  )
}

function StartveiledningCard() {
  const openOnboardingAgain = useStore((s) => s.openOnboardingAgain)

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Sparkles size={16} style={{ color: 'var(--primary)' }} />
        Startveiledning
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Gå gjennom introduksjonen på nytt — navn på profil, budsjettår, hovedinntekt og tips om demodata.
      </p>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-start">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}
          onClick={() => openOnboardingAgain()}
        >
          Vis veiledningen på nytt
        </button>
        <Link
          href="/konto/kom-i-gang"
          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          Les utvidet guide
        </Link>
      </div>
    </div>
  )
}

export default function KontoInnstillingerPage() {
  const budgetYear = useStore((s) => s.budgetYear)
  const budgetCategories = useStore((s) => {
    const cats = s.people[s.activeProfileId]?.budgetCategories
    return cats ?? EMPTY_BUDGET_CATEGORIES
  })
  return (
    <>
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <User size={16} style={{ color: 'var(--primary)' }} />
          Profil
        </h2>
        <ProfileSettingsForm />
      </div>

      <DemoDataCard />

      <IncomeWithholdingDefaultsCard />

      <StartveiledningCard />

      <BudgetSetupChecklistCard budgetCategories={budgetCategories} budgetYear={budgetYear} />

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Bell size={16} style={{ color: 'var(--primary)' }} />
          Varsler
        </h2>
        {['Månedlig budsjettrapport', 'Advarsel ved overskredet budsjett', 'Påminnelse om sparemål'].map(
          (label) => (
            <div
              key={label}
              className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                {label}
              </span>
              <div className="w-10 h-5 rounded-full cursor-pointer" style={{ background: 'var(--primary)' }}>
                <div className="w-4 h-4 bg-white rounded-full mt-0.5 ml-5 shadow" />
              </div>
            </div>
          ),
        )}
      </div>
    </>
  )
}
