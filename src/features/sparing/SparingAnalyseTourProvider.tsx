'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { driver, type Config } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  SPARING_ANALYSE_TOUR_STORAGE_KEY,
  buildSparingAnalyseTourSteps,
} from '@/features/sparing/sparingAnalyseTourConstants'

type SparingAnalyseTourContextValue = {
  startTour: () => void
}

const SparingAnalyseTourContext = createContext<SparingAnalyseTourContextValue | null>(null)

export function useSparingAnalyseTour() {
  const ctx = useContext(SparingAnalyseTourContext)
  if (!ctx) {
    throw new Error('useSparingAnalyseTour must be used under SparingAnalyseTourProvider')
  }
  return ctx
}

export function useSparingAnalyseTourOptional() {
  return useContext(SparingAnalyseTourContext)
}

function tourDriverBaseConfig(onDestroyed: NonNullable<Config['onDestroyed']>): Config {
  return {
    showProgress: true,
    progressText: '{{current}} av {{total}}',
    nextBtnText: 'Neste',
    prevBtnText: 'Tilbake',
    doneBtnText: 'Ferdig',
    allowClose: true,
    smoothScroll: true,
    stagePadding: 8,
    onDestroyed,
  }
}

function waitForElement(selector: string, maxAttempts = 80): Promise<Element | null> {
  return new Promise((resolve) => {
    let n = 0
    function tick() {
      const el = document.querySelector(selector)
      if (el) {
        resolve(el)
        return
      }
      n += 1
      if (n >= maxAttempts) {
        resolve(null)
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

type Props = {
  children: ReactNode
  hasGoals: boolean
  showHouseholdChart: boolean
}

export default function SparingAnalyseTourProvider({
  children,
  hasGoals,
  showHouseholdChart,
}: Props) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  const destroyTourDriver = useCallback(() => {
    const d = driverRef.current
    if (d?.isActive()) {
      d.destroy()
    }
    driverRef.current = null
  }, [])

  const onTourDestroyed = useCallback<NonNullable<Config['onDestroyed']>>((_el, step, ctx) => {
    const steps = ctx.config.steps ?? []
    const last = steps[steps.length - 1]
    if (!step || !last) return
    const a = typeof step.element === 'string' ? step.element : ''
    const b = typeof last.element === 'string' ? last.element : ''
    if (!a || a !== b) return
    try {
      localStorage.setItem(SPARING_ANALYSE_TOUR_STORAGE_KEY, new Date().toISOString())
    } catch {
      /* ignore */
    }
  }, [])

  const startTour = useCallback(async () => {
    destroyTourDriver()
    const steps = buildSparingAnalyseTourSteps({ hasGoals, showHouseholdChart })
    const firstSel =
      typeof steps[0]?.element === 'string' ? steps[0].element : null
    if (!firstSel) return

    const firstEl = await waitForElement(firstSel)
    if (!firstEl) return

    const drv = driver(tourDriverBaseConfig(onTourDestroyed))
    drv.setSteps(steps)
    driverRef.current = drv
    drv.drive(0)
  }, [destroyTourDriver, hasGoals, onTourDestroyed, showHouseholdChart])

  useEffect(() => {
    return () => {
      destroyTourDriver()
    }
  }, [destroyTourDriver])

  const value = useMemo(() => ({ startTour }), [startTour])

  return (
    <SparingAnalyseTourContext.Provider value={value}>{children}</SparingAnalyseTourContext.Provider>
  )
}
