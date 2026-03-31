import Header from '@/components/layout/Header'
import KontoNav from '@/components/layout/KontoNav'

export default function KontoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col overflow-hidden min-h-0"
      style={{ background: 'var(--bg)' }}
    >
      <Header title="Min konto" subtitle="Administrer konto og personvern" />
      <div className="flex flex-1 min-h-0">
        <KontoNav />
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6 max-w-3xl">{children}</div>
        </div>
      </div>
    </div>
  )
}
