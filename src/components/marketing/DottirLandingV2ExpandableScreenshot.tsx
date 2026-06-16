'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X } from 'lucide-react'

const LIGHTBOX_Z = 210

type Props = {
  src: string
  alt: string
  width: number
  height: number
}

export default function DottirLandingV2ExpandableScreenshot({ src, alt, width, height }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full min-w-0 touch-manipulation cursor-zoom-in text-left"
        aria-label={`Åpne skjermbilde: ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full"
          sizes="(max-width: 1024px) 100vw, 480px"
        />
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
              style={{ zIndex: LIGHTBOX_Z }}
              role="presentation"
            >
              <button
                type="button"
                className="absolute inset-0 touch-manipulation bg-black/70"
                aria-label="Lukk forstørret bilde"
                onPointerDown={(event) => {
                  if (event.pointerType === 'mouse' && event.button !== 0) return
                  event.preventDefault()
                  setOpen(false)
                }}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={alt}
                className="relative z-10 flex max-h-[min(92dvh,56rem)] w-full max-w-6xl min-w-0 flex-col overflow-hidden rounded-2xl border shadow-2xl"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
                }}
              >
                <div
                  className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="min-w-0 text-sm font-medium sm:text-base" style={{ color: 'var(--text-muted)' }}>
                    Skjermbilde
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-opacity hover:opacity-90"
                    style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    aria-label="Lukk"
                  >
                    <X size={22} aria-hidden />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-5">
                  <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    quality={95}
                    className="mx-auto h-auto w-full max-w-full object-contain"
                    sizes="(max-width: 1280px) 100vw, 1152px"
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
