'use client'

import { useEffect, useRef } from 'react'
import {
  useStore,
  pickPersistedSlice,
  tryReadLegacyLocalStorage,
  clearLegacyLocalStorage,
  type PersistedAppSlice,
} from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

const DEBOUNCE_MS = 1500

export function AppStateProvider({
  children,
  initialState,
  wasCreated,
  userId,
}: {
  children: React.ReactNode
  initialState: unknown
  wasCreated: boolean
  userId: string
}) {
  const syncReady = useRef(false)

  useEffect(() => {
    useStore.getState().hydrateFromPayload(initialState)

    if (wasCreated) {
      const legacy = tryReadLegacyLocalStorage()
      if (legacy) {
        useStore.getState().hydrateFromPayload(legacy)
        clearLegacyLocalStorage()
      }
    }
    syncReady.current = true
  }, [initialState, wasCreated])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async (slice: PersistedAppSlice) => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from('user_app_state').upsert(
          {
            user_id: userId,
            state: slice as unknown as Record<string, unknown>,
          },
          { onConflict: 'user_id' },
        )
        if (error) console.error('[user_app_state]', error.message)
      } catch (e) {
        console.error('[user_app_state]', e)
      }
    }

    const flush = () => {
      if (!syncReady.current) return
      clearTimeout(timer)
      timer = undefined
      void save(pickPersistedSlice(useStore.getState()))
    }

    const unsub = useStore.subscribe((state) => {
      if (!syncReady.current) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        save(pickPersistedSlice(state))
      }, DEBOUNCE_MS)
    })

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      unsub()
      clearTimeout(timer)
      flush()
    }
  }, [userId])

  return <>{children}</>
}
