'use client'

import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import MfaPanel from '@/components/konto/MfaPanel'
import MfaInfoPopover from '@/components/konto/MfaInfoPopover'
import MfaHowToModal from '@/components/konto/MfaHowToModal'

export default function MfaTofaktorSection() {
  const [howToOpen, setHowToOpen] = useState(false)

  return (
    <div
      className="rounded-2xl p-4 sm:p-6 min-w-0"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between min-w-0">
        <h2
          className="font-semibold flex items-center gap-2 flex-wrap min-w-0 m-0"
          style={{ color: 'var(--text)' }}
        >
          <Smartphone size={16} style={{ color: 'var(--primary)' }} />
          <span>Tofaktorautentisering</span>
          <MfaInfoPopover />
        </h2>
        <button
          type="button"
          onClick={() => setHowToOpen(true)}
          data-testid="mfa-how-to-trigger"
          className="text-sm font-medium min-h-[44px] touch-manipulation underline underline-offset-2 shrink-0 self-start sm:self-auto"
          style={{ color: 'var(--primary)' }}
        >
          Slik gjør du det
        </button>
      </div>
      <MfaPanel onOpenHowTo={() => setHowToOpen(true)} />
      <MfaHowToModal open={howToOpen} onClose={() => setHowToOpen(false)} />
    </div>
  )
}
