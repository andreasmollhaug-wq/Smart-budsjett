'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface AppUserContextValue {
  displayName: string
  /** True første gang user_app_state-rad opprettes (Velkommen vs Velkommen tilbake). */
  isFirstAppState: boolean
}

const AppUserContext = createContext<AppUserContextValue | null>(null)

export function AppUserProvider({
  children,
  displayName,
  isFirstAppState,
}: {
  children: ReactNode
  displayName: string
  isFirstAppState: boolean
}) {
  return (
    <AppUserContext.Provider value={{ displayName, isFirstAppState }}>{children}</AppUserContext.Provider>
  )
}

export function useAppUser(): AppUserContextValue {
  const ctx = useContext(AppUserContext)
  if (!ctx) {
    throw new Error('useAppUser must be used within AppUserProvider')
  }
  return ctx
}
