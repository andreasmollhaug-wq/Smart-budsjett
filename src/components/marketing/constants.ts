/** Innlogging og registrering */
export const LOGIN_HREF = '/logg-inn'
export const REGISTER_HREF = '/registrer'

/** Primær CTA på landing (prøveperiode) */
export const CTA_HREF = '/registrer'

/** Dottir landing på /dottir. Metadata har noindex til merket lanseres — se app/dottir. */
export const DOTTIR_HOME_HREF = '/dottir'
export const DOTTIR_OM_OSS_HREF = `${DOTTIR_HOME_HREF}/om-oss`

/** Merkevarefiler i `public/marketing/` */
export const DOTTIR_ICON_SRC = '/marketing/dottir-icon-blue_Icon.svg'
export const DOTTIR_LOGO_SRC = '/marketing/dottir-logo-transparent_logo.svg'

/**
 * Erstatter typisk `px-4 sm:px-6` på landingssider:
 * respekterer iOS/Android safe area (notch, hjem-indikator).
 */
export const landingHorizontalPadding =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]'
