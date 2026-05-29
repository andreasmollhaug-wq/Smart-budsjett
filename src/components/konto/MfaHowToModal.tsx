'use client'

import { useEffect, useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import {
  mfaHowToIntro,
  mfaHowToMobileSteps,
  mfaHowToDesktopSteps,
  mfaHowToLoginSteps,
  mfaRecommendedApps,
  mfaHowToMobileQrNote,
  mfaLostDeviceNote,
} from '@/lib/kontoCopy'
import { CONTACT_EMAIL } from '@/lib/legal'
import MfaGuideModalShell from '@/components/konto/MfaGuideModalShell'

const TITLE_ID = 'mfa-how-to-title'

type Device = 'mobile' | 'desktop'

type Props = {
  open: boolean
  onClose: () => void
}

function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol
      className="text-sm space-y-2.5 list-decimal list-inside m-0 pl-0 break-words leading-relaxed"
      style={{ color: 'var(--text-muted)' }}
    >
      {steps.map((step) => (
        <li key={step} className="break-words">
          {step}
        </li>
      ))}
    </ol>
  )
}

function DeviceCard({
  device,
  selected,
  onSelect,
}: {
  device: Device
  selected: boolean
  onSelect: () => void
}) {
  const isMobile = device === 'mobile'
  const Icon = isMobile ? Smartphone : Monitor
  const label = isMobile ? 'Mobiltelefon' : 'Datamaskin'
  const hint = isMobile ? 'Oppsett på telefonen' : 'Skann QR-kode'

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className="relative flex min-h-[88px] min-w-0 flex-1 flex-col items-start gap-2 rounded-xl p-4 text-left touch-manipulation transition-all duration-300 ease-out"
      style={{
        background: selected ? 'var(--primary-pale)' : 'var(--bg)',
        border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
        color: 'var(--text)',
        boxShadow: selected ? '0 4px 14px color-mix(in srgb, var(--primary) 12%, transparent)' : 'none',
        transform: selected ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300"
        style={{
          background: selected ? 'var(--surface)' : 'color-mix(in srgb, var(--surface) 80%, var(--bg))',
          color: selected ? 'var(--primary)' : 'var(--text-muted)',
        }}
      >
        <Icon size={18} aria-hidden />
      </span>
      <span className="text-sm font-medium leading-tight">{label}</span>
      <span className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
        {hint}
      </span>
    </button>
  )
}

export default function MfaHowToModal({ open, onClose }: Props) {
  const [device, setDevice] = useState<Device>('mobile')

  useEffect(() => {
    if (open) setDevice('mobile')
  }, [open])

  return (
    <MfaGuideModalShell open={open} onClose={onClose} title="Slik gjør du det" titleId={TITLE_ID}>
      <p className="text-sm mb-5 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {mfaHowToIntro} Valgfritt — du kan bruke Dottir uten.
      </p>

      <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
        Velg enhet
      </p>
      <div role="tablist" aria-label="Velg enhet for oppsett" className="mb-4 grid grid-cols-2 gap-3 min-w-0">
        <DeviceCard device="mobile" selected={device === 'mobile'} onSelect={() => setDevice('mobile')} />
        <DeviceCard device="desktop" selected={device === 'desktop'} onSelect={() => setDevice('desktop')} />
      </div>

      <div
        key={device}
        role="tabpanel"
        className="mb-5 rounded-xl p-4 min-w-0 animate-[mfaHowToFade_0.28s_ease-out_both]"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-medium mb-3 m-0" style={{ color: 'var(--text)' }}>
          {device === 'mobile' ? 'Slik gjør du på mobil' : 'Slik gjør du på PC'}
        </h3>

        <div className="mb-4">
          <p className="text-xs font-medium mb-2 m-0" style={{ color: 'var(--text)' }}>
            Anbefalte apper
          </p>
          <ul className="text-sm space-y-1 m-0 pl-4 list-disc break-words" style={{ color: 'var(--text-muted)' }}>
            {mfaRecommendedApps.map((app) => (
              <li key={app}>{app}</li>
            ))}
          </ul>
        </div>

        <StepList steps={device === 'mobile' ? mfaHowToMobileSteps : mfaHowToDesktopSteps} />

        {device === 'mobile' && (
          <p className="text-xs mt-4 mb-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {mfaHowToMobileQrNote}
          </p>
        )}
      </div>

      <section className="mb-5">
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          Neste gang du logger inn
        </h3>
        <StepList steps={mfaHowToLoginSteps} />
      </section>

      <section>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          Tapt telefon?
        </h3>
        <p className="text-sm m-0 break-words leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {mfaLostDeviceNote}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline break-all" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </MfaGuideModalShell>
  )
}
