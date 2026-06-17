'use client'

import { useMemo } from 'react'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'
import { useStore } from '@/lib/store'
import { isFamilyCollaborationEnabled } from './familyGate'

/** Kan brukeren redigere (ikke husholdningsvisning)? */
export function useEnkelHandlelisteCanMutate(): {
  canMutate: boolean
  activeProfileId: string
  financeScope: 'profile' | 'household'
  familyEnabled: boolean
  profileNames: Record<string, string>
} {
  const activeProfileId = useStore((s) => s.activeProfileId)
  const financeScope = useStore((s) => s.financeScope)
  const profiles = useStore((s) => s.profiles)
  const { effectiveSubscriptionPlan: effectivePlan } = useSubscriptionReadOnly()

  const familyEnabled = isFamilyCollaborationEnabled(effectivePlan, profiles.length)
  const canMutate = financeScope !== 'household'

  const profileNames = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of profiles) m[p.id] = p.name?.trim() || 'Profil'
    return m
  }, [profiles])

  return {
    canMutate,
    activeProfileId,
    financeScope,
    familyEnabled,
    profileNames,
  }
}
