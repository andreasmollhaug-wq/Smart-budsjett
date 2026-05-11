import { BRAND_LOGO_SVG_SRC } from '@/components/marketing/constants'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

const SIZE_CLASS = {
  sm: 'h-10',
  md: 'h-11',
  lg: 'h-12',
  xl: 'h-14',
} as const

export type BrandLogoMarkSize = keyof typeof SIZE_CLASS

type Props = {
  size?: BrandLogoMarkSize
  className?: string
  /** Overstyr standard høyde (f.eks. utskrift `h-11`). */
  heightClass?: string
  fetchPriority?: 'high' | 'low' | 'auto'
  /**
   * Tom streng når overordnet lenke/knapp allerede beskriver destinasjonen
   * (skjermleser unngår dobbelt produktnavn).
   */
  alt?: string
}

/**
 * Merke (SVG fra `public/marketing`) — kvadrat/vertikal eller annet motiv; skalerer med `h-*` og `w-auto`.
 */
export default function BrandLogoMark({
  size = 'sm',
  className = '',
  heightClass,
  fetchPriority,
  alt = PRODUCT_DISPLAY_NAME,
}: Props) {
  const hCls = heightClass ?? SIZE_CLASS[size]
  return (
    // eslint-disable-next-line @next/next/no-img-element -- statisk merke-SVG, skaleres med CSS
    <img
      src={BRAND_LOGO_SVG_SRC}
      alt={alt}
      decoding="async"
      fetchPriority={fetchPriority}
      className={`${hCls} w-auto max-w-none shrink-0 object-contain object-center ${className}`.trim()}
    />
  )
}
