'use client'

import { useEffect, useState } from 'react'

/** Matcher Tailwind `max-md` (under 768px bredde), samme som mobil-layout i AppShell. */
export const NARROW_SCREEN_MEDIA_QUERY = '(max-width: 767px)'

/**
 * Klient-hook: `true` når viewport-bredden er under Tailwinds `md`-breakpoint (768px).
 *
 * **Foretrekk Tailwind** (`max-md:`, `md:`) for layout, spacing og synlighet — da er desktop
 * uendret uten hydration-tenkning.
 *
 * **Bruk denne hooken** bare når oppførsel ikke kan uttrykkes i CSS, f.eks.:
 * - prop til et bibliotek som krever boolean
 * - betinget render av to helt forskjellige komponenter
 * - state som avhenger av «mobil» ved første interaksjon
 *
 * Server-render og første klient-render returnerer `false` for å unngå hydration mismatch;
 * verdien oppdateres etter mount. Unngå å bruke denne til synlig layout som endrer seg
 * merkbart etter paint (flash), med mindre det er akseptabelt.
 */
export function useIsNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(NARROW_SCREEN_MEDIA_QUERY)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return narrow
}

/** Matcher Tailwind `md:` (min 768px). Starter som `false` til etter mount slik at små skjermer ikke kort får desktop-tilstand. */
const MIN_MD_MEDIA_QUERY = '(min-width: 768px)'

/**
 * Klient-hook: `true` når viewport er minst `md` (768px).
 * Bruk f.eks. for HTML datalist som er tung/rotete på mobilnettlesere — da er `false` på små skjermer og ved første render.
 */
export function useIsMinMdScreen(): boolean {
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MIN_MD_MEDIA_QUERY)
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return wide
}
