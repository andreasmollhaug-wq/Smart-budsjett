/** localStorage: bruker har fullført «Vis meg rundt» minst én gang (valgfritt brukt til fremtidig hint). */
export const MAT_HANDLELISTE_TOUR_STORAGE_KEY = 'sb_mat_handleliste_tour_v1_completed'

/** localStorage: «Utvidet gjennomgang» er fullført minst én gang. */
export const MAT_HANDLELISTE_TOUR_EXTENDED_STORAGE_KEY = 'sb_mat_handleliste_tour_v1_extended_completed'

export const MAT_HANDLELISTE_TOUR_SELECTORS = {
  startIntro: '[data-mh-tour="start-intro"]',
  subnav: '[data-mh-tour="subnav"]',
  mealsMain: '[data-mh-tour="meals-main"]',
  planMain: '[data-mh-tour="plan-main"]',
  listMain: '[data-mh-tour="list-main"]',
} as const

/** Ankre kun for «Utvidet gjennomgang» — rekkefølge må matche `MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS`. */
export const MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS = {
  extIntro: '[data-mh-tour="ext-intro"]',
  planWeekNav: '[data-mh-tour="plan-week-nav"]',
  planQuickActions: '[data-mh-tour="plan-quick-actions"]',
  planSettingsPanel: '[data-mh-tour="plan-settings-panel"]',
  planMonthOverview: '[data-mh-tour="plan-month-overview"]',
  listAddItem: '[data-mh-tour="list-add-item"]',
  mealsToolbar: '[data-mh-tour="meals-toolbar"]',
  extDone: '[data-mh-tour="ext-done"]',
} as const

export type MatHandlelisteTourMode = 'basic' | 'extended'

/** Korte omvisning: Start → meny → måltider → plan → handleliste. */
export const MAT_HANDLELISTE_BASIC_STEP_SELECTORS: readonly string[] = [
  MAT_HANDLELISTE_TOUR_SELECTORS.startIntro,
  MAT_HANDLELISTE_TOUR_SELECTORS.subnav,
  MAT_HANDLELISTE_TOUR_SELECTORS.mealsMain,
  MAT_HANDLELISTE_TOUR_SELECTORS.planMain,
  MAT_HANDLELISTE_TOUR_SELECTORS.listMain,
]

/** Rekkefølge for utvidet tur (samme rekkefølge som driver-steg-indices). */
export const MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS: readonly string[] = [
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.extIntro,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.planWeekNav,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.planQuickActions,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.planSettingsPanel,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.planMonthOverview,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.listAddItem,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.mealsToolbar,
  MAT_HANDLELISTE_TOUR_EXTENDED_SELECTORS.extDone,
]

export const MAT_BASIC_TOUR_STEP_COUNT = MAT_HANDLELISTE_BASIC_STEP_SELECTORS.length

export const MAT_EXTENDED_TOUR_STEP_COUNT = MAT_HANDLELISTE_EXTENDED_STEP_SELECTORS.length

export const MAT_HANDLELISTE_TOUR_ROUTES = {
  start: '/intern/mat-handleliste/start',
  maltider: '/intern/mat-handleliste/maltider',
  plan: '/intern/mat-handleliste/plan',
  planMonth: '/intern/mat-handleliste/plan/maned',
  handleliste: '/intern/mat-handleliste/handleliste',
} as const

function normalizedPath(pathname: string): string {
  const base = pathname.split('?')[0] ?? pathname
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1)
  return base
}

/** Sjekk at vi er på riktig rute før et steg highlights (basic eller utvidet). */
export function pathMatchesMatHandlelisteTourStep(
  mode: MatHandlelisteTourMode,
  pathname: string | null,
  stepIndex: number,
): boolean {
  if (!pathname) return false
  const p = normalizedPath(pathname)

  if (mode === 'basic') {
    switch (stepIndex) {
      case 0:
        return p === MAT_HANDLELISTE_TOUR_ROUTES.start
      case 1:
        return p.startsWith('/intern/mat-handleliste')
      case 2:
        return p === MAT_HANDLELISTE_TOUR_ROUTES.maltider || p.startsWith(`${MAT_HANDLELISTE_TOUR_ROUTES.maltider}/`)
      case 3:
        return p.startsWith('/intern/mat-handleliste/plan')
      case 4:
        return (
          p === MAT_HANDLELISTE_TOUR_ROUTES.handleliste ||
          p.startsWith(`${MAT_HANDLELISTE_TOUR_ROUTES.handleliste}/`)
        )
      default:
        return false
    }
  }

  switch (stepIndex) {
    case 0:
    case 7:
      return p === MAT_HANDLELISTE_TOUR_ROUTES.start
    case 1:
    case 2:
    case 3:
      return p === MAT_HANDLELISTE_TOUR_ROUTES.plan
    case 4:
      return p === MAT_HANDLELISTE_TOUR_ROUTES.planMonth
    case 5:
      return (
        p === MAT_HANDLELISTE_TOUR_ROUTES.handleliste || p.startsWith(`${MAT_HANDLELISTE_TOUR_ROUTES.handleliste}/`)
      )
    case 6:
      return p === MAT_HANDLELISTE_TOUR_ROUTES.maltider || p.startsWith(`${MAT_HANDLELISTE_TOUR_ROUTES.maltider}/`)
    default:
      return false
  }
}
