'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { driver, type Config, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  MAT_HANDLELISTE_BASIC_STEP_SELECTORS,
  MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS,
  MAT_HANDLELISTE_TOUR_EXTENDED_STORAGE_KEY,
  MAT_HANDLELISTE_TOUR_ROUTES,
  MAT_HANDLELISTE_TOUR_STORAGE_KEY,
  type MatHandlelisteTourMode,
  pathMatchesMatHandlelisteTourStep,
} from '@/features/matHandleliste/matHandlelisteTourConstants'

type MatHandlelisteTourContextValue = {
  startTour: () => void
  startExtendedTour: () => void
}

const MatHandlelisteTourContext = createContext<MatHandlelisteTourContextValue | null>(null)

export function useMatHandlelisteTour() {
  const ctx = useContext(MatHandlelisteTourContext)
  if (!ctx) {
    throw new Error('useMatHandlelisteTour must be used under MatHandlelisteTourProvider')
  }
  return ctx
}

/** Trygg i header før provider mangler — returner null. */
export function useMatHandlelisteTourOptional() {
  return useContext(MatHandlelisteTourContext)
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

function waitForElement(selector: string, maxAttempts = 50): Promise<Element | null> {
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

export default function MatHandlelisteTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''

  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const pendingStepIndexRef = useRef<number | null>(null)
  const awaitingEntryRef = useRef(false)
  /** Modus fra brukeren startet tur til den fullførte eller ødelegges. */
  const pipelineTourModeRef = useRef<MatHandlelisteTourMode>('basic')

  /** driver.onDestroyed må vite om utvidet for localStorage-key. Alltid synk med pipeline før drive(). */
  const activeTourKindRef = useRef<MatHandlelisteTourMode>('basic')
  /** Tvinger runPendingOrEntry når startTour kalles fra /start (samme rute → pathname endrer seg ikke). */
  const [tourKick, setTourKick] = useState(0)

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
    const key =
      activeTourKindRef.current === 'extended'
        ? MAT_HANDLELISTE_TOUR_EXTENDED_STORAGE_KEY
        : MAT_HANDLELISTE_TOUR_STORAGE_KEY
    try {
      localStorage.setItem(key, new Date().toISOString())
    } catch {
      /* ignore */
    }
  }, [])

  const buildBasicSteps = useCallback((): DriveStep[] => {
    const selectors = MAT_HANDLELISTE_BASIC_STEP_SELECTORS
    function navNext(route: string, toStepIndex: number) {
      destroyTourDriver()
      pendingStepIndexRef.current = toStepIndex
      router.push(route)
    }

    function navPrev(route: string, toStepIndex: number) {
      destroyTourDriver()
      pendingStepIndexRef.current = toStepIndex
      router.push(route)
    }

    const basePopover: Partial<NonNullable<DriveStep['popover']>> = {
      side: 'bottom',
      align: 'start',
    }

    return [
      {
        element: selectors[0],
        popover: {
          ...basePopover,
          title: 'Velkommen til mat og handleliste',
          description:
            'Her kobler du måltider, plan og handleliste — slik at du handler det du faktisk skal bruke, gruppert som i butikken.',
        },
      },
      {
        element: selectors[1],
        popover: {
          ...basePopover,
          title: 'Finn fram i menyen',
          description:
            'Bruk fanene Start, Handleliste, Måltider og Plan. Du kan alltid hoppe mellom dem med navigasjonen under.',
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.maltider, 2)
          },
        },
      },
      {
        element: selectors[2],
        popover: {
          ...basePopover,
          title: 'Bygg måltider',
          description:
            'Lag egne måltider med ingredienser og porsjoner. De brukes i planen og samles til én felles handleliste.',
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.plan, 3)
          },
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.start, 1)
          },
        },
      },
      {
        element: selectors[3],
        popover: {
          ...basePopover,
          title: 'Planlegg uken',
          description:
            'Legg måltider i uke- eller månedsplan. Herfra kan du legge hele uken på handlelisten eller eksportere til PDF.',
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.handleliste, 4)
          },
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.maltider, 2)
          },
        },
      },
      {
        element: selectors[4],
        popover: {
          ...basePopover,
          title: 'Handlelisten',
          description:
            'Varer grupperes etter kategori. Kryss av underveis og bruk utskrift eller PDF når du vil — familie og HjemFlyt henter på samme data.',
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.plan, 3)
          },
        },
      },
    ]
  }, [destroyTourDriver, router])

  const buildExtendedSteps = useCallback((): DriveStep[] => {
    const selectors = MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS
    function navNext(route: string, toStepIndex: number) {
      destroyTourDriver()
      pendingStepIndexRef.current = toStepIndex
      router.push(route)
    }

    function navPrev(route: string, toStepIndex: number) {
      destroyTourDriver()
      pendingStepIndexRef.current = toStepIndex
      router.push(route)
    }

    const basePopover: Partial<NonNullable<DriveStep['popover']>> = {
      side: 'bottom',
      align: 'start',
    }

    const lastIx = selectors.length - 1

    return [
      {
        element: selectors[0],
        popover: {
          ...basePopover,
          title: 'Utvidet gjennomgang',
          description:
            'Nå tar vi litt mer tid på detaljer: uke versus måned, hurtighandlinger på plan-siden og hvordan du fyller opp handlelisten.',
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.plan, 1)
          },
        },
      },
      {
        element: selectors[1],
        popover: {
          ...basePopover,
          title: 'Uke og måned',
          description:
            'Bruk pilene for å bla mellom uker. «Måned» åpner hele måneden på én gang som gir oversikt ved lang planlegging.',
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.start, 0)
          },
        },
      },
      {
        element: selectors[2],
        popover: {
          ...basePopover,
          title: 'Handlinger fra plansiden',
          description:
            '«Legg hele uken på handleliste» samler ingrediensene på én gang. «Nytt måltid» lager måltider som du straks trekker inn i rutene. PDF passer når dere vil ta plan eller liste med ut på papir.',
        },
      },
      {
        element: selectors[3],
        popover: {
          ...basePopover,
          title: 'Planinnstillinger',
          description:
            'Åpne panelet og finjuster hvilke tidsrom synes i rutene og om du vil se rutenett eller liste på liten skjerm.',
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.planMonth, 4)
          },
        },
      },
      {
        element: selectors[4],
        popover: {
          ...basePopover,
          title: 'Månedsoversikt',
          description:
            'Kalenderen viser måltidsflyten måned for måned. Du kan også legge hele måneden på handlelisten eller hoppe tilbake til ukevisning.',
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.plan, 3)
          },
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.handleliste, 5)
          },
        },
      },
      {
        element: selectors[5],
        popover: {
          ...basePopover,
          title: 'Legge til egne varer',
          description:
            'Bruk «Legg til vare» når du må ha med noe som ikke kommer automatisk fra planen eller måltider — typisk ekstra eller kiosk.',
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.planMonth, 4)
          },
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.maltider, 6)
          },
        },
      },
      {
        element: selectors[6],
        popover: {
          ...basePopover,
          title: 'Måltider i praksis',
          description:
            'Lag nye måltider, og bruk «Søk og filter» når dere har flere profiler eller mange lagrede måltider. Handlekurv-ikonet på en rad legger måltidet på handlelisten.',
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.handleliste, 5)
          },
          onNextClick: () => {
            navNext(MAT_HANDLELISTE_TOUR_ROUTES.start, lastIx)
          },
        },
      },
      {
        element: selectors[7],
        popover: {
          ...basePopover,
          title: 'Du er klar',
          description:
            'Du vet nå hvordan du blar uke og måned, henter måltidsplan ned på handleliste, åpner planinnstillinger, legger egne varer og finner igjen måltider i kokken. Du kan starte denne gjennomgangen på nytt når som helst fra Start.',
          onPrevClick: () => {
            navPrev(MAT_HANDLELISTE_TOUR_ROUTES.maltider, 6)
          },
        },
      },
    ]
  }, [destroyTourDriver, router])

  const resumeDrive = useCallback(
    async (mode: MatHandlelisteTourMode, stepIndex: number) => {
      const selectors =
        mode === 'extended' ? MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS : MAT_HANDLELISTE_BASIC_STEP_SELECTORS
      const selector = selectors[stepIndex]!
      const el = await waitForElement(selector)
      if (!el) {
        pendingStepIndexRef.current = null
        return
      }
      const steps = mode === 'extended' ? buildExtendedSteps() : buildBasicSteps()
      activeTourKindRef.current = mode
      const drv = driver(tourDriverBaseConfig(onTourDestroyed))
      drv.setSteps(steps)
      driverRef.current = drv
      pendingStepIndexRef.current = null
      drv.drive(stepIndex)
    },
    [buildBasicSteps, buildExtendedSteps, onTourDestroyed],
  )

  const runPendingOrEntry = useCallback(async () => {
    if (driverRef.current?.isActive()) {
      return
    }

    const pending = pendingStepIndexRef.current
    if (pending !== null) {
      const mode = pipelineTourModeRef.current
      if (!pathMatchesMatHandlelisteTourStep(mode, pathname, pending)) return
      await resumeDrive(mode, pending)
      return
    }

    if (awaitingEntryRef.current && pathname === MAT_HANDLELISTE_TOUR_ROUTES.start) {
      const mode = pipelineTourModeRef.current
      const firstSelector =
        mode === 'extended' ? MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS[0]! : MAT_HANDLELISTE_BASIC_STEP_SELECTORS[0]!
      const el = await waitForElement(firstSelector)
      if (!el) return
      awaitingEntryRef.current = false
      await resumeDrive(mode, 0)
    }
  }, [pathname, resumeDrive])

  useEffect(() => {
    void runPendingOrEntry()
  }, [runPendingOrEntry, tourKick])

  useEffect(() => {
    return () => {
      destroyTourDriver()
    }
  }, [destroyTourDriver])

  const startTour = useCallback(() => {
    destroyTourDriver()
    pendingStepIndexRef.current = null
    pipelineTourModeRef.current = 'basic'
    awaitingEntryRef.current = true
    router.replace(MAT_HANDLELISTE_TOUR_ROUTES.start)
    setTourKick((n) => n + 1)
  }, [destroyTourDriver, router])

  const startExtendedTour = useCallback(() => {
    destroyTourDriver()
    pendingStepIndexRef.current = null
    pipelineTourModeRef.current = 'extended'
    awaitingEntryRef.current = true
    router.replace(MAT_HANDLELISTE_TOUR_ROUTES.start)
    setTourKick((n) => n + 1)
  }, [destroyTourDriver, router])

  const value = useMemo(
    () => ({ startTour, startExtendedTour }),
    [startExtendedTour, startTour],
  )

  return <MatHandlelisteTourContext.Provider value={value}>{children}</MatHandlelisteTourContext.Provider>
}
