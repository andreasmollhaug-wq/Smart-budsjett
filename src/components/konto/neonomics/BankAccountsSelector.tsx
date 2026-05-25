'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BankAccountCacheEntry } from '@/lib/neonomics/accountTypes'
import { maskIban } from '@/lib/neonomics/accountTypes'
import type { NeonomicsConnectionStatusDto } from '@/lib/neonomics/connectionStatus'
import {
  BANK_CONNECT_ACCOUNTS_REFRESH,
  BANK_CONNECT_ACCOUNTS_SAVE,
  BANK_CONNECT_ACCOUNTS_SAVE_BUSY,
  BANK_CONNECT_ACCOUNTS_SECTION,
  BANK_CONNECT_ACCOUNTS_SECTION_HINT,
  BANK_CONNECT_ACCOUNTS_SINGLE_HINT,
} from '@/lib/neonomics/bankConnectCopy'

type Props = {
  connection: NeonomicsConnectionStatusDto
  disabled?: boolean
  onSaved?: () => void
}

function labelForEntry(entry: BankAccountCacheEntry): string {
  const name = entry.displayName?.trim() || entry.accountName?.trim()
  if (name) return name
  return maskIban(entry.iban) ?? 'Bankkonto'
}

export default function BankAccountsSelector({ connection, disabled, onSaved }: Props) {
  const [accounts, setAccounts] = useState<BankAccountCacheEntry[]>(connection.accounts)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(connection.syncAccountIds.length > 0 ? connection.syncAccountIds : connection.accounts.map((a) => a.id)),
  )
  const [busy, setBusy] = useState(false)
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const autoFetchedRef = useRef(false)

  useEffect(() => {
    setAccounts(connection.accounts)
    const ids =
      connection.syncAccountIds.length > 0
        ? connection.syncAccountIds
        : connection.accounts.map((a) => a.id)
    setSelected(new Set(ids))
    setDirty(false)
  }, [connection.id, connection.accounts, connection.syncAccountIds])

  const allSelected = useMemo(
    () => accounts.length > 0 && accounts.every((a) => selected.has(a.id)),
    [accounts, selected],
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size <= 1) return prev
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setDirty(true)
  }

  const toggleAll = () => {
    if (allSelected) return
    setSelected(new Set(accounts.map((a) => a.id)))
    setDirty(true)
  }

  const refreshAccounts = useCallback(async () => {
    setRefreshBusy(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/bank/neonomics/accounts?profileId=${encodeURIComponent(connection.profileId)}&bankId=${encodeURIComponent(connection.bankId)}`,
      )
      const data = (await res.json().catch(() => null)) as {
        accounts?: BankAccountCacheEntry[]
        syncAccountIds?: string[]
        error?: string
      }
      if (!res.ok) {
        setError(data?.error ?? 'Kunne ikke oppdatere kontolisten.')
        return
      }
      const list = data.accounts ?? []
      setAccounts(list)
      const ids = data.syncAccountIds ?? list.map((a) => a.id)
      setSelected(new Set(ids))
      setDirty(false)
      onSaved?.()
    } finally {
      setRefreshBusy(false)
    }
  }, [connection.profileId, connection.bankId, onSaved])

  useEffect(() => {
    if (autoFetchedRef.current || connection.accounts.length > 0) return
    autoFetchedRef.current = true
    void refreshAccounts()
  }, [connection.accounts.length, connection.id, refreshAccounts])

  const saveSelection = async () => {
    const ids = [...selected]
    if (ids.length === 0) {
      setError('Velg minst én konto.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/bank/neonomics/connections/${connection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAccountIds: ids }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string }
      if (!res.ok) {
        setError(data?.error ?? 'Kunne ikke lagre kontovalg.')
        return
      }
      setDirty(false)
      onSaved?.()
    } finally {
      setBusy(false)
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border p-4 space-y-3 min-w-0" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Ingen kontoer funnet ennå.{' '}
          <button
            type="button"
            disabled={disabled || refreshBusy}
            onClick={() => void refreshAccounts()}
            className="font-medium underline underline-offset-2 touch-manipulation min-h-[44px] inline-flex items-center"
            style={{ color: 'var(--primary)' }}
          >
            {BANK_CONNECT_ACCOUNTS_REFRESH}
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-4 space-y-3 min-w-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
            {BANK_CONNECT_ACCOUNTS_SECTION}
          </h3>
          <p className="text-xs mt-1 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {accounts.length === 1 ? BANK_CONNECT_ACCOUNTS_SINGLE_HINT : BANK_CONNECT_ACCOUNTS_SECTION_HINT}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || refreshBusy}
          onClick={() => void refreshAccounts()}
          className="shrink-0 text-sm font-medium min-h-[44px] px-3 py-2 rounded-lg touch-manipulation sm:self-start w-full sm:w-auto text-left sm:text-center"
          style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}
        >
          {refreshBusy ? 'Oppdaterer…' : BANK_CONNECT_ACCOUNTS_REFRESH}
        </button>
      </div>

      {refreshBusy && (
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Henter kontoer fra banken…
        </p>
      )}

      <ul className="space-y-1 m-0 p-0 list-none">
        {accounts.map((entry) => {
          const checked = selected.has(entry.id)
          const iban = maskIban(entry.iban)
          return (
            <li key={entry.id}>
              <label
                className="flex items-center gap-3 min-h-[44px] py-2 cursor-pointer touch-manipulation rounded-lg px-2 -mx-2"
                style={{ background: checked ? 'var(--primary-pale)' : 'transparent' }}
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0"
                  checked={checked}
                  disabled={disabled || busy || refreshBusy}
                  onChange={() => toggle(entry.id)}
                />
                <span className="min-w-0 text-sm leading-snug py-0.5">
                  <span className="font-medium block" style={{ color: 'var(--text)' }}>
                    {labelForEntry(entry)}
                  </span>
                  {iban && (
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {iban}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {(dirty || !allSelected) && (
        <div
          className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          {!allSelected && (
            <button
              type="button"
              disabled={disabled || busy || refreshBusy}
              onClick={toggleAll}
              className="min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Velg alle
            </button>
          )}
          {dirty && (
            <button
              type="button"
              disabled={disabled || busy || refreshBusy}
              onClick={() => void saveSelection()}
              className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium text-white touch-manipulation disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              {busy ? BANK_CONNECT_ACCOUNTS_SAVE_BUSY : BANK_CONNECT_ACCOUNTS_SAVE}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm m-0 rounded-lg p-2" style={{ background: '#fef2f2', color: '#991b1b' }}>
          {error}
        </p>
      )}
    </div>
  )
}
