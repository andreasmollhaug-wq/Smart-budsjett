'use client'

import { useEffect } from 'react'

import type { SmartvaneSerializableBundle } from './types'
import { localTodayYmd, parseYmdToDay } from './smartvaneBundleHelpers'
import { useStore } from '@/lib/store'

type Props = {
  bundle: SmartvaneSerializableBundle
  year: number
  month: number
  /** Aktiv budsjettprofil (samme som SmartVane-cookie / Zustand). */
  profileId: string
}

/** Legger oppfrisker daglig påminnelse i varslingssenteret (bjellen — Zustand) når påkrevde betingelser er oppfyllt. */
export function SmartvaneBellReminderSync({ bundle, year, month, profileId }: Props) {
  const sync = useStore((s) => s.syncSmartvaneBellReminder)

  useEffect(() => {
    const todayYmd = localTodayYmd()
    const { y: ty, m: tm, d: td } = parseYmdToDay(todayYmd)
    const inMonth = ty === year && tm === month
    const daily = bundle.habits.filter((h) => h.kind === 'daily')
    const daysInMonth = new Date(year, month, 0).getDate()

    const show =
      inMonth &&
      daily.length > 0 &&
      td >= 1 &&
      td <= daysInMonth &&
      !daily.some((h) => (bundle.dailyCompleted[h.id] ?? []).includes(todayYmd))

    sync({ profileId, calendarYmd: todayYmd, show })
  }, [bundle, year, month, profileId, sync])

  return null
}
