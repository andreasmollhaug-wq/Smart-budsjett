import { z } from 'zod'

/**
 * **`is_first_post`**: første innlegg i en tråd settes kun av RPC-en `forum_create_thread` til `true`.
 * Statistikk: **tråder** = rader i `forum_thread`; **svar** = `forum_post` der `is_first_post = false`.
 */

export const forumNewThreadSchema = z.object({
  categoryId: z.string().uuid('Ugyldig kategori.'),
  title: z
    .string()
    .trim()
    .min(3, 'Tittelen må ha minst 3 tegn.')
    .max(240, 'Maks 240 tegn i tittel.'),
  body: z
    .string()
    .trim()
    .min(1, 'Skriv inn innhold.')
    .max(16000, 'Teksten er for lang.'),
})

export const forumReplySchema = z.object({
  threadId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'Skriv inn et svar.')
    .max(16000, 'Teksten er for lang.'),
})

const reportReason = z
  .string()
  .trim()
  .min(10, 'Forklar litt mer (minst 10 tegn).')
  .max(4000, 'Begrunnelsen er for lang.')

export const forumReportPostSchema = z.object({
  kind: z.literal('post'),
  postId: z.string().uuid(),
  reason: reportReason,
})

export const forumReportThreadSchema = z.object({
  kind: z.literal('thread'),
  threadId: z.string().uuid(),
  reason: reportReason,
})

export const forumReportSchema = z.discriminatedUnion('kind', [
  forumReportPostSchema,
  forumReportThreadSchema,
])

export type ForumNewThreadInput = z.infer<typeof forumNewThreadSchema>
export type ForumReplyInput = z.infer<typeof forumReplySchema>
export type ForumReportInput = z.infer<typeof forumReportSchema>

export const forumEditPostSchema = z.object({
  postId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'Skriv inn tekst.')
    .max(16000, 'Teksten er for lang.'),
})

export const forumEditThreadTitleSchema = z.object({
  threadId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(3, 'Tittelen må ha minst 3 tegn.')
    .max(240, 'Maks 240 tegn i tittel.'),
})

export const forumProfileDisplaySchema = z.object({
  /** Tom streng = fjern visningsnavn (kun kort kode vises). */
  displayName: z
    .string()
    .trim()
    .max(80, 'Maks 80 tegn.')
    .optional()
    .transform((s) => {
      if (!s || s.length === 0) return null
      if (s.length < 2) return null
      return s
    }),
})

export const forumModLockSchema = z.object({
  threadId: z.string().uuid(),
  locked: z.boolean(),
})

export const forumModReportStatusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['open', 'dismissed', 'resolved']),
})

export const forumNoticeMarkReadSchema = z.object({
  noticeId: z.string().uuid(),
})
