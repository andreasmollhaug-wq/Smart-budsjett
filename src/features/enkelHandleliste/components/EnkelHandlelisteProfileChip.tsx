'use client'

import { Eye, Users } from 'lucide-react'

export type EhListAccessMode = 'owner' | 'member' | 'readonly' | 'household'

export function EnkelHandlelisteProfileChip({ mode }: { mode: EhListAccessMode }) {
  const config: Record<EhListAccessMode, { label: string; icon: typeof Eye }> = {
    owner: { label: 'Din liste', icon: Users },
    member: { label: 'Delt · du kan legge til', icon: Users },
    readonly: { label: 'Kun lesing', icon: Eye },
    household: { label: 'Husholdning · kun visning', icon: Eye },
  }
  const { label, icon: Icon } = config[mode]
  return (
    <span
      className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
    >
      <Icon size={13} aria-hidden />
      {label}
    </span>
  )
}
