import Header from '@/components/layout/Header'
import KontoNav from '@/components/layout/KontoNav'
import KontoContentWidth from '@/components/layout/KontoContentWidth'

export default function KontoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col overflow-hidden min-h-0"
      style={{ background: 'var(--bg)' }}
    >
      <Header title="Min konto" subtitle="Administrer konto og personvern" />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <KontoNav />
        <div className="min-h-0 flex-1 overflow-auto">
          <KontoContentWidth>{children}</KontoContentWidth>
        </div>
      </div>
    </div>
  )
}
