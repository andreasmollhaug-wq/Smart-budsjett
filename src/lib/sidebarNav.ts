import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  MessageSquare,
  MessagesSquare,
  Receipt,
  FileText,
  Snowflake,
  Repeat,
  ClipboardList,
  ShoppingCart,
  Hammer,
  Building2,
} from 'lucide-react'
import { RENOVATION_PROJECT_BASE_PATH } from '@/features/renovation-project/paths'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

export type SidebarNavItem = { href: string; label: string; icon: LucideIcon }

export type SidebarNavGroup = {
  id: string
  label: string
  icon: LucideIcon
  items: SidebarNavItem[]
  /** Én hovedrad som lenker direkte — samme nivå som andre grupper, uten under-akkordion. */
  directNav?: boolean
}

/** Kanonisk forum-lenke (detaljert: etter Oppussing; enkel: egen hovedseksjon etter «Verktøy»). */
export const SIDEBAR_FORUM_ITEM: SidebarNavItem = {
  href: FORUM_BASE_PATH,
  label: 'Forum',
  icon: MessagesSquare,
}

/** Flat meny (detaljert modus). */
export const SIDEBAR_NAV_DETAILED: SidebarNavItem[] = [
  { href: '/dashboard', label: 'Oversikt', icon: LayoutDashboard },
  { href: '/budsjett', label: 'Budsjett', icon: Wallet },
  { href: '/transaksjoner', label: 'Transaksjoner', icon: Receipt },
  { href: '/intern/mat-handleliste/handleliste', label: 'Handleliste', icon: ShoppingCart },
  { href: '/sparing', label: 'Sparing', icon: PiggyBank },
  { href: '/gjeld', label: 'Gjeld', icon: CreditCard },
  { href: '/abonnementer', label: 'Abonnementer', icon: Repeat },
  { href: '/snoball', label: 'Snøball', icon: Snowflake },
  { href: '/investering', label: 'Investering', icon: TrendingUp },
  { href: '/rapporter', label: 'Rapporter', icon: FileText },
  { href: '/enkelexcel-ai', label: 'dottir AI', icon: MessageSquare },
  { href: '/hjemflyt/start', label: 'Hjemflyt', icon: ClipboardList },
  { href: RENOVATION_PROJECT_BASE_PATH, label: 'Oppussing', icon: Hammer },
  SIDEBAR_FORUM_ITEM,
]

/** Alias — markedsføring og eldre importer forventer `SIDEBAR_NAV`. */
export const SIDEBAR_NAV = SIDEBAR_NAV_DETAILED

function item(href: string): SidebarNavItem {
  const found = SIDEBAR_NAV_DETAILED.find((i) => i.href === href)
  if (!found) throw new Error(`sidebarNav: mangler href ${href}`)
  return found
}

/** Gruppert meny (enkel modus), «Forslag A». */
export const SIDEBAR_GROUPS_SIMPLE: SidebarNavGroup[] = [
  {
    id: 'hverdag',
    label: 'Hverdag',
    icon: LayoutDashboard,
    items: [
      item('/dashboard'),
      item('/budsjett'),
      item('/transaksjoner'),
      item('/intern/mat-handleliste/handleliste'),
    ],
  },
  {
    id: 'gjeld',
    label: 'Gjeld',
    icon: CreditCard,
    items: [item('/gjeld'), item('/snoball')],
  },
  {
    id: 'faste',
    label: 'Faste utgifter',
    icon: Building2,
    items: [item('/abonnementer')],
  },
  {
    id: 'formue',
    label: 'Formue',
    icon: PiggyBank,
    items: [item('/sparing'), item('/investering')],
  },
  {
    id: 'innsikt',
    label: 'Innsikt',
    icon: FileText,
    items: [item('/rapporter')],
  },
  {
    id: 'verktoy',
    label: 'Verktøy',
    icon: ClipboardList,
    items: [
      item('/enkelexcel-ai'),
      item('/hjemflyt/start'),
      item(RENOVATION_PROJECT_BASE_PATH),
    ],
  },
  {
    id: 'forum',
    label: 'Forum',
    icon: MessagesSquare,
    items: [item(FORUM_BASE_PATH)],
    directNav: true,
  },
]

export function isSidebarNavActive(pathname: string, href: string): boolean {
  if (href === '/rapporter') return pathname.startsWith('/rapporter')
  if (href === '/budsjett') return pathname.startsWith('/budsjett')
  if (href === '/abonnementer') return pathname.startsWith('/abonnementer')
  if (href === '/transaksjoner') return pathname.startsWith('/transaksjoner')
  if (href === '/hjemflyt/start') return pathname.startsWith('/hjemflyt')
  if (href === '/intern/mat-handleliste/handleliste') return pathname.startsWith('/intern/mat-handleliste')
  if (href === RENOVATION_PROJECT_BASE_PATH) return pathname.startsWith(RENOVATION_PROJECT_BASE_PATH)
  if (href === FORUM_BASE_PATH) return pathname.startsWith(FORUM_BASE_PATH)
  return pathname === href
}

export function isSidebarGroupActive(pathname: string, group: SidebarNavGroup): boolean {
  return group.items.some((i) => isSidebarNavActive(pathname, i.href))
}
