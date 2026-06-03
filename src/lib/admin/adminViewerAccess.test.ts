import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdminViewerAccess } from '@/lib/admin/adminViewerAccess'

vi.mock('@/lib/supabase/admin', () => ({
  createServiceRoleClient: vi.fn(),
}))

import { createServiceRoleClient } from '@/lib/supabase/admin'

function mockSupabase(opts: {
  user?: { id: string; email: string } | null
  factors?: { totp?: Array<{ status: string }> }
  aal?: { currentLevel: 'aal1' | 'aal2'; nextLevel: 'aal1' | 'aal2' | null }
  allowlisted?: boolean
}) {
  const serviceFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: opts.allowlisted ? { email: opts.user?.email } : null,
        }),
      }),
    }),
  })
  vi.mocked(createServiceRoleClient).mockReturnValue({
    from: serviceFrom,
  } as unknown as SupabaseClient)

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } }),
      mfa: {
        listFactors: vi.fn().mockResolvedValue({ data: opts.factors ?? { totp: [] }, error: null }),
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: opts.aal ?? { currentLevel: 'aal2', nextLevel: null },
          error: null,
        }),
      },
    },
  } as unknown as SupabaseClient
}

describe('requireAdminViewerAccess', () => {
  it('avviser uautentisert', async () => {
    const r = await requireAdminViewerAccess(mockSupabase({ user: null }))
    expect(r).toEqual({ ok: false, reason: 'unauthenticated' })
  })

  it('avviser uten MFA', async () => {
    const r = await requireAdminViewerAccess(
      mockSupabase({
        user: { id: '1', email: 'a@b.no' },
        factors: { totp: [] },
        allowlisted: true,
      }),
    )
    expect(r).toEqual({ ok: false, reason: 'mfa_not_enrolled' })
  })

  it('avviser ikke på allowlist', async () => {
    const r = await requireAdminViewerAccess(
      mockSupabase({
        user: { id: '1', email: 'a@b.no' },
        factors: { totp: [{ status: 'verified' }] },
        aal: { currentLevel: 'aal2', nextLevel: null },
        allowlisted: false,
      }),
    )
    expect(r).toEqual({ ok: false, reason: 'not_allowlisted' })
  })

  it('godkjenner allowlist + MFA', async () => {
    const r = await requireAdminViewerAccess(
      mockSupabase({
        user: { id: '1', email: 'Admin@B.No' },
        factors: { totp: [{ status: 'verified' }] },
        aal: { currentLevel: 'aal2', nextLevel: null },
        allowlisted: true,
      }),
    )
    expect(r).toEqual({ ok: true, email: 'admin@b.no' })
  })
})
