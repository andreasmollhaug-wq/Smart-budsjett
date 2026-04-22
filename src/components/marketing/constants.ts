/** Innlogging og registrering */
export const LOGIN_HREF = '/logg-inn'
export const REGISTER_HREF = '/registrer'

/** Primær CTA på landing (prøveperiode) */
export const CTA_HREF = '/registrer'

/**
 * Erstatter typisk `px-4 sm:px-6` på landingssider:
 * respekterer iOS/Android safe area (notch, hjem-indikator).
 */
export const landingHorizontalPadding =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]'
