import { BRAND_LOGO_SVG_SRC } from '@/components/marketing/constants'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

const SIZE_CLASS = { sm: 'h-9', md: 'h-10', lg: 'h-12' } as const

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
 * Merkeikon (SVG fra `public/marketing`) — skalerer proporsjonalt (`w-auto`).
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
    // MerkesVG fra `/public` — `<Image>` optimaliserer ikke SVG; unngår ekstra config.
    // eslint-disable-next-line @next/next/no-img-element -- statisk merke-SVG, skaleres med CSS
    <img
      src={BRAND_LOGO_SVG_SRC}
      alt={alt}
      decoding="async"
      fetchPriority={fetchPriority}
      className={`${hCls} w-auto max-w-none shrink-0 object-contain object-left ${className}`.trim()}
    />
  )
}
