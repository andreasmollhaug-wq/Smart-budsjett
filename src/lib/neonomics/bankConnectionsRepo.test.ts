import { describe, expect, it, vi } from 'vitest'
import { recordBankSyncResult } from '@/lib/neonomics/bankConnectionsRepo'

describe('recordBankSyncResult', () => {
  it('skriver last_sync_at ved ok', async () => {
    const update = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: () => ({
        update: (patch: unknown) => {
          update(patch)
          return { eq: () => ({ error: null }) }
        },
      }),
    } as never

    await recordBankSyncResult(supabase, 'conn-1', { ok: true, fetchedCount: 12 })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_sync_fetched_count: 12,
        last_sync_error: null,
      }),
    )
    expect(update.mock.calls[0]![0]).toHaveProperty('last_sync_at')
  })

  it('skriver last_sync_error ved feil uten last_sync_at', async () => {
    const update = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: () => ({
        update: (patch: unknown) => {
          update(patch)
          return { eq: () => ({ error: null }) }
        },
      }),
    } as never

    await recordBankSyncResult(supabase, 'conn-1', { ok: false, error: 'Consent mangler' })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_sync_error: 'Consent mangler',
      }),
    )
    expect(update.mock.calls[0]![0]).not.toHaveProperty('last_sync_at')
  })
})
