import { describe, expect, it } from 'vitest'
import {
  dottirAiEngagementNotificationBody,
  dottirAiEngagementNotificationTitle,
} from '@/lib/dottirAiEngagementInvite'

describe('dottirAiEngagementInvite copy', () => {
  it('har tittel og brødtekst med eksempler', () => {
    expect(dottirAiEngagementNotificationTitle()).toContain('dottir AI')
    expect(dottirAiEngagementNotificationBody()).toMatch(/budsjett/i)
    expect(dottirAiEngagementNotificationBody()).toMatch(/Åpne dottir AI/)
  })
})
