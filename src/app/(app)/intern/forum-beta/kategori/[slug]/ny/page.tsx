import { redirect } from 'next/navigation'

type Props = { params: Promise<{ slug: string }> }

/**
 * Tidligere egen «ny tråd»-side. Bevarer bookmarks: åpner kategorisiden med modal via `ny=1`.
 */
export default async function ForumNewThreadLegacyRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`/intern/forum-beta/kategori/${encodeURIComponent(slug)}?ny=1`)
}
