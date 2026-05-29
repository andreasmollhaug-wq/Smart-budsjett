'use client'

import { householdSingleLoginNote, mfaRecommendShort } from '@/lib/kontoCopy'
import { CONTACT_EMAIL } from '@/lib/legal'
import MfaGuideModalShell from '@/components/konto/MfaGuideModalShell'

const TITLE_ID = 'mfa-faq-title'

type Props = {
  open: boolean
  onClose: () => void
}

export default function MfaFaqModal({ open, onClose }: Props) {
  return (
    <MfaGuideModalShell open={open} onClose={onClose} title="Mer om tofaktor" titleId={TITLE_ID}>
      <p className="text-sm mb-4 break-words" style={{ color: 'var(--text-muted)' }}>
        {mfaRecommendShort} Du velger selv om du vil aktivere det.
      </p>
      <p className="text-sm mb-4 break-words" style={{ color: 'var(--text-muted)' }}>
        Mister du tilgang til autentiseringsappen, kontakt{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline break-all" style={{ color: 'var(--primary)' }}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
        Husholdning og innlogging
      </h3>
      <p className="text-sm mb-4 break-words" style={{ color: 'var(--text-muted)' }}>
        {householdSingleLoginNote} Du bytter profil i appen under «Viser data for».
      </p>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
        På sikt
      </h3>
      <p className="text-sm m-0 break-words" style={{ color: 'var(--text-muted)' }}>
        Vi utvikler mot at ett abonnement kan knyttes til flere e-poster (for eksempel opptil fem), slik at hver kan
        logge inn med egen adresse.
      </p>
    </MfaGuideModalShell>
  )
}
