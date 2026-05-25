'use client'

import Header from '@/components/layout/Header'
import GjeldSubnav from '@/components/debt/GjeldSubnav'
import StudielanKalkulator from '@/components/debt/StudielanKalkulator'

export default function StudielanKalkulatorPage() {
  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Gjeld" subtitle="Studielånskalkulator — månedlig betaling og nedbetalingsplan" />
      <GjeldSubnav />
      <div className="flex-1 min-w-0 w-full pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pt-6 lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))] lg:py-8">
        <StudielanKalkulator />
      </div>
    </div>
  )
}
