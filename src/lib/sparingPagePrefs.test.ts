import { describe, expect, it } from 'vitest'
import {
  computeNextGoalSelectionForToggle,
  DEFAULT_SPARING_PAGE_PREFS,
  mergePatchIntoSparingPagePrefs,
  normalizeSparingPagePrefs,
} from './sparingPagePrefs'

describe('normalizeSparingPagePrefs', () => {
  it('bruker standardverdier når input mangler eller er ugyldig', () => {
    expect(normalizeSparingPagePrefs(undefined)).toEqual(DEFAULT_SPARING_PAGE_PREFS)
    expect(normalizeSparingPagePrefs(null)).toEqual(DEFAULT_SPARING_PAGE_PREFS)
    expect(normalizeSparingPagePrefs({})).toEqual(DEFAULT_SPARING_PAGE_PREFS)
    expect(normalizeSparingPagePrefs({ goalSortMode: 'not-a-mode' as never }).goalSortMode).toBe(
      'name_asc',
    )
  })

  it('bevarer gyldige sorteringsmoduser inkl. saved_asc og saved_desc', () => {
    expect(normalizeSparingPagePrefs({ goalSortMode: 'saved_desc' }).goalSortMode).toBe('saved_desc')
    expect(normalizeSparingPagePrefs({ goalSortMode: 'saved_asc' }).goalSortMode).toBe('saved_asc')
    expect(normalizeSparingPagePrefs({ goalSortMode: 'targetDate_asc' }).goalSortMode).toBe(
      'targetDate_asc',
    )
  })

  it('normaliserer goalSelection', () => {
    expect(normalizeSparingPagePrefs({ goalSelection: 'all' }).goalSelection).toBe('all')
    expect(normalizeSparingPagePrefs({ goalSelection: [' g1 ', 'g2'] }).goalSelection).toEqual([
      ' g1 ',
      'g2',
    ])
    expect(normalizeSparingPagePrefs({ goalSelection: [''] }).goalSelection).toBe('all')
    expect(normalizeSparingPagePrefs({ goalSelection: [] }).goalSelection).toBe('all')
  })
})

describe('mergePatchIntoSparingPagePrefs', () => {
  it('slår del-patch inn og normaliserer', () => {
    const merged = mergePatchIntoSparingPagePrefs(undefined, {
      goalSortMode: 'saved_desc',
      showCompletedGoals: false,
    })
    expect(merged.goalSortMode).toBe('saved_desc')
    expect(merged.showCompletedGoals).toBe(false)
    expect(merged.goalSelection).toBe('all')
  })
})

describe('computeNextGoalSelectionForToggle', () => {
  it('fra alle til subset eller alle', () => {
    expect(
      computeNextGoalSelectionForToggle('all', 'b', ['a', 'b', 'c']),
    ).toEqual(['a', 'c'])
    expect(computeNextGoalSelectionForToggle('all', 'a', ['a'])).toBe('all')
  })

  it('fra subset flip ett mål av/på', () => {
    expect(
      computeNextGoalSelectionForToggle(['a', 'c'], 'c', ['a', 'b', 'c']),
    ).toEqual(['a'])
  })
})
