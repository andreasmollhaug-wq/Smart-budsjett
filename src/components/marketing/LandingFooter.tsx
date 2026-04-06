import Link from 'next/link'
import { CTA_HREF, LOGIN_HREF } from './constants'

export default function LandingFooter() {
  return (
    <footer className="border-t px-4 py-10 sm:px-6" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Smart Budsjett
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Et produkt fra EnkelExcel · kontakt@enkelexcel.no (oppdater med ekte adresse)
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <Link href="/personvern" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Personvern
          </Link>
          <Link href="/vilkar" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Vilkår
          </Link>
          <Link href={CTA_HREF} className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Kom i gang
          </Link>
          <Link href={LOGIN_HREF} className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            Logg inn
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-5xl text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} EnkelExcel. Alle rettigheter forbeholdt.
      </p>
    </footer>
  )
}
