import { redirect } from 'next/navigation'
import { smartvanePaths } from '@/features/smartvane/paths'

export default function SmartvaneIndexPage() {
  redirect(smartvanePaths.today)
}
