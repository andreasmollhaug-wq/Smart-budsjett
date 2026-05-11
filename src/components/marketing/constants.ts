export { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

/** Primær merke-SVG (kvadrat / vertikal – navigasjon og felles bruk). */
export const BRAND_LOGO_SVG_SRC = '/marketing/Logo%20v02_vertikal.svg'
/** Horisontalt ordmerke ved behov (landing-variant, eldre eksport). */
export const BRAND_LOGO_WORDMARK_SVG_SRC = '/marketing/Logo%20v01_SVG.svg'
export const BRAND_LOGO_PNG_SRC = '/marketing/Logo%20v01.png'

/** Innlogging og registrering */
export const LOGIN_HREF = '/logg-inn'
export const REGISTER_HREF = '/registrer'

/** Primær CTA på landing (prøveperiode) */
export const CTA_HREF = '/registrer'

/** Offentlig Dottir-forside (rot) og støttesider — eldre /dottir-* viderekobles i next.config. */
export const DOTTIR_HOME_HREF = '/'
export const DOTTIR_OM_OSS_HREF = '/om-oss'
export const DOTTIR_UTFORSK_HREF = '/utforsk'

/**
 * Erstatter typisk `px-4 sm:px-6` på landingssider:
 * respekterer iOS/Android safe area (notch, hjem-indikator).
 */
export const landingHorizontalPadding =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]'
