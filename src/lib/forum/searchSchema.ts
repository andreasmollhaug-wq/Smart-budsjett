import { z } from 'zod'

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const forumSearchUrlSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Skriv minst to tegn.')
    .max(200, 'Søket er for langt.'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  kategori: z
    .string()
    .trim()
    .max(80)
    .optional()
    .refine((s) => !s || slugRe.test(s), 'Ugyldig kategori-slug.'),
})

export type ForumSearchUrlInput = z.infer<typeof forumSearchUrlSchema>
