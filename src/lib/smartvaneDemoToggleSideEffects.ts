'use client'

import { clearSmartvaneDemoData, seedSmartvaneDemoIfNeeded } from '@/features/smartvane/actions'

/** Supabase-demodata SmartVane når innstillingen snur (matcher resten av demodata lokalt/state). */
export async function syncSmartvaneAfterDemoToggle(nextDemoEnabled: boolean): Promise<void> {
  if (nextDemoEnabled) {
    await seedSmartvaneDemoIfNeeded()
  } else {
    await clearSmartvaneDemoData()
  }
}
