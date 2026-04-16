'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, CreditCard, Shield, ChevronRight, Tags, Map, BookOpen, Upload, Users, Mail } from 'lucide-react'
import { useStore } from '@/lib/store'

const baseLinks = [
  { href: '/konto/innstillinger', label: 'Innstillinger', labelShort: 'Innst.', icon: Settings },
  { href: '/konto/kom-i-gang', label: 'Kom i gang', labelShort: 'Guide', icon: BookOpen },
  { href: '/konto/budsjett-kategorier', label: 'Budsjettkategorier', labelShort: 'Kategorier', icon: Tags },
  { href: '/konto/betalinger', label: 'Betalinger', labelShort: 'Betaling', icon: CreditCard },
  { href: '/konto/sikkerhet', label: 'Sikkerhet', labelShort: 'Sikkerhet', icon: Shield },
  { href: '/konto/roadmap', label: 'Roadmap', labelShort: 'Roadmap', icon: Map },
  { href: '/konto/importer-transaksjoner', label: 'Importer transaksjoner', labelShort: 'Import', icon: Upload },
  { href: '/konto/kontakt', label: 'Kontakt oss', labelShort: 'Kontakt', icon: Mail },
] as const

const profilerLink = {
  href: '/konto/profiler',
  label: 'Profiler',
  labelShort: 'Profiler',
  icon: Users,
} as const

export default function KontoNav() {
  const pathname = usePathname()
  const subscriptionPlan = useStore((s) => s.subscriptionPlan)

  const links =
    subscriptionPlan === 'family'
      ? [baseLinks[0], profilerLink, ...baseLinks.slice(1)]
      : [...baseLinks]

  return (
    <nav
      className="flex shrink-0 flex-row gap-0.5 overflow-x-auto touch-manipulation border-b px-2 py-2 sm:gap-1 md:w-60 md:flex-col md:gap-0 md:space-y-1 md:border-b-0 md:border-r md:px-3 md:py-6"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      aria-label="Konto"
    >
      {links.map(({ href, label, labelShort, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all md:min-h-0 md:gap-3 md:py-2.5"
            style={{
              background: active ? 'var(--primary-pale)' : 'transparent',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={18} className="shrink-0" />
            <span className="max-md:hidden md:flex-1">{label}</span>
            <span className="whitespace-nowrap md:hidden">{labelShort}</span>
            {active && <ChevronRight size={14} className="max-md:hidden" style={{ color: 'var(--primary)' }} />}
          </Link>
        )
      })}
    </nav>
  )
}
