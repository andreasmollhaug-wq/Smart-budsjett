import { smartvanePaths } from '@/features/smartvane/paths'

/** localStorage: kort tur fullført minst én gang. */
export const SMARTVANE_TOUR_STORAGE_KEY = 'sb_smartvane_tour_v1_completed'

/** localStorage: utvidet tur fullført minst én gang. */
export const SMARTVANE_TOUR_EXTENDED_STORAGE_KEY = 'sb_smartvane_tour_v1_extended_completed'

export const SMARTVANE_TOUR_SELECTORS = {
  startIntro: '[data-sv-tour="start-intro"]',
  /** Underfaner under overskriften (samme mønster som Budsjett). */
  sectionSubnav: '[data-sv-tour="smartvane-subnav"]',
  todayOverview: '[data-sv-tour="today-overview"]',
  monthOverview: '[data-sv-tour="month-overview"]',
  insightsOverview: '[data-sv-tour="insights-overview"]',
} as const

export const SMARTVANE_TOUR_EXTENDED_SELECTORS = {
  extIntro: '[data-sv-tour="ext-intro"]',
  todayDailySection: '[data-sv-tour="today-daily-section"]',
  todayNonDaily: '[data-sv-tour="today-non-daily"]',
  todayAddHabit: '[data-sv-tour="today-add-habit"]',
  monthNav: '[data-sv-tour="month-nav"]',
  monthCharts: '[data-sv-tour="month-charts"]',
  monthSettingsCopy: '[data-sv-tour="month-settings-copy"]',
  monthDailyGrid: '[data-sv-tour="month-daily-grid"]',
  monthWeeklyGrid: '[data-sv-tour="month-weekly-grid"]',
  monthMonthlySlots: '[data-sv-tour="month-monthly-slots"]',
  insightsTrend: '[data-sv-tour="insights-trend"]',
  insightsStreak: '[data-sv-tour="insights-streak"]',
  insightsTop: '[data-sv-tour="insights-top"]',
  insightsSummary: '[data-sv-tour="insights-summary"]',
  extDone: '[data-sv-tour="ext-done"]',
} as const

export type SmartvaneTourMode = 'basic' | 'extended'

/** Kort tur: Start → meny → I dag → Måned → Innsikt → oppsummering. */
export const SMARTVANE_BASIC_STEP_SELECTORS: readonly string[] = [
  SMARTVANE_TOUR_SELECTORS.startIntro,
  SMARTVANE_TOUR_SELECTORS.sectionSubnav,
  SMARTVANE_TOUR_SELECTORS.todayOverview,
  SMARTVANE_TOUR_SELECTORS.monthOverview,
  SMARTVANE_TOUR_SELECTORS.insightsOverview,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.extDone,
]

/** Utvidet: flere ankre per skjerm — rekkefølge må matche steg-indices i provider. */
export const SMARTVANE_EXTENDED_STEP_SELECTORS: readonly string[] = [
  SMARTVANE_TOUR_EXTENDED_SELECTORS.extIntro,
  SMARTVANE_TOUR_SELECTORS.sectionSubnav,
  SMARTVANE_TOUR_SELECTORS.todayOverview,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.todayDailySection,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.todayNonDaily,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.todayAddHabit,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.monthNav,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.monthCharts,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.monthSettingsCopy,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.monthDailyGrid,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.monthWeeklyGrid,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.monthMonthlySlots,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.insightsTrend,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.insightsStreak,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.insightsTop,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.insightsSummary,
  SMARTVANE_TOUR_EXTENDED_SELECTORS.extDone,
]

export const SMARTVANE_TOUR_ROUTES = {
  start: smartvanePaths.start,
  today: smartvanePaths.today,
  month: smartvanePaths.month,
  insights: smartvanePaths.insights,
} as const

function normalizedPath(pathname: string): string {
  const base = pathname.split('?')[0] ?? pathname
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1)
  return base
}

function isMonthPath(p: string): boolean {
  return p === SMARTVANE_TOUR_ROUTES.month || p.startsWith(`${SMARTVANE_TOUR_ROUTES.month}?`)
}

function isInsightsPath(p: string): boolean {
  return p === SMARTVANE_TOUR_ROUTES.insights || p.startsWith(`${SMARTVANE_TOUR_ROUTES.insights}?`)
}

/** Sikrer at vi er på riktig rute før et deferred steg kjøres. */
export function pathMatchesSmartvaneTourStep(
  mode: SmartvaneTourMode,
  pathname: string | null,
  stepIndex: number,
): boolean {
  if (!pathname) return false
  const p = normalizedPath(pathname)

  if (mode === 'basic') {
    switch (stepIndex) {
      case 0:
      case 1:
      case 5:
        return p === SMARTVANE_TOUR_ROUTES.start
      case 2:
        return p === SMARTVANE_TOUR_ROUTES.today
      case 3:
        return isMonthPath(p)
      case 4:
        return isInsightsPath(p)
      default:
        return false
    }
  }

  switch (stepIndex) {
    case 0:
    case 1:
    case 16:
      return p === SMARTVANE_TOUR_ROUTES.start
    case 2:
    case 3:
    case 4:
    case 5:
      return p === SMARTVANE_TOUR_ROUTES.today
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
      return isMonthPath(p)
    case 12:
    case 13:
    case 14:
    case 15:
      return isInsightsPath(p)
    default:
      return false
  }
}
