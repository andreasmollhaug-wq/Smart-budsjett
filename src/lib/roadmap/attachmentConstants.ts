export const FEATURE_REQUEST_IMAGES_BUCKET = 'feature_request_images' as const

export const FEATURE_REQUEST_MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** Verdier i <input accept> (matcher migrasjon/bucket). */
export const ROADMAP_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif' as const

export const ROADMAP_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
