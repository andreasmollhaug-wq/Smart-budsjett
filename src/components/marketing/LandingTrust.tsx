import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function LandingTrust() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div
        className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'var(--primary-pale)' }}
        >
          <Shield size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Trygghet og personvern
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Økonomidata er sensitivt. Smart Budsjett er bygget for at du skal eie oversikten din — med tydelige innstillinger og
            respekt for personvern. Les mer i{' '}
            <Link href="/personvern" className="font-medium underline underline-offset-2 transition-opacity hover:opacity-90" style={{ color: 'var(--primary)' }}>
              personvernerklæringen
            </Link>{' '}
            og{' '}
            <Link href="/vilkar" className="font-medium underline underline-offset-2 transition-opacity hover:opacity-90" style={{ color: 'var(--primary)' }}>
              vilkårene
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
