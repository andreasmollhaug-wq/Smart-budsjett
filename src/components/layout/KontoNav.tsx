'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, CreditCard, Shield, ChevronRight, Tags } from 'lucide-react'

const links = [
  { href: '/konto/innstillinger', label: 'Innstillinger', icon: Settings },
  { href: '/konto/budsjett-kategorier', label: 'Budsjettkategorier', icon: Tags },
  { href: '/konto/betalinger', label: 'Betalinger', icon: CreditCard },
  { href: '/konto/sikkerhet', label: 'Sikkerhet', icon: Shield },
] as const

export default function KontoNav() {
  const pathname = usePathname()

  return (
    <nav
      className="w-60 shrink-0 border-r px-3 py-6 space-y-1"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: active ? 'var(--primary-pale)' : 'transparent',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {active && <ChevronRight size={14} style={{ color: 'var(--primary)' }} />}
          </Link>
        )
      })}
    </nav>
  )
}
