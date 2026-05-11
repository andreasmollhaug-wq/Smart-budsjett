import Link from 'next/link'

/** Kort forsikring på forum-sider om test-modus og personvern */
export default function ForumInfoBanner() {
  return (
    <div
      className="rounded-xl p-4 text-sm mb-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      role="region"
      aria-label="Om forumet"
    >
      <p className="font-medium" style={{ color: 'var(--text)' }}>
        Direkte lenke — ikke i hovedmenyen (del URL med dem som skal inn).
      </p>
      <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
        Ikke del sensitive personopplysninger, kontonumre eller detaljer som kan identifisere deg offentlig.{' '}
        <Link
          href="/personvern"
          className="font-medium underline"
          style={{ color: 'var(--primary)' }}
        >
          Personvern
        </Link>
        .
      </p>
    </div>
  )
}
