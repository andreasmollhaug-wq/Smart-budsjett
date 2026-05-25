import type { NeonomicsConnectionStatusDto } from '@/lib/neonomics/connectionStatus'
import type { AppNotification, AppNotificationKind } from '@/lib/store'

export const BANK_HOUSEHOLD_SUMMARY_NOTIFICATION_ID = 'bank:household-summary'

export function bankPendingNotificationId(profileId: string, bankId: string): string {
  return `bank:pending:${profileId}:${bankId}`
}

export function bankConsentNotificationId(connectionId: string): string {
  return `bank:consent:${connectionId}`
}

export function bankSyncFailNotificationId(connectionId: string): string {
  return `bank:sync-fail:${connectionId}`
}

const BANK_NOTIFICATION_PREFIXES = ['bank:pending:', 'bank:consent:', 'bank:sync-fail:', BANK_HOUSEHOLD_SUMMARY_NOTIFICATION_ID]

export function isBankNotificationId(id: string): boolean {
  return BANK_NOTIFICATION_PREFIXES.some((p) => id === p || id.startsWith(p))
}

type SyncInput = {
  profiles: { id: string; name: string }[]
  activeProfileId: string
  subscriptionPlan: 'solo' | 'family'
  bankPendingNeonomics: Record<
    string,
    { profileId: string; bankId: string; bankDisplayName: string; rows: unknown[] }
  >
  connectionsByProfile: Record<string, NeonomicsConnectionStatusDto[]>
}

function buildPendingNotification(
  profileId: string,
  bankId: string,
  bankDisplayName: string,
  count: number,
): AppNotification {
  const id = bankPendingNotificationId(profileId, bankId)
  return {
    id,
    title: 'Transaksjoner trenger kartlegging',
    body: `${count} transaksjon${count === 1 ? '' : 'er'} fra ${bankDisplayName} venter på kategori.`,
    kind: 'budget' as AppNotificationKind,
    createdAt: new Date().toISOString(),
    read: false,
    contentSignature: String(count),
    actionHref: `/konto/importer-transaksjoner?bankPending=1&profileId=${encodeURIComponent(profileId)}&bankId=${encodeURIComponent(bankId)}`,
    actionLabel: 'Kartlegg nå',
  }
}

function buildConsentNotification(conn: NeonomicsConnectionStatusDto): AppNotification {
  return {
    id: bankConsentNotificationId(conn.id),
    title: 'Bankkobling trenger fornyelse',
    body: `Samtykke for ${conn.bankDisplayName} må bekreftes på nytt hos banken.`,
    kind: 'budget',
    createdAt: new Date().toISOString(),
    read: false,
    actionHref: `/konto/koble-til-bank?profileId=${encodeURIComponent(conn.profileId)}`,
    actionLabel: 'Koble til bank',
  }
}

function buildSyncFailNotification(conn: NeonomicsConnectionStatusDto): AppNotification {
  const err = conn.lastSyncError?.trim() || 'Ukjent feil'
  return {
    id: bankSyncFailNotificationId(conn.id),
    title: `Kunne ikke hente fra ${conn.bankDisplayName}`,
    body: err,
    kind: 'budget',
    createdAt: new Date().toISOString(),
    read: false,
    contentSignature: err,
    actionHref: '/konto/koble-til-bank',
    actionLabel: 'Åpne bankkobling',
  }
}

export function computeBankNotifications(input: SyncInput): AppNotification[] {
  const out: AppNotification[] = []
  const isFamily = input.subscriptionPlan === 'family' && input.profiles.length >= 2

  for (const pending of Object.values(input.bankPendingNeonomics)) {
    const count = pending.rows?.length ?? 0
    if (count <= 0) continue
    out.push(
      buildPendingNotification(
        pending.profileId,
        pending.bankId,
        pending.bankDisplayName,
        count,
      ),
    )
  }

  for (const profile of input.profiles) {
    const conns = input.connectionsByProfile[profile.id] ?? []
    for (const conn of conns) {
      if (conn.connected && !conn.consentOk) {
        out.push(buildConsentNotification(conn))
      } else if (conn.lastSyncError?.trim()) {
        out.push(buildSyncFailNotification(conn))
      }
    }
  }

  if (isFamily) {
    const others: string[] = []
    for (const profile of input.profiles) {
      if (profile.id === input.activeProfileId) continue
      let n = 0
      for (const pending of Object.values(input.bankPendingNeonomics)) {
        if (pending.profileId !== profile.id) continue
        n += pending.rows?.length ?? 0
      }
      if (n === 0) {
        for (const conn of input.connectionsByProfile[profile.id] ?? []) {
          n += conn.pendingUnmappedCount ?? 0
        }
      }
      if (n > 0) {
        others.push(`${profile.name} har ${n} transaksjon${n === 1 ? '' : 'er'} som bør sjekkes`)
      }
    }
    if (others.length > 0) {
      out.push({
        id: BANK_HOUSEHOLD_SUMMARY_NOTIFICATION_ID,
        title: 'Bank i husholdningen',
        body: others.join('. ') + '.',
        kind: 'budget',
        createdAt: new Date().toISOString(),
        read: false,
        contentSignature: others.join('|'),
        actionHref: '/konto/koble-til-bank',
        actionLabel: 'Åpne bankkobling',
      })
    }
  }

  return out
}

export function mergeBankNotifications(
  existing: AppNotification[],
  computed: AppNotification[],
): AppNotification[] {
  const base = existing.filter((n) => !isBankNotificationId(n.id))
  const byId = new Map(computed.map((n) => [n.id, n]))

  const merged: AppNotification[] = []
  for (const n of computed) {
    const prev = existing.find((x) => x.id === n.id)
    const unchanged =
      prev &&
      prev.contentSignature != null &&
      prev.contentSignature === n.contentSignature &&
      prev.title === n.title
    merged.push({
      ...n,
      createdAt: prev?.createdAt ?? n.createdAt,
      read: unchanged && prev ? prev.read : false,
    })
  }

  return [...merged, ...base.filter((n) => !byId.has(n.id))]
}
