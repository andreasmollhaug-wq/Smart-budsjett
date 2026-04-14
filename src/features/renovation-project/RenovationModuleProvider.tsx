'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RenovationModulePersistedState } from './types'
import { useRenovationProjectStore } from './renovationProjectStore'

const DEBOUNCE_MS = 1500

function isRlsOrPermissionError(message: string, code?: string): boolean {
  if (code === '42501') return true
  return /permission denied|row-level security|new row violates row-level security/i.test(message)
}

export function RenovationModuleProvider({
  children,
  initialState,
  userId,
}: {
  children: React.ReactNode
  initialState: RenovationModulePersistedState
  userId: string
}) {
  const syncReady = useRef(false)
  const lastSavedJson = useRef<string | null>(null)
  const persistRlsWarned = useRef(false)
  const [persistSaveError, setPersistSaveError] = useState<string | null>(null)

  useEffect(() => {
    useRenovationProjectStore.getState().hydrate(initialState)
    syncReady.current = true
  }, [initialState])

  useEffect(() => {
    lastSavedJson.current = null

    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async (slice: RenovationModulePersistedState) => {
      const json = JSON.stringify(slice)
      if (json === lastSavedJson.current) return
      try {
        const supabase = createClient()
        const { error } = await supabase.from('user_renovation_project_state').upsert(
          {
            user_id: userId,
            state: slice as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        if (error) {
          console.error('[user_renovation_project_state]', error.message)
          if (!persistRlsWarned.current && isRlsOrPermissionError(error.message, error.code)) {
            persistRlsWarned.current = true
            setPersistSaveError(
              'Kunne ikke lagre prosjektmodulen. Sjekk at du er innlogget og har tilgang.',
            )
          }
          return
        }
        lastSavedJson.current = json
      } catch (e) {
        console.error('[user_renovation_project_state]', e)
      }
    }

    const flush = () => {
      if (!syncReady.current) return
      clearTimeout(timer)
      timer = undefined
      void save(useRenovationProjectStore.getState().getPersistedSlice())
    }

    const unsub = useRenovationProjectStore.subscribe((state) => {
      if (!syncReady.current) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        void save(state.getPersistedSlice())
      }, DEBOUNCE_MS)
    })

    return () => {
      unsub()
      clearTimeout(timer)
      flush()
    }
  }, [userId])

  return (
    <>
      {persistSaveError && (
        <div
          className="shrink-0 px-4 py-2 text-sm text-center"
          style={{ background: '#FCE8E8', color: 'var(--danger)' }}
        >
          {persistSaveError}
        </div>
      )}
      {children}
    </>
  )
}
