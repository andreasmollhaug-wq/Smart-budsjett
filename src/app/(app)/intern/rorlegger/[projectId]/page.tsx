import { notFound } from 'next/navigation'
import RorleggerProjectDetailPage from '@/features/rorlegger-prosjekter/RorleggerProjectDetailPage'
import { getDemoProjectById } from '@/features/rorlegger-prosjekter/demoProjects'

type Props = { params: Promise<{ projectId: string }> }

export default async function RorleggerProjectRoutePage({ params }: Props) {
  const { projectId } = await params
  if (!getDemoProjectById(projectId)) {
    notFound()
  }
  return <RorleggerProjectDetailPage projectId={projectId} />
}
