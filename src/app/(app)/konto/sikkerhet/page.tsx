import { Suspense } from 'react'
import Link from 'next/link'
import { KeyRound, Monitor } from 'lucide-react'
import PasswordChangeForm from '@/components/konto/PasswordChangeForm'
import MfaTofaktorSection from '@/components/konto/MfaTofaktorSection'
import SecurityRedirectNotice from '@/components/konto/SecurityRedirectNotice'

export default function KontoSikkerhetPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SecurityRedirectNotice />
      </Suspense>
      <div
        className="rounded-2xl p-4 sm:p-6 min-w-0 overflow-x-hidden"
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

      <MfaTofaktorSection />

      <div
        className="rounded-2xl p-4 sm:p-6 min-w-0 overflow-x-hidden"
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
