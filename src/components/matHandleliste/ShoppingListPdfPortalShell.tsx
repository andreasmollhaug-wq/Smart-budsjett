'use client'

/**
 * Wrapper for html2canvas-fangst: unngå ekstreme negative `left`-verdier (kan gi tom canvas i Chromium)
 * og ikke bruk `opacity: 0` (kan påvirke raster). Flytt blokken ut av viewport med translate.
 */
export function ShoppingListPdfPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[2147483646] w-[210mm] max-w-[min(210mm,100vw)]"
      style={{ transform: 'translate3d(-110vw, 0, 0)' }}
      aria-hidden
    >
      {children}
    </div>
  )
}
