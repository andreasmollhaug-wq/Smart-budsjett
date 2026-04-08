import { Suspense } from 'react'
import Link from 'next/link'
import { KeyRound, Smartphone, Monitor } from 'lucide-react'
import PasswordChangeForm from '@/components/konto/PasswordChangeForm'
import MfaInfoPopover from '@/components/konto/MfaInfoPopover'
import SecurityRedirectNotice from '@/components/konto/SecurityRedirectNotice'

export default function KontoSikkerhetPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SecurityRedirectNotice />
      </Suspense>
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <KeyRound size={16} style={{ color: 'var(--primary)' }} />
          Passord
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Endre passordet du bruker til å logge inn.
        </p>
        <PasswordChangeForm />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Er du utlogget og har glemt passordet?{' '}
          <Link href="/glemt-passord" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--primary)' }}>
            Send lenke for å sette nytt passord
          </Link>
          .
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2
          className="font-semibold mb-4 flex items-center gap-2 flex-wrap"
          style={{ color: 'var(--text)' }}
        >
          <Smartphone size={16} style={{ color: 'var(--primary)' }} />
          <span>Tofaktorautentisering</span>
          <MfaInfoPopover />
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Ekstra beskyttelse med engangskode fra autentiseringsapp. Aktivering kommer i neste release.
        </p>
        <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text)' }}>2FA er deaktivert</span>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl text-sm font-medium opacity-60 cursor-not-allowed"
            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
            title="Kommer i neste release"
          >
            Aktiver
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Monitor size={16} style={{ color: 'var(--primary)' }} />
          Aktive økter
        </h2>
        <p className="text-sm py-3 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          Oversikt over innloggede enheter og mulighet til å logge ut andre økter kommer senere. Du er innlogget i denne
          nettleseren nå.
        </p>
      </div>
    </>
  )
}
