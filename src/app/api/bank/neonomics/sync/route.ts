import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'

import { runBankAutoImportForConnection } from '@/lib/neonomics/bankAutoImportServer'

import { getBankConnection } from '@/lib/neonomics/bankConnectionsRepo'

import { resolveNeonomicsBankId } from '@/lib/neonomics/bankCatalog'

import { NeonomicsApiError } from '@/lib/neonomics/errors'

import { createServiceRoleClient } from '@/lib/supabase/admin'



export const dynamic = 'force-dynamic'



export async function POST(req: NextRequest) {

  const auth = await requireNeonomicsApiAuth()

  if (!isAuthedContext(auth)) return auth



  const body = (await req.json().catch(() => null)) as {

    profileId?: string

    bankId?: string

    accountId?: string

    fromDate?: string

    toDate?: string

  } | null



  const profileId = body?.profileId?.trim()

  if (!profileId) {

    return NextResponse.json({ error: 'profileId er påkrevd.' }, { status: 400 })

  }



  const bank = resolveNeonomicsBankId(body?.bankId)

  const conn = await getBankConnection(auth.supabase, auth.userId, profileId, bank.bankId)

  if (!conn) {

    return NextResponse.json({ error: 'Ingen bankkobling. Koble bank først.' }, { status: 400 })

  }



  const admin = createServiceRoleClient()

  if (!admin) {

    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 503 })

  }



  try {

    const result = await runBankAutoImportForConnection(admin, conn, 'manual', req)



    if (!result.ok && result.needsConsent) {

      return NextResponse.json({

        needsConsent: true,

        consentUrl: result.consentUrl,

        bankAuthUrl: result.bankAuthUrl,

        bankId: bank.bankId,

      })

    }



    if (!result.ok) {

      return NextResponse.json({ error: result.error }, { status: 500 })

    }



    return NextResponse.json({

      needsConsent: false,

      bankId: bank.bankId,

      meta: {

        fetchedCount: result.fetchedCount,

        importedCount: result.importedCount,

        pendingCount: result.pendingCount,

        duplicateCount: result.duplicateCount,

        accounts: result.accounts.map((a) => ({

          accountId: a.accountId,

          label: a.label,

          fetched: a.fetched,

          imported: a.imported,

          pending: a.pending,

          duplicate: a.duplicate,

          error: a.error,

        })),

      },

    })

  } catch (e) {

    const msg =

      e instanceof NeonomicsApiError

        ? e.message

        : e instanceof Error

          ? e.message

          : 'Kunne ikke hente transaksjoner.'

    if (e instanceof NeonomicsApiError) {

      return NextResponse.json(

        { error: e.message, errorCode: e.errorCode },

        { status: e.statusCode >= 400 ? e.statusCode : 510 },

      )

    }

    return NextResponse.json({ error: msg }, { status: 500 })

  }

}


