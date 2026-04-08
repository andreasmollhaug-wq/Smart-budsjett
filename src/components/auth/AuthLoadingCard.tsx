import { Loader2 } from 'lucide-react'

/** Felles innramming for innlogging / glemt passord / tilbakestill (spinner mens auth sjekkes). */
export default function AuthLoadingCard({ label = 'Laster…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--primary)' }} aria-hidden />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
