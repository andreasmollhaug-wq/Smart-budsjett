import { describe, expect, it } from 'vitest'
import { SIDEBAR_NAV } from '@/lib/sidebarNav'
import {
  DOTTIR_SHOWCASE_CATEGORIES,
  DOTTIR_SHOWCASE_MODULES,
} from './dottirModuleShowcaseData'

const VALID_CATEGORY_IDS = new Set(DOTTIR_SHOWCASE_CATEGORIES.map((c) => c.id))

describe('dottirModuleShowcaseData', () => {
  it('har kopitekst for hver modul i sidemenyen (ingen tom /utforsk-krasj)', () => {
    expect(DOTTIR_SHOWCASE_MODULES).toHaveLength(SIDEBAR_NAV.length)

    const showcasedHrefs = new Set(DOTTIR_SHOWCASE_MODULES.map((m) => m.href))
    for (const item of SIDEBAR_NAV) {
      expect(showcasedHrefs.has(item.href)).toBe(true)
    }
  })

  it('bruker kun gyldige kategorier og har fylt ut all kopitekst', () => {
    for (const showcase of DOTTIR_SHOWCASE_MODULES) {
      expect(VALID_CATEGORY_IDS.has(showcase.category)).toBe(true)
      expect(showcase.hook.length).toBeGreaterThan(0)
      expect(showcase.what.length).toBeGreaterThan(0)
      expect(showcase.when.length).toBeGreaterThan(0)
      expect(showcase.outcome.length).toBeGreaterThan(0)
    }
  })
})
