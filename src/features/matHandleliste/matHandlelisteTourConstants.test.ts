import { describe, expect, it } from 'vitest'
import {
  MAT_HANDLELISTE_TOUR_ROUTES,
  MAT_BASIC_TOUR_STEP_COUNT,
  MAT_EXTENDED_TOUR_STEP_COUNT,
  pathMatchesMatHandlelisteTourStep,
} from '@/features/matHandleliste/matHandlelisteTourConstants'

describe('pathMatchesMatHandlelisteTourStep', () => {
  it('basic: dekkplan ruter for fem steg', () => {
    expect(pathMatchesMatHandlelisteTourStep('basic', MAT_HANDLELISTE_TOUR_ROUTES.start, 0)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('basic', '/intern/mat-handleliste/handleliste', 1)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('basic', MAT_HANDLELISTE_TOUR_ROUTES.maltider, 2)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('basic', MAT_HANDLELISTE_TOUR_ROUTES.plan, 3)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('basic', MAT_HANDLELISTE_TOUR_ROUTES.handleliste, 4)).toBe(true)
  })

  it('extended: ukesplan ikke måned ved steg 1–3', () => {
    expect(pathMatchesMatHandlelisteTourStep('extended', MAT_HANDLELISTE_TOUR_ROUTES.plan, 3)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('extended', MAT_HANDLELISTE_TOUR_ROUTES.planMonth, 3)).toBe(false)
  })

  it('extended: steg 4 er kun månedsside', () => {
    expect(pathMatchesMatHandlelisteTourStep('extended', MAT_HANDLELISTE_TOUR_ROUTES.planMonth, 4)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('extended', MAT_HANDLELISTE_TOUR_ROUTES.plan, 4)).toBe(false)
  })

  it('extended: steg 0 og 7 begge på Start', () => {
    expect(pathMatchesMatHandlelisteTourStep('extended', MAT_HANDLELISTE_TOUR_ROUTES.start, 0)).toBe(true)
    expect(pathMatchesMatHandlelisteTourStep('extended', MAT_HANDLELISTE_TOUR_ROUTES.start, 7)).toBe(true)
  })

  it('steg-antall matcher selector-lister', () => {
    expect(MAT_BASIC_TOUR_STEP_COUNT).toBe(5)
    expect(MAT_EXTENDED_TOUR_STEP_COUNT).toBe(8)
  })
})
