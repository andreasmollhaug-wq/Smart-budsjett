import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  MessageSquare,
  Receipt,
  FileText,
  Snowflake,
  Repeat,
} from 'lucide-react'

export const SIDEBAR_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Oversikt', icon: LayoutDashboard },
  { href: '/budsjett', label: 'Budsjett', icon: Wallet },
  { href: '/transaksjoner', label: 'Transaksjoner', icon: Receipt },
  { href: '/sparing', label: 'Sparing', icon: PiggyBank },
  { href: '/gjeld', label: 'Gjeld', icon: CreditCard },
  { href: '/snoball', label: 'Snøball', icon: Snowflake },
  { href: '/investering', label: 'Investering', icon: TrendingUp },
  { href: '/rapporter', label: 'Rapporter', icon: FileText },
  { href: '/enkelexcel-ai', label: 'EnkelExcel AI', icon: MessageSquare },
  { href: '/abonnementer', label: 'Abonnementer', icon: Repeat },
]

export function isSidebarNavActive(pathname: string, href: string): boolean {
  if (href === '/rapporter') return pathname.startsWith('/rapporter')
  if (href === '/budsjett') return pathname.startsWith('/budsjett')
  if (href === '/abonnementer') return pathname.startsWith('/abonnementer')
  if (href === '/transaksjoner') return pathname.startsWith('/transaksjoner')
  return pathname === href
}
