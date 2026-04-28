'use client'

import StatCard from '@/components/ui/StatCard'
import { shoppingListRemainingKpi } from '@/features/matHandleliste/listKpi'
import type { ShoppingListItem } from '@/features/matHandleliste/types'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { ListChecks, Wallet } from 'lucide-react'

const KPI_PRIMARY = '#3B5BDB'
const KPI_NEUTRAL = '#0CA678'

const kpiInfo =
  'Gjelder kun varer du ikke har krysset av ennå. Total pris summerer bare linjer med satt pris. Katalogtall er typisk kr per kg eller per liter; mengden i oppskriften omregnes (f.eks. gram → kg). Beløp er veiledende testdata — ikke markedspriser.'

export function MatHandlelisteListKpi({ list }: { list: ShoppingListItem[] }) {
  const { formatNOK } = useNokDisplayFormatters()
  const { remainingCount, pricedCount, sumNok } = shoppingListRemainingKpi(list)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0" aria-label="Handleliste oversikt">
      <StatCard
        label="Gjenstår å handle"
        value={String(remainingCount)}
        sub="Antall linjer ikke avkrysset"
        icon={ListChecks}
        color={KPI_PRIMARY}
        info={kpiInfo}
      />
      <StatCard
        label="Ca. handlekurv"
        value={pricedCount > 0 ? formatNOK(sumNok) : '—'}
        sub={
          remainingCount === 0
            ? 'Ingen varer igjen'
            : pricedCount < remainingCount
              ? `${pricedCount} av ${remainingCount} med pris`
              : 'Alle gjenstående har pris'
        }
        icon={Wallet}
        color={KPI_NEUTRAL}
        info={kpiInfo}
        valueNoWrap
      />
    </div>
  )
}
