'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  useStore,
  pickPersistedSlice,
  tryReadLegacyLocalStorage,
  clearLegacyLocalStorage,
  type PersistedAppSlice,
} from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { RoadmapVisibleTimeInvite } from '@/components/app/RoadmapVisibleTimeInvite'
import { applyUiPaletteToDocument } from '@/lib/uiColorPalette'

const DEBOUNCE_MS = 1500

function isRlsOrPermissionError(message: string, code?: string): boolean {
  if (code === '42501') return true
  return /permission denied|row-level security|new row violates row-level security/i.test(message)
}

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
  /** Skiller første lasting fra `router.refresh()` — se `hydrateFromServerRefresh`. */
  const initialPayloadHydrationDone = useRef(false)
  /** Unngår identiske upserts når store trigges uten reell endring (samme serialiserte slice). */
  const lastSavedSliceJson = useRef<string | null>(null)
  const persistRlsWarned = useRef(false)
  const [persistSaveError, setPersistSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialPayloadHydrationDone.current) {
      useStore.getState().hydrateFromPayload(initialState)

      if (wasCreated) {
        const legacy = tryReadLegacyLocalStorage()
        if (legacy) {
          useStore.getState().hydrateFromPayload(legacy)
          clearLegacyLocalStorage()
        }
      }

      initialPayloadHydrationDone.current = true
    } else {
      useStore.getState().hydrateFromServerRefresh(initialState)
    }

    // Etter server-/legacy-hydrering — ellers kan NotificationBell sin tidligere sync
    // bli overskrevet og nye kunngjøringer vises aldri.
    useStore.getState().syncProductAnnouncements()
    useStore.getState().syncInsightNotifications()

    syncReady.current = true
  }, [initialState, wasCreated])

  useEffect(() => {
    applyUiPaletteToDocument(useStore.getState().uiColorPalette)
    const unsub = useStore.subscribe((state) => {
      applyUiPaletteToDocument(state.uiColorPalette)
    })
    return () => {
      unsub()
    }
  }, [])

  useEffect(() => {
    lastSavedSliceJson.current = null

    let timer: ReturnType<typeof setTimeout> | undefined

    const save = async (slice: PersistedAppSlice) => {
      const json = JSON.stringify(slice)
      if (json === lastSavedSliceJson.current) return
      try {
        const supabase = createClient()
        const { error } = await supabase.from('user_app_state').upsert(
          {
            user_id: userId,
            state: slice as unknown as Record<string, unknown>,
          },
          { onConflict: 'user_id' },
        )
        if (error) {
          console.error('[user_app_state]', error.message)
          if (!persistRlsWarned.current && isRlsOrPermissionError(error.message, error.code)) {
            persistRlsWarned.current = true
            setPersistSaveError(
              'Kunne ikke lagre endringer. Fullfør registrering av betaling for å starte prøveperioden og få lagring.',
            )
          }
          return
        }
        lastSavedSliceJson.current = json
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

  return (
    <>
      <RoadmapVisibleTimeInvite />
      {persistSaveError ? (
        <div
          role="alert"
          className="fixed bottom-0 left-0 right-0 z-[200] border-t px-4 py-3 text-sm shadow-lg md:left-auto md:right-4 md:bottom-4 md:max-w-md md:rounded-xl"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          <p className="mb-2">{persistSaveError}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/konto/betalinger?trial=welcome&reason=subscription"
              className="font-medium underline underline-offset-2"
              style={{ color: 'var(--primary)' }}
            >
              Gå til betaling
            </Link>
            <button
              type="button"
              className="text-xs opacity-80 hover:opacity-100"
              onClick={() => setPersistSaveError(null)}
            >
              Lukk
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </>
  )
}
