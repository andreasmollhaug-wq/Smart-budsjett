/** Innlogging og registrering */
export const LOGIN_HREF = '/logg-inn'
export const REGISTER_HREF = '/registrer'

/** Primær CTA på landing (prøveperiode) */
export const CTA_HREF = '/registrer'

/** Dottir-konsept (internt · ikke lenket fra hovednav) */
export const DOTTIR_PREVIEW_HREF = '/preview/dottir'
export const DOTTIR_OM_OSS_HREF = `${DOTTIR_PREVIEW_HREF}/om-oss`

/**
 * Erstatter typisk `px-4 sm:px-6` på landingssider:
 * respekterer iOS/Android safe area (notch, hjem-indikator).
 */
export const landingHorizontalPadding =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]'
