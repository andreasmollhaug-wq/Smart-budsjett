import Link from 'next/link'
import { COMPANY_NAME, COMPANY_ORG_NR_DISPLAY, CONTACT_EMAIL } from '@/lib/legal'
import {
  CTA_HREF,
  DOTTIR_OM_OSS_HREF,
  DOTTIR_UTFORSK_HREF,
  LOGIN_HREF,
  PRODUCT_DISPLAY_NAME,
  landingHorizontalPadding,
} from './constants'

const footerNavLink =
  'inline-flex min-h-[44px] items-center touch-manipulation rounded-lg px-1.5 py-1 text-sm font-medium transition-opacity hover:opacity-80'

type LandingFooterProps = {
  /** Dottir: vis Dottir som produktnavn i footer (samme selskap som hovedsiden). */
  variant?: 'default' | 'dottir'
}

export default function LandingFooter({ variant = 'default' }: LandingFooterProps) {
  const productTitle = PRODUCT_DISPLAY_NAME

  return (
    <footer
      className={`border-t py-10 ${landingHorizontalPadding}`}
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {productTitle}
          </p>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1 text-xs sm:justify-start" style={{ color: 'var(--text-muted)' }}>
            <span>Et produkt fra {COMPANY_NAME} ·</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="-mx-1 inline-flex min-h-[44px] items-center px-2 py-0.5 touch-manipulation underline underline-offset-2 transition-opacity hover:opacity-80 sm:mx-0"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Org.nr. {COMPANY_ORG_NR_DISPLAY}
          </p>
        </div>
        <nav className="flex max-w-xl flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center sm:text-left">
          {variant === 'dottir' ? (
            <>
              <Link href={DOTTIR_OM_OSS_HREF} className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
                Om oss
              </Link>
              <Link href={DOTTIR_UTFORSK_HREF} className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
                Utforsk alt
              </Link>
            </>
          ) : null}
          <Link href="/produktflyt" className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Produktflyt
          </Link>
          <Link href="/guider" className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Guider
          </Link>
          <Link href="/personvern" className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Personvern
          </Link>
          <Link href="/sikkerhet" className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Sikkerhet
          </Link>
          <Link href="/vilkar" className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Vilkår
          </Link>
          <Link href={CTA_HREF} className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Kom i gang
          </Link>
          <Link href={LOGIN_HREF} className={footerNavLink} style={{ color: 'var(--text-muted)' }}>
            Logg inn
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-5xl text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} {COMPANY_NAME}. Alle rettigheter forbeholdt.
      </p>
    </footer>
  )
}
