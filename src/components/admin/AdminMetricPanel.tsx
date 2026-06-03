import type { ReactNode } from 'react'

export default function AdminMetricPanel({
  title,
  subtitle,
  children,
  accent = 'var(--primary)',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  /** CSS-farge for subtil gradient i panelheader */
  accent?: string
}) {
  return (
    <div
      className="min-w-0 overflow-hidden rounded-2xl"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--text) 5%, transparent)',
      }}
    >
      <div
        className="border-b px-4 py-3 sm:px-5 sm:py-4"
        style={{
          borderColor: 'var(--border)',
          background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 8%, var(--surface)) 0%, var(--surface) 100%)`,
        }}
      >
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}
