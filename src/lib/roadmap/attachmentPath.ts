import { FEATURE_REQUEST_MAX_IMAGE_BYTES, ROADMAP_IMAGE_MIMES } from './attachmentConstants'

export {
  FEATURE_REQUEST_IMAGES_BUCKET,
  FEATURE_REQUEST_MAX_IMAGE_BYTES,
  ROADMAP_IMAGE_ACCEPT,
  ROADMAP_IMAGE_MIMES,
} from './attachmentConstants'

const SAFE_FILE_RE = /^[a-zA-Z0-9._-]+$/
const MAX_NAME_LEN = 200

/**
 * Samsvar med validering i set_feature_request_image: kun a–Z, 0–9, punkt, bindestrekk, understrek.
 * Gir trygt leverbart filnavn (én path-komponent, ingen /).
 */
export function sanitizeImageFileName(original: string): string {
  const t = (original || '').trim()
  const noSpecial = t.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const collapsed = noSpecial.replace(/-+/g, '-')
  const stripped = collapsed.replace(/^[-.]+|[-.]+$/g, '')
  if (!stripped) return 'image.png'
  const lastDot = stripped.lastIndexOf('.')
  let out: string
  if (lastDot <= 0 || lastDot === stripped.length - 1) {
    const body = stripped.slice(0, MAX_NAME_LEN)
    out = `${body}.png`
  } else {
    const ext = stripped
      .slice(lastDot, lastDot + 6)
      .replace(/[^a-zA-Z0-9.]/g, '')
    const safeExt = ext.length < 2 ? '.png' : ext
    const namePart = stripped.slice(0, lastDot) || 'image'
    out = `${namePart}${safeExt}`
  }
  if (out.length > MAX_NAME_LEN) {
    const li = out.lastIndexOf('.')
    if (li > 0 && li < out.length - 1) {
      const ext = out.slice(li)
      out = out.slice(0, li).slice(0, MAX_NAME_LEN - ext.length) + ext
    } else {
      out = out.slice(0, MAX_NAME_LEN)
    }
  }
  if (!SAFE_FILE_RE.test(out)) {
    return 'image.png'
  }
  return out
}

export function buildFeatureRequestImagePath(
  userId: string,
  requestId: string,
  safeFileName: string,
): string {
  if (safeFileName.length > MAX_NAME_LEN || !SAFE_FILE_RE.test(safeFileName)) {
    throw new Error('Ugyldig filnavn')
  }
  return `${userId}/${requestId}/${safeFileName}`
}

/** Brukes i enhetstest for paritet med server (sti inn i bucket, ikke `../`). */
export function isValidStoragePathForRequest(
  fullPath: string,
  userId: string,
  requestId: string,
  fileName: string,
): boolean {
  if (!fullPath || fullPath.indexOf('..') >= 0) return false
  const expected = `${userId}/${requestId}/${fileName}`
  if (fullPath !== expected) return false
  if (fileName.length > MAX_NAME_LEN) return false
  return SAFE_FILE_RE.test(fileName)
}

export function validateRoadmapImageFile(file: File): { ok: true } | { ok: false; message: string } {
  if (file.size > FEATURE_REQUEST_MAX_IMAGE_BYTES) {
    return { ok: false, message: 'Bildet er for stort. Maks 2 MB.' }
  }
  if (!ROADMAP_IMAGE_MIMES.has(file.type)) {
    return { ok: false, message: 'Tillatte formater: PNG, JPEG, WebP eller GIF.' }
  }
  return { ok: true }
}
