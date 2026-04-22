'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { landingHorizontalPadding } from './constants'

type PreviewImage = {
  src: string
  alt: string
  /** Pikselbredde/høyde fra kildefilen — sikrer riktig sideforhold og skarpere Next/Image. */
  intrinsicWidth?: number
  intrinsicHeight?: number
}

type ShotConfig = {
  id: string
  label: string
  images: PreviewImage[]
  /** Flere bilder: `horizontal` = bla til siden, `vertical` = scroll ned (standard). */
  galleryLayout?: 'vertical' | 'horizontal'
}

/** Flere oppføringer i `images`: vertikal liste eller horisontalt galleri (se `galleryLayout`). */
const SHOTS: ShotConfig[] = [
  {
    id: 'oversikt',
    label: 'Oversikt',
    galleryLayout: 'horizontal',
    images: [
      {
        src: '/marketing/oversikt%20alt%201.png',
        alt: 'Oversikt i Smart Budsjett — visning 1 av 3.',
        intrinsicWidth: 1905,
        intrinsicHeight: 823,
      },
      {
        src: '/marketing/oversikt%20alt%202.png',
        alt: 'Oversikt i Smart Budsjett — visning 2 av 3.',
        intrinsicWidth: 1662,
        intrinsicHeight: 720,
      },
      {
        src: '/marketing/oversikt%20alt%203.png',
        alt: 'Oversikt i Smart Budsjett — visning 3 av 3.',
        intrinsicWidth: 1678,
        intrinsicHeight: 886,
      },
    ],
  },
  {
    id: 'budsjett',
    label: 'Budsjett',
    galleryLayout: 'horizontal',
    images: [
      {
        src: '/marketing/Budsjett%20alt%201.png',
        alt: 'Budsjett i Smart Budsjett — visning 1 av 4.',
        intrinsicWidth: 1911,
        intrinsicHeight: 942,
      },
      {
        src: '/marketing/Budsjett%20alt%202.png',
        alt: 'Budsjett i Smart Budsjett — visning 2 av 4.',
        intrinsicWidth: 1691,
        intrinsicHeight: 901,
      },
      {
        src: '/marketing/Budsjett%20alt%203.png',
        alt: 'Budsjett i Smart Budsjett — visning 3 av 4.',
        intrinsicWidth: 1889,
        intrinsicHeight: 899,
      },
      {
        src: '/marketing/Budsjett%20alt%204.png',
        alt: 'Budsjett i Smart Budsjett — visning 4 av 4.',
        intrinsicWidth: 1559,
        intrinsicHeight: 954,
      },
    ],
  },
  {
    id: 'transaksjoner',
    label: 'Transaksjoner',
    galleryLayout: 'horizontal',
    images: [
      {
        src: '/marketing/Transaksjoner%20alt%201.png',
        alt: 'Transaksjoner i Smart Budsjett — visning 1 av 3.',
        intrinsicWidth: 1892,
        intrinsicHeight: 946,
      },
      {
        src: '/marketing/Transaksjoner%20alt%202.png',
        alt: 'Transaksjoner i Smart Budsjett — visning 2 av 3.',
        intrinsicWidth: 1654,
        intrinsicHeight: 580,
      },
      {
        src: '/marketing/Transaksjoner%20alt%203.png',
        alt: 'Transaksjoner i Smart Budsjett — visning 3 av 3.',
        intrinsicWidth: 1896,
        intrinsicHeight: 952,
      },
    ],
  },
  {
    id: 'enkelexcel-ai',
    label: 'EnkelExcel AI',
    images: [
      {
        src: '/marketing/Excel%20AI%20alt%201.png',
        alt: 'Skjermbilde av EnkelExcel AI i Smart Budsjett.',
        intrinsicWidth: 1478,
        intrinsicHeight: 950,
      },
    ],
  },
]

/** Ca. max bredde for innholdet (max-w-5xl); 2× for Retina i sizes. */
const IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 96vw, 1024px'

function isSvgSrc(src: string) {
  try {
    const path = decodeURIComponent(src.split('?')[0])
    return path.endsWith('.svg')
  } catch {
    return src.includes('.svg')
  }
}

type HorizontalGalleryProps = {
  shotId: string
  images: PreviewImage[]
  priorityFirstSlide: boolean
}

function HorizontalProductGallery({ shotId, images, priorityFirstSlide }: HorizontalGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)

  const updateSlideFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const i = Math.min(
      images.length - 1,
      Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
    )
    setSlide(i)
  }, [images.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: 0 })
    setSlide(0)
  }, [shotId])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateSlideFromScroll, { passive: true })
    updateSlideFromScroll()
    return () => el.removeEventListener('scroll', updateSlideFromScroll)
  }, [shotId, updateSlideFromScroll])

  const go = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth
    const next = Math.min(images.length - 1, Math.max(0, slide + dir))
    el.scrollTo({ left: next * w, behavior: 'smooth' })
  }

  const goTo = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="min-w-0" style={{ background: 'var(--surface)' }}>
      <div
        ref={scrollRef}
        className="flex min-w-0 w-full touch-pan-x snap-x snap-mandatory overflow-x-auto scroll-smooth overscroll-x-contain"
        style={{ scrollbarWidth: 'thin' }}
        aria-label="Bildegalleri — bla til siden for flere skjermbilder"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            go(-1)
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            go(1)
          }
        }}
      >
        {images.map((img, idx) => {
          const isSvg = isSvgSrc(img.src)
          const w = img.intrinsicWidth ?? 1200
          const h = img.intrinsicHeight ?? 720
          return (
            <div
              key={`${shotId}-${idx}`}
              className="min-w-full shrink-0 snap-center snap-always px-2 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3"
            >
              <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--border)' }}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={w}
                  height={h}
                  className="h-auto w-full object-contain object-top"
                  sizes={IMAGE_SIZES}
                  quality={isSvg ? undefined : 95}
                  priority={priorityFirstSlide && idx === 0}
                  unoptimized={isSvg}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2 border-t px-3 py-3 sm:gap-3 sm:px-4"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <button
          type="button"
          aria-label="Forrige bilde"
          className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text)', background: '#F1F5F9' }}
          disabled={slide <= 0}
          onClick={() => go(-1)}
        >
          <ChevronLeft size={22} aria-hidden />
        </button>

        <div className="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-1 sm:gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Gå til bilde ${i + 1} av ${images.length}`}
              aria-current={i === slide ? 'true' : undefined}
              className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full"
              onClick={() => goTo(i)}
            >
              <span
                className="block h-2.5 w-2.5 rounded-full transition-[transform,background] sm:h-3 sm:w-3"
                style={{
                  background: i === slide ? 'var(--primary)' : 'var(--border)',
                  transform: i === slide ? 'scale(1.15)' : undefined,
                }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Neste bilde"
          className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text)', background: '#F1F5F9' }}
          disabled={slide >= images.length - 1}
          onClick={() => go(1)}
        >
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>
    </div>
  )
}

export default function LandingProductPreview() {
  const [active, setActive] = useState(0)
  const tablistId = useId()

  const current = SHOTS[active]
  const multiImage = current.images.length > 1
  const layout = current.galleryLayout ?? 'vertical'

  return (
    <section id="produkt" className={`scroll-mt-24 pb-14 pt-4 ${landingHorizontalPadding}`}>
      <div className="mx-auto min-w-0 max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Slik ser det ut i appen
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Stiliserte skjermbilder som viser strukturen i løsningen — tallene i din konto bygger på det du selv legger inn.
        </p>

        <div
          className="mt-8 min-w-0 max-w-full overflow-hidden rounded-2xl"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            boxShadow: '0 4px 24px color-mix(in srgb, var(--primary) 8%, transparent)',
          }}
        >
          <div
            className="flex min-w-0 w-full flex-wrap justify-center gap-2 border-b p-3 sm:justify-start sm:p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            role="tablist"
            aria-label="Velg skjermbilde"
            id={tablistId}
          >
            {SHOTS.map((shot, i) => {
              const selected = i === active
              return (
                <button
                  key={shot.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${tablistId}-${shot.id}-panel`}
                  id={`${tablistId}-${shot.id}-tab`}
                  className="min-h-[44px] touch-manipulation rounded-xl px-2.5 py-2 text-center text-xs font-medium leading-tight transition-colors sm:px-4 sm:text-left sm:text-sm"
                  style={{
                    background: selected ? 'var(--primary-pale)' : '#F1F5F9',
                    border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                    color: selected ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: selected ? 600 : 500,
                    boxShadow: selected ? '0 1px 2px color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                  }}
                  onClick={() => setActive(i)}
                >
                  {shot.label}
                  {shot.images.length > 1 ? (
                    <span className="ml-1.5 text-xs font-normal opacity-80">({shot.images.length})</span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {multiImage ? (
            <p
              className="border-b px-3 py-2.5 text-center text-xs sm:px-4 sm:text-sm"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                background: '#F8FAFC',
              }}
            >
              {layout === 'horizontal' ? (
                <>
                  <span className="sm:hidden">
                    <span className="font-medium" style={{ color: 'var(--text)' }}>
                      Bla til siden
                    </span>{' '}
                    — sveip, eller bruk pilene nederst.
                  </span>
                  <span className="hidden sm:inline">
                    <span className="font-medium" style={{ color: 'var(--text)' }}>
                      Bla til siden
                    </span>{' '}
                    — dra i bildet, sveip på mobil, eller bruk pilene under. Du kan også bruke piltastene når rammen er i fokus.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    Flere bilder
                  </span>{' '}
                  — scroll nedover i rammen under.
                </>
              )}
            </p>
          ) : null}

          <div
            role="tabpanel"
            id={`${tablistId}-${current.id}-panel`}
            aria-labelledby={`${tablistId}-${current.id}-tab`}
            className={
              multiImage && layout === 'vertical'
                ? 'max-h-[min(85dvh,840px)] min-w-0 overflow-y-auto overscroll-y-contain'
                : 'relative min-w-0 w-full'
            }
            style={{ background: 'var(--surface)' }}
          >
            {multiImage && layout === 'horizontal' ? (
              <HorizontalProductGallery
                shotId={current.id}
                images={current.images}
                priorityFirstSlide={active === 0}
              />
            ) : (
              <div className={multiImage ? 'flex flex-col gap-3 p-2 sm:gap-4 sm:p-4' : ''}>
                {current.images.map((img, idx) => {
                  const isSvg = isSvgSrc(img.src)
                  const w = img.intrinsicWidth ?? 1200
                  const h = img.intrinsicHeight ?? 720
                  return (
                    <div
                      key={`${current.id}-${idx}`}
                      className={multiImage ? 'overflow-hidden rounded-xl' : ''}
                      style={multiImage ? { border: '1px solid var(--border)' } : undefined}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={w}
                        height={h}
                        className="h-auto w-full object-contain object-top"
                        sizes={IMAGE_SIZES}
                        quality={isSvg ? undefined : 95}
                        priority={active === 0 && idx === 0}
                        unoptimized={isSvg}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          Tallene i Smart Budsjett baseres på dine egne registreringer.
        </p>
      </div>
    </section>
  )
}
