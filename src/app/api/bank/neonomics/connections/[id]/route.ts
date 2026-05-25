import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'

import {

  getBankConnectionById,

  updateBankConnection,

} from '@/lib/neonomics/bankConnectionsRepo'

import { connectionToStatusDto } from '@/lib/neonomics/connectionStatus'

import { parseAccountsCache } from '@/lib/neonomics/syncAccounts'



export const dynamic = 'force-dynamic'



export async function PATCH(

  req: NextRequest,

  context: { params: Promise<{ id: string }> },

) {

  const auth = await requireNeonomicsApiAuth()

  if (!isAuthedContext(auth)) return auth



  const { id } = await context.params

  const connectionId = id?.trim()

  if (!connectionId) {

    return NextResponse.json({ error: 'Manglende koblings-id.' }, { status: 400 })

  }



  const body = (await req.json().catch(() => null)) as {

    autoSyncEnabled?: boolean

    syncAccountIds?: string[]

  } | null



  const conn = await getBankConnectionById(auth.supabase, auth.userId, connectionId)

  if (!conn) {

    return NextResponse.json({ error: 'Kobling ikke funnet.' }, { status: 404 })

  }



  const patch: Parameters<typeof updateBankConnection>[2] = {}



  if (typeof body?.autoSyncEnabled === 'boolean') {

    patch.auto_sync_enabled = body.autoSyncEnabled

  }



  if (Array.isArray(body?.syncAccountIds)) {

    const ids = body.syncAccountIds.map((x) => String(x).trim()).filter(Boolean)

    if (ids.length === 0) {

      return NextResponse.json(

        { error: 'Velg minst én konto å hente fra.' },

        { status: 400 },

      )

    }

    const known = new Set(parseAccountsCache(conn.accounts_cache).map((a) => a.id))

    const invalid = ids.filter((i) => known.size > 0 && !known.has(i))

    if (invalid.length > 0) {

      return NextResponse.json(

        { error: 'En eller flere kontoer finnes ikke lenger. Oppdater kontolisten.' },

        { status: 400 },

      )

    }

    patch.sync_account_ids = ids

    patch.selected_account_id = ids[0] ?? null

  }



  if (Object.keys(patch).length === 0) {

    return NextResponse.json(

      { error: 'autoSyncEnabled eller syncAccountIds er påkrevd.' },

      { status: 400 },

    )

  }



  await updateBankConnection(auth.supabase, connectionId, patch)



  const updated = await getBankConnectionById(auth.supabase, auth.userId, connectionId)

  if (!updated) {

    return NextResponse.json({ ok: true })

  }



  return NextResponse.json(connectionToStatusDto(updated))

}


