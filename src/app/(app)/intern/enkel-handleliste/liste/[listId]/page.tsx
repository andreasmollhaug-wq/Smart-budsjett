import { EnkelHandlelisteListPage } from '@/features/enkelHandleliste/EnkelHandlelisteListPage'

export default async function EnkelHandlelisteListRoutePage({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  return <EnkelHandlelisteListPage listId={listId} />
}
