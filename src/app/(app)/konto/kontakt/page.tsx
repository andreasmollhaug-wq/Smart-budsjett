import Link from 'next/link'
import { Mail } from 'lucide-react'
import { COMPANY_NAME, COMPANY_ORG_NR_DISPLAY, CONTACT_EMAIL } from '@/lib/legal'

export default function KontoKontaktPage() {
  return (
    <>
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Mail size={16} style={{ color: 'var(--primary)' }} />
          Kontakt oss
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Har du spørsmål om Smart Budsjett eller trenger hjelp? Send oss en e-post, så tar vi kontakt så snart vi kan.
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text)' }}>{COMPANY_NAME}</span>
          {' · Org.nr. '}
          {COMPANY_ORG_NR_DISPLAY}
          {' · '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--primary)' }}
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          For personvern og vilkår, se{' '}
          <Link href="/personvern" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--primary)' }}>
            personvernerklæringen
          </Link>{' '}
          og{' '}
          <Link href="/vilkar" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--primary)' }}>
            bruksvilkårene
          </Link>
          .
        </p>
      </div>
    </>
  )
}
