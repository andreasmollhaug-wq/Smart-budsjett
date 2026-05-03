/**
 * SmartVane innholdsbredder — bredere enn tidligere «alt i max-w-lg» for bedre bruk av skjermbredde.
 * Bunnpadding inkluderer safe area (hjem-indikator på mobil).
 */
export const smartvanePageInner =
  'mx-auto w-full min-w-0 max-w-5xl px-4 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 xl:px-10' as const

/** Måned: diagrammer + rutenett trenger litt mer horisontalt rom. */
export const smartvanePageInnerWide =
  'mx-auto w-full min-w-0 max-w-7xl px-4 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 xl:px-10' as const
