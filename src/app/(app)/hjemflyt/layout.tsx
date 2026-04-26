import HjemflytSubnav from '@/components/hjemflyt/HjemflytSubnav'

export const metadata = {
  title: 'HjemFlyt',
}

/**
 * Husholdningsoppgaver — egen fane m.m. undermeny, som Budsjett/Transaksjoner.
 */
export default function HjemflytLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <HjemflytSubnav />
      <div className="min-h-0 flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  )
}
