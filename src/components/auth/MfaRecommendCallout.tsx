import Link from 'next/link'
import { Shield } from 'lucide-react'
import { mfaRecommendShort } from '@/lib/kontoCopy'

/** Kompakt anbefaling om tofaktor på registreringssiden — informativ, ikke blokkerende. */
export default function MfaRecommendCallout() {
  return (
    <div
      className="mb-6 flex gap-3 rounded-xl px-4 py-3 text-sm min-w-0"
      style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
      role="note"
    >
      <Shield size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} aria-hidden />
      <div className="min-w-0">
        <p className="break-words" style={{ color: 'var(--text)' }}>{mfaRecommendShort}</p>
        <p className="mt-2">
          <Link
            href="/sikkerhet"
            className="text-xs font-medium underline-offset-2 hover:underline min-h-[44px] inline-flex items-center touch-manipulation"
            style={{ color: 'var(--primary)' }}
          >
            Les mer om sikkerhet
          </Link>
        </p>
      </div>
    </div>
  )
}
