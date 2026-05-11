import { redirect } from 'next/navigation'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

type Props = { params: Promise<{ slug: string }> }

/**
 * Tidligere egen «ny tråd»-side. Bevarer bookmarks: åpner kategorisiden med modal via `ny=1`.
 */
export default async function ForumNewThreadLegacyRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`${FORUM_BASE_PATH}/kategori/${encodeURIComponent(slug)}?ny=1`)
}
