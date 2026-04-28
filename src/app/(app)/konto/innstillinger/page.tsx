'use client'

import Link from 'next/link'
import {
  User,
  Bell,
  Sparkles,
  FlaskConical,
  CircleDollarSign,
  Palette,
  ChevronRight,
} from 'lucide-react'
import { useStore, type BudgetCategory } from '@/lib/store'
import { UI_COLOR_PALETTE_OPTIONS } from '@/lib/uiColorPalette'
import { normalizeIncomeWithholdingRule } from '@/lib/incomeWithholding'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BudgetSetupChecklistCard from '@/components/konto/BudgetSetupChecklistCard'

/** Stabile tomme referanser — `?? []` / `?? {}` i Zustand-selectorer gir ny referanse hver gang og utløser React 18 getSnapshot-loop. */
const EMPTY_BUDGET_CATEGORIES: BudgetCategory[] = []

const APPEARANCE_PALETTE_EXPANDED_KEY = 'smart-budsjett-settings-appearance-palette-expanded'

function readAppearancePaletteExpanded(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(APPEARANCE_PALETTE_EXPANDED_KEY) === 'true'
  } catch {
    return false
  }
}

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

function ShowAmountDecimalsCard() {
  const showAmountDecimals = useStore((s) => s.showAmountDecimals)
  const setShowAmountDecimals = useStore((s) => s.setShowAmountDecimals)
  const syncInsightNotifications = useStore((s) => s.syncInsightNotifications)
  const [justSaved, setJustSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return (
    <div
      className="rounded-2xl p-6 scroll-mt-24"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2
        className="font-semibold mb-2 flex items-center gap-2"
        id="innstillinger-vis-desimaler-heading"
        style={{ color: 'var(--text)' }}
      >
        <CircleDollarSign size={16} style={{ color: 'var(--primary)' }} />
        Vis desimaler i beløp
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Gjelder lister, oversikter og KPI. Du kan fortsatt skrive inn kroner og øre uansett innstilling.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          id="innstillinger-vis-desimaler-switch"
          role="switch"
          aria-checked={showAmountDecimals}
          aria-labelledby="innstillinger-vis-desimaler-heading"
          onClick={() => {
            const next = !showAmountDecimals
            setShowAmountDecimals(next)
            syncInsightNotifications()
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            setJustSaved(true)
            saveTimerRef.current = setTimeout(() => {
              setJustSaved(false)
              saveTimerRef.current = null
            }, 2800)
          }}
          className="inline-flex w-full sm:w-auto items-center gap-3 text-left min-h-[44px] touch-manipulation rounded-xl -mx-1 px-1 py-1"
        >
          <span
            className="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors"
            style={{ background: showAmountDecimals ? 'var(--primary)' : 'var(--border)' }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow mt-1 transition-transform"
              style={{ transform: showAmountDecimals ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
            />
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {showAmountDecimals ? 'Viser kroner og øre' : 'Viser hele kroner'}
          </span>
        </button>
        {justSaved && (
          <p role="status" aria-live="polite" className="text-sm font-medium" style={{ color: 'var(--success)' }}>
            Visning lagret
          </p>
        )}
      </div>
    </div>
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
        studielån og kredittkort i snøball), samt ferdig utfylt ukeplan, måltider og handleliste i den interne modulen
        «mat og handleliste». Dine egne data lagres trygt mens demodata er på, og gjenopprettes når du slår det av. I
        familiehusholdning med flere profiler er eksempeltallene forskjellige per medlem (første profil tilsvarer
        standarddemoen).
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

function AppearancePaletteCard() {
  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const setUiColorPalette = useStore((s) => s.setUiColorPalette)
  /** Alltid false ved første render (matcher SSR); localStorage leses etter mount. */
  const [expanded, setExpanded] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelId = 'innstillinger-fargepalett-panel'

  const selectedLabel =
    UI_COLOR_PALETTE_OPTIONS.find((o) => o.id === uiColorPalette)?.label ?? 'Klassisk blå'

  useEffect(() => {
    setExpanded(readAppearancePaletteExpanded())
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const flashSaved = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setJustSaved(true)
    saveTimerRef.current = setTimeout(() => {
      setJustSaved(false)
      saveTimerRef.current = null
    }, 2800)
  }

  const toggleExpanded = () => {
    setExpanded((e) => {
      const next = !e
      try {
        window.localStorage.setItem(APPEARANCE_PALETTE_EXPANDED_KEY, String(next))
      } catch {
        /* private mode / blocked */
      }
      return next
    })
  }

  return (
    <div
      className="rounded-2xl p-6 scroll-mt-24"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full min-h-[44px] touch-manipulation items-center gap-2 rounded-xl py-1 text-left -mx-1 px-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        style={{ color: 'var(--text)' }}
      >
        <ChevronRight
          size={20}
          className="shrink-0 transition-transform duration-200"
          style={{
            transform: expanded ? 'rotate(90deg)' : undefined,
            color: 'var(--text-muted)',
          }}
          aria-hidden
        />
        <Palette size={16} style={{ color: 'var(--primary)' }} className="shrink-0" aria-hidden />
        <span className="font-semibold min-w-0 flex-1" id="innstillinger-fargepalett-heading">
          Utseende — fargepalett
        </span>
      </button>

      {!expanded && (
        <p className="text-sm mt-3 pl-[2.25rem]" style={{ color: 'var(--text-muted)' }}>
          Valgt:{' '}
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            {selectedLabel}
          </span>
        </p>
      )}

      {expanded ? (
        <div id={panelId} className="mt-4">
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Velg fargetema for meny, knapper og bakgrunn i appen. Standard er det blå uttrykket du kjenner fra før.
          </p>
          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-labelledby="innstillinger-fargepalett-heading"
          >
            {UI_COLOR_PALETTE_OPTIONS.map((opt) => {
              const selected = uiColorPalette === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    if (opt.id === uiColorPalette) return
                    setUiColorPalette(opt.id)
                    flashSaved()
                  }}
                  className="flex w-full min-h-[44px] touch-manipulation items-start gap-3 rounded-xl border px-3 py-3 text-left transition-opacity hover:opacity-95 sm:items-center"
                  style={{
                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                    background: selected ? 'var(--primary-pale)' : 'var(--bg)',
                    boxShadow: selected ? '0 0 0 1px var(--primary)' : undefined,
                  }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:mt-0"
                    style={{
                      borderColor: selected ? 'var(--primary)' : 'var(--border)',
                      background: selected ? 'var(--primary)' : 'transparent',
                    }}
                    aria-hidden
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>
                      {opt.hint}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {justSaved && (
        <p role="status" aria-live="polite" className="text-sm font-medium mt-3" style={{ color: 'var(--success)' }}>
          Innstilling lagret
        </p>
      )}
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

      <ShowAmountDecimalsCard />

      <DemoDataCard />

      <IncomeWithholdingDefaultsCard />

      <AppearancePaletteCard />

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
