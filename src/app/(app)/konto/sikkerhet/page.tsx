import { Shield, KeyRound, Smartphone, Monitor } from 'lucide-react'
import PasswordChangeForm from '@/components/konto/PasswordChangeForm'

export default function KontoSikkerhetPage() {
  return (
    <>
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
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Smartphone size={16} style={{ color: 'var(--primary)' }} />
          Tofaktorautentisering
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Ekstra beskyttelse for kontoen din med engangskode fra app.
        </p>
        <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text)' }}>2FA er deaktivert</span>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
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
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Enheter der du er innlogget nå.
        </p>
        <div
          className="flex items-center justify-between py-3 border-b last:border-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <Shield size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Denne enheten
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Windows · Chrome · Nå
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
