'use client'

import { useMemo } from 'react'
import type { BankAccountCacheEntry } from '@/lib/neonomics/accountTypes'
import { maskIban } from '@/lib/neonomics/accountTypes'
import type { NeonomicsConnectionStatusDto } from '@/lib/neonomics/connectionStatus'
import {
  BANK_CONNECT_ACCOUNTS_COL_ACCOUNT,
  BANK_CONNECT_ACCOUNTS_COL_IMPORTED,
  BANK_CONNECT_ACCOUNTS_COL_INCLUDED,
  BANK_CONNECT_ACCOUNTS_COL_LAST_SYNC,
  BANK_CONNECT_ACCOUNTS_COL_PENDING,
  BANK_CONNECT_ACCOUNTS_EMPTY,
  BANK_CONNECT_ACCOUNTS_NO,
  BANK_CONNECT_ACCOUNTS_OVERVIEW_HINT,
  BANK_CONNECT_ACCOUNTS_OVERVIEW_TITLE,
  BANK_CONNECT_ACCOUNTS_YES,
  BANK_CONNECT_LAST_SYNC_NEVER,
} from '@/lib/neonomics/bankConnectCopy'
import { countImportedByAccountId } from '@/lib/neonomics/syncAccounts'
import type { Transaction } from '@/lib/store'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'

function labelForEntry(entry: BankAccountCacheEntry): string {
  const name = entry.displayName?.trim() || entry.accountName?.trim()
  if (name) return name
  return maskIban(entry.iban) ?? 'Bankkonto'
}

function formatLastSync(iso: string | null | undefined): string {
  if (!iso) return BANK_CONNECT_LAST_SYNC_NEVER
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return formatIsoDateDdMmYyyy(iso.slice(0, 10))
  const date = formatIsoDateDdMmYyyy(iso.slice(0, 10))
  const time = d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  return `${date} kl. ${time}`
}

type Props = {
  connection: NeonomicsConnectionStatusDto
  transactions: Transaction[]
}

export default function BankAccountsOverview({ connection, transactions }: Props) {
  const syncSet = useMemo(
    () => new Set(connection.syncAccountIds),
    [connection.syncAccountIds],
  )

  const importedByAccount = useMemo(
    () => countImportedByAccountId(transactions),
    [transactions],
  )

  const accounts = connection.accounts

  if (accounts.length === 0) {
    return (
      <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
        {BANK_CONNECT_ACCOUNTS_EMPTY}
      </p>
    )
  }

  return (
    <div className="space-y-3 min-w-0">
      <div>
        <h3 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
          {BANK_CONNECT_ACCOUNTS_OVERVIEW_TITLE}
        </h3>
        <p className="text-xs mt-1 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {BANK_CONNECT_ACCOUNTS_OVERVIEW_HINT}
        </p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[320px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                {BANK_CONNECT_ACCOUNTS_COL_ACCOUNT}
              </th>
              <th className="text-left py-2 pr-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                {BANK_CONNECT_ACCOUNTS_COL_INCLUDED}
              </th>
              <th className="text-left py-2 pr-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                {BANK_CONNECT_ACCOUNTS_COL_LAST_SYNC}
              </th>
              <th className="text-right py-2 pr-3 font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {BANK_CONNECT_ACCOUNTS_COL_IMPORTED}
              </th>
              <th className="text-right py-2 font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {BANK_CONNECT_ACCOUNTS_COL_PENDING}
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((entry) => {
              const included = syncSet.has(entry.id)
              const imported =
                importedByAccount.get(entry.id) ?? entry.lastImportedCount ?? 0
              const pending = entry.lastPendingCount ?? 0
              const iban = maskIban(entry.iban)
              return (
                <tr key={entry.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-3 pr-3 min-w-0">
                    <span className="font-medium block" style={{ color: 'var(--text)' }}>
                      {labelForEntry(entry)}
                    </span>
                    {iban && (
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {iban}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap" style={{ color: 'var(--text)' }}>
                    {included ? BANK_CONNECT_ACCOUNTS_YES : BANK_CONNECT_ACCOUNTS_NO}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-xs" style={{ color: 'var(--text)' }}>
                    {formatLastSync(entry.lastSyncAt)}
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                    {imported}
                  </td>
                  <td className="py-3 text-right tabular-nums" style={{ color: pending > 0 ? 'var(--primary)' : 'var(--text)' }}>
                    {pending}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
