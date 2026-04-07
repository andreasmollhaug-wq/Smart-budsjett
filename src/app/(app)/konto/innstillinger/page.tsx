'use client'

import Link from 'next/link'
import { User, Bell, Sparkles, FlaskConical } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
        lagres trygt mens demodata er på, og gjenopprettes når du slår det av.
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

      <StartveiledningCard />

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
