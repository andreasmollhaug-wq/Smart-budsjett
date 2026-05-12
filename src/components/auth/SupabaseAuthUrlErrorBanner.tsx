'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  decodeSupabaseErrorDescription,
  readSupabaseAuthErrorFromWindow,
  stripSupabaseAuthErrorFromUrl,
} from '@/lib/supabaseAuthUrlErrors'

function userMessage(parsed: NonNullable<ReturnType<typeof readSupabaseAuthErrorFromWindow>>): string {
  const { errorCode, errorDescription } = parsed
  const decoded = decodeSupabaseErrorDescription(errorDescription)

  if (
    errorCode === 'otp_expired' ||
    /invalid or has expired/i.test(decoded) ||
    /utløpt/i.test(decoded)
  ) {
    return 'Lenken fra e-post er utløpt, allerede brukt, eller ugyldig. Be om en ny under «Glemt passord», og åpne den gjerne med én gang. Enkelte jobb-e-posttjenester åpner lenker automatisk (f.eks. «sikre lenker») og kan gjøre at den ikke virker — prøv privat e-post eller telefon hvis det gjentar seg.'
  }

  if (decoded) return decoded

  return 'Vi kunne ikke fullføre innlogging fra lenken. Prøv «Glemt passord» eller logg inn på nytt.'
}

/**
 * Viser tydelig melding når Supabase redirecter til Site URL med auth-feil (f.eks. utløpt passordlenke).
 */
export default function SupabaseAuthUrlErrorBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const parsed = readSupabaseAuthErrorFromWindow()
    if (!parsed) return
    setMessage(userMessage(parsed))
    stripSupabaseAuthErrorFromUrl()
  }, [])

  if (!message) return null

  return (
    <div
      role="alert"
      className="sticky top-0 z-[100] border-b px-4 py-3 shadow-sm"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        background: '#fff4f4',
        borderColor: '#ffc9c9',
        color: 'var(--text, #1E2B4F)',
      }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="min-w-0 text-sm leading-snug">{message}</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/glemt-passord"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-white touch-manipulation"
            style={{ background: 'var(--cta-gradient, linear-gradient(135deg, #3B5BDB, #4C6EF5))' }}
          >
            Glemt passord
          </Link>
          <Link
            href="/logg-inn"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-4 text-sm font-semibold touch-manipulation"
            style={{
              borderColor: 'var(--border, #D4DCF7)',
              background: 'var(--surface, #fff)',
              color: 'var(--primary, #3B5BDB)',
            }}
          >
            Logg inn
          </Link>
        </div>
      </div>
    </div>
  )
}
