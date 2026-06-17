'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeEnkelHandlelisteState } from './normalize'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import type { EnkelHandlelisteState } from './types'

const DEBOUNCE_MS = 1500
const TABLE = 'user_enkel_handleliste_state'

function isRlsOrPermissionError(message: string, code?: string): boolean {
  if (code === '42501') return true
  return /permission denied|row-level security|new row violates row-level security/i.test(message)
}

export function EnkelHandlelisteProvider({
  children,
  initialState,
  userId,
}: {
  children: React.ReactNode
  initialState: EnkelHandlelisteState
  userId: string
}) {
  const syncReady = useRef(false)
  const lastSavedJson = useRef<string | null>(null)
  const persistRlsWarned = useRef(false)
  const [persistSaveError, setPersistSaveError] = useState<string | null>(null)
  const offlineQueueRef = useRef<EnkelHandlelisteState[]>([])

  useEffect(() => {
    useEnkelHandlelisteStore.getState().hydrate(initialState)
    syncReady.current = true
  }, [initialState])

  useEffect(() => {
    lastSavedJson.current = null

    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async (slice: EnkelHandlelisteState) => {
      const json = JSON.stringify(slice)
      if (json === lastSavedJson.current) return

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        offlineQueueRef.current.push(slice)
        return
      }

      try {
        const supabase = createClient()
        const { error } = await supabase.from(TABLE).upsert(
          {
            user_id: userId,
            state: slice as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        if (error) {
          console.error(`[${TABLE}]`, error.message)
          if (!persistRlsWarned.current && isRlsOrPermissionError(error.message, error.code)) {
            persistRlsWarned.current = true
            setPersistSaveError(
              'Kunne ikke lagre handlelisten. Sjekk at du er innlogget og har tilgang.',
            )
          }
          return
        }
        lastSavedJson.current = json
        while (offlineQueueRef.current.length > 0) {
          const next = offlineQueueRef.current.shift()!
          const nextJson = JSON.stringify(next)
          if (nextJson === lastSavedJson.current) continue
          const { error: err2 } = await supabase.from(TABLE).upsert(
            {
              user_id: userId,
              state: next as unknown as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          )
          if (!err2) lastSavedJson.current = nextJson
        }
      } catch (e) {
        console.error(`[${TABLE}]`, e)
      }
    }

    const flush = () => {
      if (!syncReady.current) return
      clearTimeout(timer)
      timer = undefined
      void save(useEnkelHandlelisteStore.getState().getPersistedSlice())
    }

    const unsub = useEnkelHandlelisteStore.subscribe(() => {
      if (!syncReady.current) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        void save(useEnkelHandlelisteStore.getState().getPersistedSlice())
      }, DEBOUNCE_MS)
    })

    const onOnline = () => flush()
    window.addEventListener('online', onOnline)

    return () => {
      unsub()
      clearTimeout(timer)
      window.removeEventListener('online', onOnline)
      flush()
    }
  }, [userId])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`eh:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLE,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { state?: unknown } | undefined
          if (!row?.state) return
          const remote = normalizeEnkelHandlelisteState(row.state)
          const json = JSON.stringify(remote)
          if (json === lastSavedJson.current) return
          useEnkelHandlelisteStore.getState().mergeFromRemote(remote)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <>
      {persistSaveError && (
        <div
          className="shrink-0 px-4 py-2 text-center text-sm"
          style={{ background: '#FCE8E8', color: 'var(--danger)' }}
          role="alert"
        >
          {persistSaveError}
        </div>
      )}
      {children}
    </>
  )
}
