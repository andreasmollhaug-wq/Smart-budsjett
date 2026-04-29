import MatHandlelisteInternLayoutClient from '@/features/matHandleliste/MatHandlelisteInternLayoutClient'

export const metadata = {
  title: 'Mat og handleliste',
}

export default function InternMatHandlelisteLayout({ children }: { children: React.ReactNode }) {
  return <MatHandlelisteInternLayoutClient>{children}</MatHandlelisteInternLayoutClient>
}
