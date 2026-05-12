'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { applyUiPaletteToDocument } from '@/lib/uiColorPalette'

/**
 * Offentlige Dottir-marketing-ruter: premium «Sand» (varm lysflate, logo #004b6b).
 * Cleanup gjenoppretter innlogget brukers valgte uiColorPalette.
 */
export function ApplyMarketingSandPalette() {
  useEffect(() => {
    applyUiPaletteToDocument('sand')
    return () => {
      applyUiPaletteToDocument(useStore.getState().uiColorPalette)
    }
  }, [])

  return null
}
