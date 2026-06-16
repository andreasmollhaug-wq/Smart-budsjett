'use client'

import GuideModalShell from '@/components/ui/GuideModalShell'
import CreditorRegistryDemoVisuals from '@/components/debt/creditorRegistry/CreditorRegistryDemoVisuals'
import { creditorRegistryDemoCopy } from '@/lib/creditorRegistry/demoOverview'

const TITLE_ID = 'creditor-registry-info-title'

type Props = {
  open: boolean
  onClose: () => void
  formatNOK: (n: number) => string
}

export default function CreditorRegistryInfoModal({ open, onClose, formatNOK }: Props) {
  return (
    <GuideModalShell
      open={open}
      onClose={onClose}
      title="Slik fungerer oversikt gjeld"
      titleId={TITLE_ID}
      panelClassName="max-w-2xl"
    >
      <div className="space-y-5 min-w-0">
        <p className="text-sm m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {creditorRegistryDemoCopy.intro}
        </p>

        <CreditorRegistryDemoVisuals formatNOK={formatNOK} />

        <div>
          <p className="text-sm font-medium m-0 mb-2" style={{ color: 'var(--text)' }}>
            Slik kommer du i gang
          </p>
          <ul className="text-sm m-0 pl-5 space-y-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {creditorRegistryDemoCopy.howTo.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <p
          className="text-xs m-0 leading-relaxed rounded-xl px-3 py-2.5"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {creditorRegistryDemoCopy.standaloneNote}
        </p>
      </div>
    </GuideModalShell>
  )
}
