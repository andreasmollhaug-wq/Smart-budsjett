import { describe, expect, it } from 'vitest'
import {
  hideFabUntilEnabled,
  hideFabUntilTomorrow,
  isDottirAiFabVisible,
  showFab,
  type DottirAiFabPrefs,
} from '@/lib/dottirAiFabPrefs'

describe('isDottirAiFabVisible', () => {
  it('shows by default', () => {
    expect(isDottirAiFabVisible({ hidden: false, hiddenUntil: null })).toBe(true)
  })

  it('hides when permanently hidden', () => {
    expect(isDottirAiFabVisible({ hidden: true, hiddenUntil: null })).toBe(false)
  })

  it('hides until date is today or later', () => {
    const prefs: DottirAiFabPrefs = { hidden: false, hiddenUntil: '2099-01-01' }
    expect(isDottirAiFabVisible(prefs, '2026-05-25')).toBe(false)
  })

  it('shows after hiddenUntil passed when not permanently hidden', () => {
    const prefs: DottirAiFabPrefs = { hidden: false, hiddenUntil: '2026-05-24' }
    expect(isDottirAiFabVisible(prefs, '2026-05-25')).toBe(true)
  })

  it('stays hidden after hiddenUntil if permanently hidden', () => {
    const prefs: DottirAiFabPrefs = { hidden: true, hiddenUntil: '2026-05-24' }
    expect(isDottirAiFabVisible(prefs, '2026-05-25')).toBe(false)
  })
})

describe('fab pref helpers', () => {
  it('hideFabUntilTomorrow sets hiddenUntil', () => {
    const prefs = hideFabUntilTomorrow()
    expect(prefs.hidden).toBe(false)
    expect(prefs.hiddenUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('hideFabUntilEnabled sets hidden', () => {
    expect(hideFabUntilEnabled()).toEqual({ hidden: true, hiddenUntil: null })
  })

  it('showFab clears both flags', () => {
    expect(showFab()).toEqual({ hidden: false, hiddenUntil: null })
  })
})
