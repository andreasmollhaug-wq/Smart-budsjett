'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Supabase kan sende brukeren til Site URL (/) med økt i URL-hash ved feil redirect-konfigurasjon.
 * Flytter hash til /tilbakestill-passord slik @supabase/ssr kan etablere økt og PASSWORD_RECOVERY.
 */
export default function RecoveryHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hash
    if (!h) return
    if (!/access_token|type=recovery|refresh_token/i.test(h)) return
    router.replace(`/tilbakestill-passord${h}`)
  }, [router])

  return null
}
