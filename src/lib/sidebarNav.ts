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
  ClipboardList,
  ShoppingCart,
  Hammer,
} from 'lucide-react'
import { RENOVATION_PROJECT_BASE_PATH } from '@/features/renovation-project/paths'

export const SIDEBAR_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Oversikt', icon: LayoutDashboard },
  { href: '/budsjett', label: 'Budsjett', icon: Wallet },
  { href: '/transaksjoner', label: 'Transaksjoner', icon: Receipt },
  { href: '/sparing', label: 'Sparing', icon: PiggyBank },
  { href: '/gjeld', label: 'Gjeld', icon: CreditCard },
  { href: '/abonnementer', label: 'Abonnementer', icon: Repeat },
  { href: '/snoball', label: 'Snøball', icon: Snowflake },
  { href: '/investering', label: 'Investering', icon: TrendingUp },
  { href: '/rapporter', label: 'Rapporter', icon: FileText },
  { href: '/enkelexcel-ai', label: 'EnkelExcel AI', icon: MessageSquare },
  { href: '/hjemflyt/start', label: 'Hjemflyt', icon: ClipboardList },
  { href: '/intern/mat-handleliste/handleliste', label: 'Handleliste', icon: ShoppingCart },
  { href: RENOVATION_PROJECT_BASE_PATH, label: 'Oppussing', icon: Hammer },
]

export function isSidebarNavActive(pathname: string, href: string): boolean {
  if (href === '/rapporter') return pathname.startsWith('/rapporter')
  if (href === '/budsjett') return pathname.startsWith('/budsjett')
  if (href === '/abonnementer') return pathname.startsWith('/abonnementer')
  if (href === '/transaksjoner') return pathname.startsWith('/transaksjoner')
  if (href === '/hjemflyt/start') return pathname.startsWith('/hjemflyt')
  if (href === '/intern/mat-handleliste/handleliste') return pathname.startsWith('/intern/mat-handleliste')
  if (href === RENOVATION_PROJECT_BASE_PATH) return pathname.startsWith(RENOVATION_PROJECT_BASE_PATH)
  return pathname === href
}
