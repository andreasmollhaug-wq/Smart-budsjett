import SmartvaneSectionLayout from './SmartvaneSectionLayout'
import SmartvaneTourProvider from '@/features/smartvane/SmartvaneTourProvider'

export default function SmartvaneLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmartvaneTourProvider>
      <SmartvaneSectionLayout>{children}</SmartvaneSectionLayout>
    </SmartvaneTourProvider>
  )
}
