'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PersonSwitcher from '@/components/account/PersonSwitcher'
import { useActivePersonFinance, useStore } from '@/lib/store'
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Receipt,
  FileText,
  Snowflake,
} from 'lucide-react'

function SubscriptionFooter() {
  const { subscriptionPlan } = useActivePersonFinance()
  const title = subscriptionPlan === 'solo' ? 'Solo' : 'Familie'
  const subtitle =
    subscriptionPlan === 'solo' ? 'Én bruker i husholdningen' : 'Opp til fem brukere i husholdningen'

  return (
    <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <Link
        href="/konto/betalinger"
        className="block mx-1 p-3 rounded-xl transition-colors hover:opacity-90"
        style={{ background: 'var(--primary-pale)' }}
      >
        <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        <p className="text-xs mt-2 font-medium" style={{ color: 'var(--primary)' }}>
          Administrer abonnement
        </p>
      </Link>
    </div>
  )
}

const nav = [
  { href: '/dashboard', label: 'Oversikt', icon: LayoutDashboard },
  { href: '/budsjett', label: 'Budsjett', icon: Wallet },
  { href: '/transaksjoner', label: 'Transaksjoner', icon: Receipt },
  { href: '/sparing', label: 'Sparing', icon: PiggyBank },
  { href: '/gjeld', label: 'Gjeld', icon: CreditCard },
  { href: '/snoball', label: 'Snøball', icon: Snowflake },
  { href: '/investering', label: 'Investering', icon: TrendingUp },
  { href: '/rapporter', label: 'Rapporter', icon: FileText },
  { href: '/claude', label: 'EnkelExcel AI', icon: MessageSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const logoBg = demoDataEnabled
    ? 'linear-gradient(135deg, #EA580C, #F97316)'
    : 'linear-gradient(135deg, #3B5BDB, #4C6EF5)'

  return (
    <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      className="w-64 min-h-screen flex flex-col shadow-sm">

      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: logoBg }}
          >
            SB
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Smart Budsjett</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>by EnkelExcel</p>
          </div>
        </Link>
      </div>

      <PersonSwitcher />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/rapporter'
              ? pathname.startsWith('/rapporter')
              : href === '/budsjett'
                ? pathname.startsWith('/budsjett')
                : href === '/transaksjoner'
                  ? pathname.startsWith('/transaksjoner')
                  : pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'var(--primary-pale)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
              }}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} style={{ color: 'var(--primary)' }} />}
            </Link>
          )
        })}
      </nav>

      <SubscriptionFooter />
    </aside>
  )
}
