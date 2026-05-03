'use client'

import { Suspense, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import SmartvaneSubnav from '@/components/smartvane/SmartvaneSubnav'
import SmartvaneTourHeaderButton from '@/features/smartvane/SmartvaneTourHeaderButton'
import { seedSmartvaneDemoIfNeeded } from '@/features/smartvane/actions'
import { parseYmFromQuery } from '@/features/smartvane/smartvaneMonthCookie'
import {
  parseSmartvaneProfileCookie,
  readRawSmartvaneProfileCookieClient,
  sanitizeSmartvaneProfileId,
  writeSmartvaneProfileCookieClient,
} from '@/features/smartvane/smartvaneProfileCookie'
import { useStore } from '@/lib/store'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const MONTHS_NO = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

function normalizePath(pathname: string): string {
  const base = pathname.split('?')[0] ?? pathname
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1)
  return base
}

/** Undertitel under «SmartVane» i felles toppstripe (som Budsjett). */
function smartvaneSectionSubtitle(pathname: string, sp: URLSearchParams): string {
  const base = normalizePath(pathname)

  if (base.endsWith('/i-dag')) {
    return new Date().toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (base.endsWith('/start-her')) {
    return 'Kom i gang, hjelp og gjennomganger'
  }

  const ym = parseYmFromQuery(sp.get('y'), sp.get('m'))
  const now = new Date()
  const y = ym?.year ?? now.getFullYear()
  const m = ym?.month ?? now.getMonth() + 1

  if (base.endsWith('/maned')) {
    return `Måned · ${MONTHS_NO[m - 1]} ${y}`
  }
  if (base.endsWith('/insikt')) {
    return `${MONTHS_NO[m - 1]} ${y}`
  }

  return 'Vaner du bygger over tid'
}

function SmartvaneProfileCookieSync() {
  const activeProfileId = useStore((s) => s.activeProfileId)
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const prevProfileOnSmartvaneRef = useRef<string | null>(null)

  useEffect(() => {
    const resolved = sanitizeSmartvaneProfileId(activeProfileId)
    const base = normalizePath(pathname)

    /** Les før write — `setActiveProfileId` oppdaterer allerede cookien, så vi må også detektere profilskifte via ref. */
    const cookieBeforeWrite = parseSmartvaneProfileCookie(readRawSmartvaneProfileCookieClient())
    writeSmartvaneProfileCookieClient(activeProfileId)

    if (!base.startsWith('/smartvane')) {
      prevProfileOnSmartvaneRef.current = resolved
      return
    }

    const profileChangedWhileOnSection =
      prevProfileOnSmartvaneRef.current !== null && prevProfileOnSmartvaneRef.current !== resolved
    const cookieStaleVersusStore = cookieBeforeWrite !== resolved

    if (profileChangedWhileOnSection || cookieStaleVersusStore) {
      router.refresh()
    }
    prevProfileOnSmartvaneRef.current = resolved
  }, [activeProfileId, pathname, router])

  return null
}

function SmartvaneDemoSeedOnVisit() {
  const demoEnabled = useStore((s) => s.demoDataEnabled)
  const ran = useRef(false)
  useEffect(() => {
    if (!demoEnabled) {
      ran.current = false
      return
    }
    if (ran.current) return
    ran.current = true
    void seedSmartvaneDemoIfNeeded()
  }, [demoEnabled])
  return null
}

function SmartvaneSectionLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const sp = useSearchParams()
  const subtitle = smartvaneSectionSubtitle(pathname, sp)

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto"
      style={{ background: 'var(--bg)' }}
    >
      <SmartvaneProfileCookieSync />
      <SmartvaneDemoSeedOnVisit />
      <Header
        title="SmartVane"
        subtitle={subtitle}
        titleAddon={<SmartvaneTourHeaderButton />}
      />
      <SmartvaneSubnav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export default function SmartvaneSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto"
          style={{ background: 'var(--bg)' }}
        >
          <Header title="SmartVane" />
          <div
            className="h-11 shrink-0 border-b sm:h-12"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            aria-hidden
          />
        </div>
      }
    >
      <SmartvaneSectionLayoutInner>{children}</SmartvaneSectionLayoutInner>
    </Suspense>
  )
}
