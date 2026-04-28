import MatHandlelisteSubnav from '@/components/matHandleliste/MatHandlelisteSubnav'

export const metadata = {
  title: 'Mat og handleliste',
}

export default function InternMatHandlelisteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <MatHandlelisteSubnav />
      <div className="min-h-0 flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  )
}
