'use client'

import { useCallback, useRef } from 'react'

/**
 * Unngår uønsket lukk når bruker f.eks. markerer beløp (mousedown inne i feltet)
 * og slipper `mouseup` over det dimmede bakteppet: da kan `click` feilaktig treffe overlay.
 * Løsning: lukk bare når både `pointerdown` og `click` svarer til rettet trykk *på* selve
 * bakteppet (`e.target === e.currentTarget` på hver av dem i den rekkefølgen).
 */
export function useModalBackdropDismiss(onClose: () => void) {
  const downOnBackdrop = useRef(false)

  const onPointerDown: React.PointerEventHandler = useCallback((e) => {
    if (e.button !== 0) return
    downOnBackdrop.current = e.target === e.currentTarget
  }, [])

  const onClick: React.MouseEventHandler = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return
      if (!downOnBackdrop.current) return
      downOnBackdrop.current = false
      onClose()
    },
    [onClose],
  )

  const onPointerCancel: React.PointerEventHandler = useCallback(() => {
    downOnBackdrop.current = false
  }, [])

  return { onPointerDown, onClick, onPointerCancel }
}
