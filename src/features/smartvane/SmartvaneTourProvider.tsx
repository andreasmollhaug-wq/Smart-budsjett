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
  SMARTVANE_BASIC_STEP_SELECTORS,
  SMARTVANE_EXTENDED_STEP_SELECTORS,
  SMARTVANE_TOUR_EXTENDED_STORAGE_KEY,
  SMARTVANE_TOUR_ROUTES,
  SMARTVANE_TOUR_STORAGE_KEY,
  type SmartvaneTourMode,
  pathMatchesSmartvaneTourStep,
} from '@/features/smartvane/smartvaneTourConstants'

type SmartvaneTourContextValue = {
  startTour: () => void
  startExtendedTour: () => void
}

const SmartvaneTourContext = createContext<SmartvaneTourContextValue | null>(null)

export function useSmartvaneTour() {
  const ctx = useContext(SmartvaneTourContext)
  if (!ctx) {
    throw new Error('useSmartvaneTour must be used under SmartvaneTourProvider')
  }
  return ctx
}

export function useSmartvaneTourOptional() {
  return useContext(SmartvaneTourContext)
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

function waitForElement(selector: string, maxAttempts = 60): Promise<Element | null> {
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

export default function SmartvaneTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? ''

  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const pendingStepIndexRef = useRef<number | null>(null)
  const awaitingEntryRef = useRef(false)
  const pipelineTourModeRef = useRef<SmartvaneTourMode>('basic')
  const activeTourKindRef = useRef<SmartvaneTourMode>('basic')
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
        ? SMARTVANE_TOUR_EXTENDED_STORAGE_KEY
        : SMARTVANE_TOUR_STORAGE_KEY
    try {
      localStorage.setItem(key, new Date().toISOString())
    } catch {
      /* ignore */
    }
  }, [])

  const buildBasicSteps = useCallback((): DriveStep[] => {
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
      side: 'top',
      align: 'start',
    }

    return [
      {
        element: SMARTVANE_BASIC_STEP_SELECTORS[0],
        popover: {
          ...basePopover,
          title: 'Velkommen til SmartVane',
          description:
            'Her bygger du små vaner over tid — daglige, ukentlige og månedlige. Alt lagres på kontoen din, og du krysser av etter hvert som du gjør dem.',
        },
      },
      {
        element: SMARTVANE_BASIC_STEP_SELECTORS[1],
        popover: {
          ...basePopover,
          title: 'Underfaner',
          description:
            '«I dag» er arbeidsflaten for avkrysning. «Måned» viser kalender og oversikt. «Innsikt» viser trender og streaks. «Start» er hjelp og denne gjennomgangen.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.today, 2)
          },
        },
      },
      {
        element: SMARTVANE_BASIC_STEP_SELECTORS[2],
        popover: {
          ...basePopover,
          title: 'I dag',
          description:
            'Full dato står øverst under SmartVane. Her har du motivasjonstekst og daglig mål. Kryss av daglige vaner med ett trykk.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.month, 3)
          },
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.start, 1)
          },
        },
      },
      {
        element: SMARTVANE_BASIC_STEP_SELECTORS[3],
        popover: {
          ...basePopover,
          title: 'Måned',
          description:
            'Bla mellom måneder med pilene. Se søylediagram og kalender-rutenett, juster «daglig mål» (hvor mange ulike daglige vaner du sikter mot per dag), og kopier vaner til neste måned når måneden snur.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.insights, 4)
          },
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.today, 2)
          },
        },
      },
      {
        element: SMARTVANE_BASIC_STEP_SELECTORS[4],
        popover: {
          ...basePopover,
          title: 'Innsikt',
          description:
            'Trend sammenligner siste sju dager med de sju før. Du får sterkeste og svakeste ukedag, streak per daglig vane, og toppliste — uten regneark.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.start, 5)
          },
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.month, 3)
          },
        },
      },
      {
        element: SMARTVANE_BASIC_STEP_SELECTORS[5],
        popover: {
          ...basePopover,
          title: 'Du er klar',
          description:
            'Gå til «I dag» for å legge inn vaner og kryss av. Kjør «Vis meg rundt» eller «Utvidet gjennomgang» herfra når som helst. Vaner du ikke rekker i dag — bare fortsett neste gang.',
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.insights, 4)
          },
        },
      },
    ]
  }, [destroyTourDriver, router])

  const buildExtendedSteps = useCallback((): DriveStep[] => {
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
      side: 'top',
      align: 'start',
    }

    const lastIx = SMARTVANE_EXTENDED_STEP_SELECTORS.length - 1

    return [
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[0],
        popover: {
          ...basePopover,
          title: 'Utvidet gjennomgang',
          description:
            'Nå går vi mer i detalj: typer vaner, ukentlige «uke-rader», månedlige to sporter, månedskalender, kopiering og alle innsikt-seksjonene.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[1],
        popover: {
          ...basePopover,
          title: 'Alltid tilgjengelig',
          description:
            'Fanene sitter under overskriften, som i Budsjett. Når du er ferdig med et steg, bruk «Neste»; «Tilbake» tar deg til forrige steg. Vi bytter skjerm for deg når det trengs.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.today, 2)
          },
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.start, 0)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[2],
        popover: {
          ...basePopover,
          title: 'Oversikt på I dag',
          description:
            'Motivasjonstekst og avkrysning. Bruk fanene under SmartVane for å hoppe mellom måned og innsikt med samme måned i URL.',
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.start, 1)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[3],
        popover: {
          ...basePopover,
          title: 'Daglige vaner',
          description:
            'Hver daglig vane kan krysses av én gang per dato. Valgfritt «mål dager i måneden» på vane-nivå (når du oppretter) er adskilt fra «daglig mål» på plan-nivå (antall ulike daglige vaner du sikter mot å fullføre samme dag).',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[4],
        popover: {
          ...basePopover,
          title: 'Ukentlige og månedlige',
          description:
            'Ukentlige vaner har én boks per uke-rad (uke 1 = dag 1–7, osv. i måneden). Månedlige har to spor — f.eks. to ganger per måned.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[5],
        popover: {
          ...basePopover,
          title: 'Legg til vane',
          description:
            'Velg type: Daglig, Ukentlig eller Månedlig. For daglig kan du sette valgfritt månedsmål (antall dager). Trykk Lagre — listen oppdateres.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.month, 6)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[6],
        popover: {
          ...basePopover,
          title: 'Månedsvelger',
          description:
            'Når måneden snur eller du vil navigere måneder på rad, bruk fanen «Måned» eller «Innsikt» — de husker måned fra URL eller fra forrige valg.',
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.today, 5)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[7],
        popover: {
          ...basePopover,
          title: 'Diagrammer',
          description:
            'Stolper viser fullføring per dag relativt til daglig mål på planen. Kaken summerer hvor stor andel av alle daglige «celler» i måneden som er krysset av.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[8],
        popover: {
          ...basePopover,
          title: 'Daglig mål og kopier',
          description:
            'Tallet «daglig mål» er maks antall ulike daglige vaner du ønsker å fullføre samme dag (standard 10). «Kopier vaner til neste måned» lager samme vaner i neste måned uten å flytte avkrysninger.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[9],
        popover: {
          ...basePopover,
          title: 'Rutenett for daglige',
          description:
            'Trykk en celle for å krysse av eller fjerne for den datoen — samme data som på «I dag», bare månedsvis.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[10],
        popover: {
          ...basePopover,
          title: 'Ukentlige i månedsvy',
          description:
            'Uke-knappene matcher samme uke-rader som på «I dag» når du står i riktig uke.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[11],
        popover: {
          ...basePopover,
          title: 'Månedlige spor',
          description:
            'Nummer 1 og 2 er to uavhengige avkrysninger i måneden — egnet til «to ganger i måneden»-vaner.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.insights, 12)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[12],
        popover: {
          ...basePopover,
          title: 'Trend og ukedager',
          description:
            'Sammenligner siste 7 dager i måneden mot de 7 forrige. Sterkeste og svakeste ukedag hjelper deg å planlegge — ikke å skamme deg.',
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.month, 11)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[13],
        popover: {
          ...basePopover,
          title: 'Streak per vane',
          description:
            'For hver daglig vane ser du pågående rekke innen valgt måned og lengste sammenhengende rekke på tvers av alle måneder (samme vannenavn, fra alle avkrysninger). Ingen data ennå — begynn med én avkrysning.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[14],
        popover: {
          ...basePopover,
          title: 'Toppliste',
          description:
            'Sortert etter hvor stor del av vane-målet (dager i måneden) du har nådd. Bruk det til å se hva som bærer mest frukt.',
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[15],
        popover: {
          ...basePopover,
          title: 'Oppsummering',
          description:
            'Telling av aktive vaner per type i valgt måned — nyttig når du har mange vaner og vil sjekke balansen.',
          onNextClick: () => {
            navNext(SMARTVANE_TOUR_ROUTES.start, lastIx)
          },
        },
      },
      {
        element: SMARTVANE_EXTENDED_STEP_SELECTORS[lastIx],
        popover: {
          ...basePopover,
          title: 'Da er du utrustet',
          description:
            'Du kjenner fanene, typene vaner, månedskalenderen, daglig mål, kopiering til neste måned og alle innsikt-feltene. Lykke til med vanene.',
          onPrevClick: () => {
            navPrev(SMARTVANE_TOUR_ROUTES.insights, 15)
          },
        },
      },
    ]
  }, [destroyTourDriver, router])

  const resumeDrive = useCallback(
    async (mode: SmartvaneTourMode, stepIndex: number) => {
      const selectors =
        mode === 'extended' ? SMARTVANE_EXTENDED_STEP_SELECTORS : SMARTVANE_BASIC_STEP_SELECTORS
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
      if (!pathMatchesSmartvaneTourStep(mode, pathname, pending)) return
      await resumeDrive(mode, pending)
      return
    }

    if (awaitingEntryRef.current && pathname === SMARTVANE_TOUR_ROUTES.start) {
      const mode = pipelineTourModeRef.current
      const firstSelector =
        mode === 'extended'
          ? SMARTVANE_EXTENDED_STEP_SELECTORS[0]!
          : SMARTVANE_BASIC_STEP_SELECTORS[0]!
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
    router.replace(SMARTVANE_TOUR_ROUTES.start)
    setTourKick((n) => n + 1)
  }, [destroyTourDriver, router])

  const startExtendedTour = useCallback(() => {
    destroyTourDriver()
    pendingStepIndexRef.current = null
    pipelineTourModeRef.current = 'extended'
    awaitingEntryRef.current = true
    router.replace(SMARTVANE_TOUR_ROUTES.start)
    setTourKick((n) => n + 1)
  }, [destroyTourDriver, router])

  const value = useMemo(
    () => ({ startTour, startExtendedTour }),
    [startExtendedTour, startTour],
  )

  return <SmartvaneTourContext.Provider value={value}>{children}</SmartvaneTourContext.Provider>
}
