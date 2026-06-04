import { ShieldCheck } from 'lucide-react'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

export default function AdminWelcomeHero({ greetingName }: { greetingName?: string }) {
  const firstName = greetingName?.trim().split(/\s+/)[0]

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-8 sm:py-8"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface)) 0%, var(--surface) 55%, color-mix(in srgb, var(--primary-pale) 80%, var(--bg)) 100%)',
        border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 sm:h-40 sm:w-40"
        style={{ background: 'color-mix(in srgb, var(--primary) 18%, transparent)' }}
        aria-hidden
      />
      <div className="relative min-w-0">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider sm:text-xs"
          style={{
            background: 'color-mix(in srgb, var(--primary) 14%, var(--surface))',
            color: 'var(--primary)',
            border: '1px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
          }}
        >
          <ShieldCheck size={14} strokeWidth={2.2} aria-hidden />
          Intern admin
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {firstName ? (
            <>
              Velkommen, {firstName}
              <span className="block text-lg font-semibold sm:text-xl" style={{ color: 'var(--text-muted)' }}>
                {PRODUCT_DISPLAY_NAME} Admin
              </span>
            </>
          ) : (
            <>Velkommen til {PRODUCT_DISPLAY_NAME} Admin</>
          )}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Følg vekst, konvertering og abonnement — aggregerte tall uten persondata. Bruk fanene Oversikt, Grafer
          og Verktøy.
        </p>
      </div>
    </section>
  )
}
