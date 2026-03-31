'use client'

import { useStore } from '@/lib/store'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default function OnboardingHost() {
  const pending = useStore((s) => s.onboarding.status === 'pending')
  if (!pending) return null
  return <OnboardingWizard />
}
