/** Metadata vedlegg (forum_post_attachment) */
export type ForumPostAttachmentRow = {
  id: string
  post_id: string
  storage_path: string
  file_name: string
  mime_type: string
  bytes: number
  /** Når satt (server): kortlevd signert URL eller offentlig bilde-URL. */
  href?: string
}

/** Innlegg i tråd med vedleggsliste fra server */
export type ForumThreadPostRow = {
  id: string
  author_id: string
  body: string
  deleted_at: string | null
  created_at: string
  is_first_post: boolean
  edited_at: string | null
  attachments: ForumPostAttachmentRow[]
}

export type ForumNoticeRow = {
  id: string
  thread_id: string
  post_id: string
  kind: string
  created_at: string
  read_at: string | null
}
