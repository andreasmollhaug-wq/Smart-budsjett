'use client'

import { useStore } from '@/lib/store'

export default function DemoModeBanner() {
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  if (!demoDataEnabled) return null

  return (
    <div
      className="w-full shrink-0 px-4 py-2.5 text-center text-sm font-medium border-b"
      style={{
        background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      role="status"
    >
      Du ser demodata — tall og forslag under er eksempler. Slå av i Innstillinger når du vil bruke egne tall.
    </div>
  )
}
