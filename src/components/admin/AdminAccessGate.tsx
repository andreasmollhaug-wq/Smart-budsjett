import Link from 'next/link'
import type { AdminAccessFailureReason } from '@/lib/admin/types'

const COPY: Record<
  Exclude<AdminAccessFailureReason, 'unauthenticated' | 'mfa_step_up_required' | 'config'>,
  { title: string; body: string; cta?: { href: string; label: string } }
> = {
  not_allowlisted: {
    title: 'Ingen admin-tilgang',
    body: 'Kontoen din er innlogget, men står ikke på tilgangslisten for admin. Kontakt eier av produktet hvis du mener dette er feil.',
  },
  mfa_not_enrolled: {
    title: 'Tofaktor kreves',
    body: 'Admin-oversikten krever at du har aktivert tofaktor (TOTP) på kontoen din.',
    cta: { href: '/konto/sikkerhet', label: 'Gå til Sikkerhet' },
  },
  no_email: {
    title: 'Kontoen mangler e-post',
    body: 'Vi fant ingen e-postadresse på kontoen din. Admin-tilgang kan ikke verifiseres.',
    cta: { href: '/konto/innstillinger', label: 'Gå til Min konto' },
  },
}

export default function AdminAccessGate({
  reason,
}: {
  reason: Exclude<AdminAccessFailureReason, 'unauthenticated' | 'mfa_step_up_required' | 'config'>
}) {
  const content = COPY[reason]

  return (
    <div className="flex min-h-screen-dvh flex-col items-center justify-center px-[max(1rem,env(safe-area-inset-left))] py-12">
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-semibold tracking-tight">{content.title}</h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {content.body}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {content.cta ? (
            <Link
              href={content.cta.href}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium touch-manipulation"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {content.cta.label}
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-medium touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Til appen
          </Link>
        </div>
      </div>
    </div>
  )
}
