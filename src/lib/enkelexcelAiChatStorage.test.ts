import { describe, expect, it } from 'vitest'
import {
  enkelexcelAiChatStorageKey,
  parseStoredAiChatMessages,
  serializeStoredAiChatMessages,
} from '@/lib/enkelexcelAiChatStorage'

describe('enkelexcelAiChatStorage v2', () => {
  it('uses v2 storage key', () => {
    expect(enkelexcelAiChatStorageKey('user-1')).toContain('v2')
  })

  it('roundtrips action metadata', () => {
    const msgs = [
      {
        id: 'a1',
        role: 'assistant' as const,
        content: 'Forslag',
        proposedAction: {
          kind: 'budget' as const,
          blocked: false as const,
          profileId: 'default',
          profileName: 'Meg',
          categoryName: 'Strøm',
          parentCategory: 'regninger' as const,
          lineLabel: 'Regninger → Strøm',
          amountNok: 1500,
          period: { mode: 'monthly_all' as const },
          periodLabel: 'Hver måned (jan–des)',
          budgetYear: 2026,
          resolvedCategoryId: null,
          isNewLine: true,
          previousAmountNok: null,
          createLineIfMissing: true,
          subscriptionWarning: false,
          payload: {
            kind: 'budget' as const,
            categoryName: 'Strøm',
            parentCategory: 'regninger' as const,
            amountNok: 1500,
            period: { mode: 'monthly_all' as const },
            budgetYear: 2026,
            createLineIfMissing: true,
          },
        },
        actionStatus: 'pending' as const,
      },
    ]
    const raw = serializeStoredAiChatMessages(msgs)
    const parsed = parseStoredAiChatMessages(raw)
    expect(parsed?.[0]?.proposedAction).toBeTruthy()
    expect(parsed?.[0]?.actionStatus).toBe('pending')
  })
})
