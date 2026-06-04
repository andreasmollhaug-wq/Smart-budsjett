'use client'

export default function AdminMetricsContextBanner({ variant }: { variant: 'oversikt' | 'grafer' }) {
  const text =
    variant === 'oversikt'
      ? 'Pulse og abonnement: hendelser per dag eller status nå. Abonnentlisten viser hvem som har Solo/Familie. Konvertering er totalt siden oppstart.'
      : 'Grafene viser hendelser per dag/uke (Europe/Oslo). Checkout = første fullførte Stripe Checkout den dagen/uken.'

  return (
    <p
      className="rounded-xl px-3 py-2.5 text-xs leading-relaxed sm:text-sm"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {text}
    </p>
  )
}
