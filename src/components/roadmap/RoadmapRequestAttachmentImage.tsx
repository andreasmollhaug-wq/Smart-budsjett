/* Supabase public URL — bruker vanlig img (unngår remotePatterns i next.config). */
/* eslint-disable @next/next/no-img-element */

type Props = {
  publicUrl: string
  /** Kort: kompakt forhåndsvisning. Modal: større visning. */
  layout: 'card' | 'modal'
  alt: string
}

/**
 * Vises med vanlig <img> + public URL (bucket er public; sikkerheten ligger i uforutsigbar sti/UUID).
 */
export function RoadmapRequestAttachmentImage({ publicUrl, layout, alt }: Props) {
  if (layout === 'card') {
    return (
      <div
        className="mt-1.5 w-full min-w-0 rounded-lg overflow-hidden border max-h-16"
        style={{ borderColor: 'var(--border)' }}
      >
        <img
          src={publicUrl}
          alt={alt}
          className="w-full h-12 object-cover"
          loading="lazy"
        />
      </div>
    )
  }
  return (
    <div
      className="mt-3 w-full min-w-0 rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--border)' }}
    >
      <img
        src={publicUrl}
        alt={alt}
        className="max-w-full max-h-[min(50vh,360px)] w-auto h-auto object-contain mx-auto block"
        loading="lazy"
      />
    </div>
  )
}
