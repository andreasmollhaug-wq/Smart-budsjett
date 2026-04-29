import type { DriveStep } from 'driver.js'

/** localStorage: «Vis meg rundt» fullført minst én gang på sparing/analyse. */
export const SPARING_ANALYSE_TOUR_STORAGE_KEY = 'sb_sparing_analyse_tour_v1_completed'

/** Anker på `/sparing/analyse` — prefiks `sa` (sparing analyse), ikke brukt på mat-handleliste. */
export const SPARING_ANALYSE_TOUR_SELECTORS = {
  subnav: '[data-sa-tour="subnav"]',
  periodToolbar: '[data-sa-tour="period-toolbar"]',
  includeCompleted: '[data-sa-tour="include-completed"]',
  introCopy: '[data-sa-tour="intro-copy"]',
  kpiGrid: '[data-sa-tour="kpi-grid"]',
  monthlyActivity: '[data-sa-tour="monthly-activity"]',
  goalDistribution: '[data-sa-tour="goal-distribution"]',
  householdChart: '[data-sa-tour="household-chart"]',
  householdPace: '[data-sa-tour="household-pace"]',
  emptyGoals: '[data-sa-tour="empty-goals"]',
} as const

type TourOpts = {
  hasGoals: boolean
  showHouseholdChart: boolean
}

const basePopover: Partial<NonNullable<DriveStep['popover']>> = {
  side: 'bottom',
  align: 'start',
}

/** Brukes i vitest — må matche logikk i {@link buildSparingAnalyseTourSteps}. */
export function countAnalyseTourSteps(opts: TourOpts): number {
  if (!opts.hasGoals) return 5
  let n = 9
  if (opts.showHouseholdChart) n += 1
  return n
}

export function buildSparingAnalyseTourSteps(opts: TourOpts): DriveStep[] {
  const S = SPARING_ANALYSE_TOUR_SELECTORS

  const sharedIntro: DriveStep[] = [
    {
      element: S.subnav,
      popover: {
        ...basePopover,
        title: 'Faner under Sparing',
        description:
          'Her er du på Analyse. Fanen Sparing er målene dine, SmartSpare er planlagte tilføringer, og Formuebygger er en egen simulator.',
      },
    },
    {
      element: S.periodToolbar,
      popover: {
        ...basePopover,
        title: 'År og periode',
        description:
          'Velg budsjettår og hvilket tidsrom tallene gjelder for — for eksempel hittil i år, én måned eller hele året.',
      },
    },
    {
      element: S.includeCompleted,
      popover: {
        ...basePopover,
        title: 'Fullførte mål',
        description:
          'Slå på for å ta med mål som allerede er nådd. Av gir kun mål som fortsatt har gjenværende mot målsum.',
      },
    },
    {
      element: S.introCopy,
      popover: {
        ...basePopover,
        title: 'To typer tall på siden',
        description:
          'KPI og kakediagram bruker effektiv sparing på målene (som på sparemål-kortene). Stolpediagrammet viser registrerte transaksjoner og innskudd i perioden — ikke komplett banksaldo.',
      },
    },
  ]

  if (!opts.hasGoals) {
    return [
      ...sharedIntro,
      {
        element: S.emptyGoals,
        popover: {
          ...basePopover,
          title: 'Legg til mål for mer analyse',
          description:
            'Når du har sparemål med måldato, får du KPI, grafer og sparetempo her. Opprett mål under fanen Sparing.',
        },
      },
    ]
  }

  const withGoals: DriveStep[] = [
    ...sharedIntro,
    {
      element: S.kpiGrid,
      popover: {
        ...basePopover,
        title: 'Effektiv sparing og mål',
        description:
          'Disse kortene summerer fremgang, gjenstår og antall mål — samme logikk som på sparemål-listen. Trykk på et kort for lengre forklaring.',
      },
    },
    {
      element: S.kpiGrid,
      popover: {
        ...basePopover,
        title: 'Aktivitet og sparekrav',
        description:
          '«Aktivitet i perioden» er registrerte beløp i valgte måneder. «Månedlig sparekrav» er summert lineært tempo mot måldato for mål med aktiv plan.',
      },
    },
    {
      element: S.monthlyActivity,
      popover: {
        ...basePopover,
        title: 'Sparingaktivitet per måned',
        description:
          'Stolpediagrammet viser transaksjoner til koblede sparekategorier og manuelle innskudd per måned i den perioden du har valgt.',
      },
    },
    {
      element: S.goalDistribution,
      popover: {
        ...basePopover,
        title: 'Fordeling mellom mål',
        description:
          'Se hvordan effektiv sparing fordeles mellom målene — samme tall som på sparemål-kortene.',
      },
    },
  ]

  if (opts.showHouseholdChart) {
    withGoals.push({
      element: S.householdChart,
      popover: {
        ...basePopover,
        title: 'Fordeling i husholdningen',
        description:
          'Ved husholdningsvisning kan du se effektiv sparing fordelt på kildeprofil — samme måldata som når du bytter profil.',
      },
    })
  }

  withGoals.push({
    element: S.householdPace,
    popover: {
      ...basePopover,
      title: 'Sparetempo mot måldato',
      description:
        'Her ser du krav per uke og måned mot måldato per profil, og kan åpne detaljer per mål. Du kan starte denne omvisningen på nytt når som helst.',
    },
  })

  return withGoals
}
