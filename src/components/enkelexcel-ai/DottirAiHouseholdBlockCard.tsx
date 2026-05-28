'use client'

type Props = {
  message: string
}

export default function DottirAiHouseholdBlockCard({ message }: Props) {
  return (
    <div
      className="mt-3 rounded-xl border px-4 py-3 space-y-2"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--primary-pale) 40%, var(--bg))' }}
      role="status"
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        Kan ikke legge inn her
      </p>
      <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
      <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
        Velg én profil i «Viser data for» øverst til venstre, og spør på nytt.
      </p>
    </div>
  )
}
