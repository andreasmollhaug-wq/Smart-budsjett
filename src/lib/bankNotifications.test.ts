import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BANK_HOUSEHOLD_SUMMARY_NOTIFICATION_ID,
  bankPendingNotificationId,
  computeBankNotifications,
} from '@/lib/bankNotifications'

const env = process.env

describe('bankNotifications', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_NEONOMICS_UI_LIVE = 'true'
    process.env.NEXT_PUBLIC_NEONOMICS_ENABLED = 'true'
    process.env.NEONOMICS_ENABLED = 'true'
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('lager pending-varsel per profil og bank', () => {
    const list = computeBankNotifications({
      profiles: [{ id: 'p1', name: 'Meg' }],
      activeProfileId: 'p1',
      subscriptionPlan: 'solo',
      bankPendingNeonomics: {
        'p1:bank1': {
          profileId: 'p1',
          bankId: 'bank1',
          bankDisplayName: 'DNB',
          rows: [{}, {}] as never[],
        },
      },
      connectionsByProfile: {},
    })
    expect(list.some((n) => n.id === bankPendingNotificationId('p1', 'bank1'))).toBe(true)
    expect(list[0]?.actionHref).toContain('bankPending=1')
  })

  it('lager husholdningsoppsummering for familie', () => {
    const list = computeBankNotifications({
      profiles: [
        { id: 'p1', name: 'Ola' },
        { id: 'p2', name: 'Kari' },
      ],
      activeProfileId: 'p1',
      subscriptionPlan: 'family',
      bankPendingNeonomics: {
        'p2:bank1': {
          profileId: 'p2',
          bankId: 'bank1',
          bankDisplayName: 'DNB',
          rows: [{}] as never[],
        },
      },
      connectionsByProfile: {
        p2: [
          {
            id: 'c1',
            profileId: 'p2',
            bankId: 'bank1',
            connected: true,
            consentOk: true,
            bankDisplayName: 'DNB',
            selectedAccountId: null,
            syncAccountIds: [],
            accounts: [],
            lastSyncAt: null,
            lastSyncFetchedCount: null,
            lastSyncError: null,
            autoSyncEnabled: false,
            pendingUnmappedCount: 1,
          },
        ],
      },
    })
    expect(list.some((n) => n.id === BANK_HOUSEHOLD_SUMMARY_NOTIFICATION_ID)).toBe(true)
    expect(list.find((n) => n.id === BANK_HOUSEHOLD_SUMMARY_NOTIFICATION_ID)?.body).toContain('Kari')
  })

  it('returnerer tom liste når bank-UI er skjult', () => {
    delete process.env.NEXT_PUBLIC_NEONOMICS_UI_LIVE
    const list = computeBankNotifications({
      profiles: [{ id: 'p1', name: 'Meg' }],
      activeProfileId: 'p1',
      subscriptionPlan: 'solo',
      bankPendingNeonomics: {
        'p1:bank1': {
          profileId: 'p1',
          bankId: 'bank1',
          bankDisplayName: 'DNB',
          rows: [{}] as never[],
        },
      },
      connectionsByProfile: {},
    })
    expect(list).toEqual([])
  })
})
