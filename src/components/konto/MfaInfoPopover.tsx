'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import MfaFaqModal from '@/components/konto/MfaFaqModal'

export default function MfaInfoPopover() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        style={{ color: 'var(--text-muted)' }}
        aria-expanded={open}
        aria-label="Mer om tofaktor og husholdning"
        data-testid="mfa-faq-trigger"
      >
        <HelpCircle size={18} />
      </button>
      <MfaFaqModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
