'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type TransactionPageVis = 'liste' | 'oversikt'

/**
 * URL-styring for transaksjonssiden: vis=oversikt for faktisk årsrutenett, ellers liste.
 * Fjerner utdaterte period/monthIdx fra eldre lenker ved bytte til/fra oversikt.
 */
export function useTransaksjonPageQuery() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const vis: TransactionPageVis = useMemo(
    () => (searchParams.get('vis') === 'oversikt' ? 'oversikt' : 'liste'),
    [searchParams],
  )

  const replaceParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString())
      mutate(p)
      const qs = p.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const setVis = useCallback(
    (next: TransactionPageVis, opts?: { ensureYear?: number }) => {
      replaceParams((p) => {
        if (next === 'liste') {
          p.delete('vis')
        } else {
          p.set('vis', 'oversikt')
          p.delete('period')
          p.delete('monthIdx')
          if (opts?.ensureYear !== undefined) p.set('year', String(opts.ensureYear))
        }
      })
    },
    [replaceParams],
  )

  const setYearInUrl = useCallback(
    (year: number) => {
      replaceParams((p) => {
        p.set('year', String(year))
      })
    },
    [replaceParams],
  )

  return {
    vis,
    replaceParams,
    setVis,
    setYearInUrl,
  }
}
