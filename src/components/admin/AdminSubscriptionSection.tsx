'use client'

import AdminMetricPanel from '@/components/admin/AdminMetricPanel'
import StatCard from '@/components/ui/StatCard'
import type { AdminMetricsPayload } from '@/lib/admin/types'
import { AlertTriangle, Clock, CreditCard, UserMinus } from 'lucide-react'

export default function AdminSubscriptionSection({
  subscription,
}: {
  subscription: AdminMetricsPayload['subscription']
}) {
  return (
    <section className="min-w-0">
      <AdminMetricPanel
        title="Abonnement nå"
        subtitle="Snapshot fra Stripe-status synket til databasen"
        accent="#099268"
      >
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label="Prøveperiode"
            value={String(subscription.trialing)}
            sub="trialing"
            icon={Clock}
            color="#3B5BDB"
            info="Aktiv prøveperiode — betaling trekkes når prøven utløper."
            variant="inset"
          />
          <StatCard
            label="Aktivt abonnement"
            value={String(subscription.active)}
            sub="active"
            icon={CreditCard}
            color="#099268"
            info="Betaler abonnement (Stripe status active)."
            variant="inset"
          />
          <StatCard
            label="Forfalt betaling"
            value={String(subscription.past_due)}
            sub="past_due"
            icon={AlertTriangle}
            color="#E67700"
            info="Stripe prøver å trekke på nytt (grace-periode)."
            variant="inset"
          />
          <StatCard
            label="Kansellert"
            value={String(subscription.canceled)}
            sub="canceled"
            icon={UserMinus}
            color="#868E96"
            info="Abonnement avsluttet — kan ha fullført checkout tidligere."
            variant="inset"
          />
        </div>
      </AdminMetricPanel>
    </section>
  )
}
