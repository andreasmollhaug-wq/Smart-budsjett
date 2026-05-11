import type { SupabaseClient } from '@supabase/supabase-js'

export const FORUM_ATTACH_MAX_BYTES = 5 * 1024 * 1024 // matcher migrasjon
export const FORUM_ATTACH_MAX_PER_POST = 10
export const FORUM_ATTACH_MAX_PICK_UI = 6

export const FORUM_ATTACH_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,application/pdf,.png,.jpg,.jpeg,.webp,.gif,.pdf'

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])

function sanitizeStorageSegment(orig: string): string {
  const base = orig.split(/[/\\]/).pop()?.trim() || 'fil'
  const ascii = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '')
  const cut = ascii.slice(0, 96)
  return cut.length > 0 ? cut : 'fil'
}

export function partitionForumAttachments(files: File[]): { ok: true; files: File[] } | { ok: false; error: string } {
  if (files.length > FORUM_ATTACH_MAX_PICK_UI) {
    return { ok: false, error: `Maks ${FORUM_ATTACH_MAX_PICK_UI} filer per innlegg.` }
  }
  const list = [...files]
  for (const f of list) {
    if (f.size < 1) return { ok: false, error: `«${f.name}» er tom.` }
    if (f.size > FORUM_ATTACH_MAX_BYTES) return { ok: false, error: `«${f.name}» er over 5 MB.` }
    if (!ALLOWED.has(f.type)) {
      return { ok: false, error: `«${f.name}» har ikke tillatt type (kun JPG, PNG, WebP, GIF, PDF).` }
    }
  }
  return { ok: true, files: list }
}

/**
 * Etter INSERT innlegg: last opp til Storage og registrer vedleggsrad via RPC.
 */
export async function uploadForumPostAttachments(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  files: File[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const part = partitionForumAttachments(files)
  if (!part.ok) return part

  for (let i = 0; i < part.files.length; i += 1) {
    const f = part.files[i]
    const safe = sanitizeStorageSegment(f.name)
    const objectName = `${Date.now().toString(36)}_${i}_${safe}`
    const path = `${userId}/${postId}/${objectName}`

    const { error: uploadErr } = await supabase.storage.from('forum_attachments').upload(path, f, {
      contentType: f.type || 'application/octet-stream',
      upsert: false,
    })

    if (uploadErr) {
      return { ok: false, error: uploadErr.message || 'Kunne ikke laste opp fil.' }
    }

    const { error: rpcErr } = await supabase.rpc('forum_register_post_attachment', {
      p_post_id: postId,
      p_path: path,
      p_original_name: f.name.slice(0, 240),
      p_mime: f.type || 'application/octet-stream',
      p_bytes: f.size,
    })

    if (rpcErr) {
      return {
        ok: false,
        error: rpcErr.message?.includes('too_many_attachments')
          ? 'For mange vedlegg på dette innlegget.'
          : rpcErr.message || 'Kunne ikke registrere vedlegg.',
      }
    }
  }

  return { ok: true }
}

export function forumAttachmentPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  const enc = storagePath
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  return `${base}/storage/v1/object/public/forum_attachments/${enc}`
}
