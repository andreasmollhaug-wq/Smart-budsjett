'use client'

import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'

export default function OnboardingHost() {
  const pathname = usePathname()
  const { appReadOnly, loading, hasSubscriptionAccess } = useSubscriptionReadOnly()
  const pending = useStore((s) => s.onboarding.status === 'pending')

  /** Ikke vis oppå betalingssiden før brukeren har fullført Checkout med kort. */
  const blockWizardOnBetaling =
    pathname?.startsWith('/konto/betalinger') === true && !hasSubscriptionAccess

  if (!pending || loading || appReadOnly || blockWizardOnBetaling) return null
  return <OnboardingWizard />
}
