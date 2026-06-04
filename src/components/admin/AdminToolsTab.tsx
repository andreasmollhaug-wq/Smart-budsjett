'use client'

import AdminMetricPanel from '@/components/admin/AdminMetricPanel'
import AdminRepairCheckoutPanel from '@/components/admin/AdminRepairCheckoutPanel'
import { adminPanelId, adminTabButtonId } from '@/components/admin/AdminTabNav'

export default function AdminToolsTab({ onReload }: { onReload?: () => void | Promise<void> }) {
  return (
    <div
      role="tabpanel"
      id={adminPanelId('verktoy')}
      aria-labelledby={adminTabButtonId('verktoy')}
      className="min-w-0 space-y-8 sm:space-y-10"
    >
      <AdminMetricPanel title="Vedlikehold" subtitle="Synkroniser checkout-datoer fra Stripe">
        <AdminRepairCheckoutPanel onReload={onReload} />
      </AdminMetricPanel>
      <AdminMetricPanel title="Om tallene" subtitle="Datakilder og tilgang">
        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <p>
            Aggregerte tall uten personidentifiserbar informasjon. Checkout-tidspunkt baseres på{' '}
            <code className="text-xs">first_checkout_at</code> ved første vellykkede Stripe Checkout.
            Alle datoer er i Europe/Oslo.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong style={{ color: 'var(--text)' }}>Registrering og e-post:</strong> Supabase Auth
              (service role, paginert liste).
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Abonnement og checkout:</strong> tabellen{' '}
              <code className="text-xs">user_subscription</code>, synket via Stripe webhook.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Tilgang:</strong> innlogging, e-post i{' '}
              <code className="text-xs">admin_viewer</code>, aktivert TOTP og AAL2 (tofaktor).
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Abonnentliste:</strong> e-post og plan (Solo/Familie)
              for brukere med aktiv tilgang — kun på Oversikt-fanen.
            </li>
          </ul>
        </div>
      </AdminMetricPanel>
    </div>
  )
}
