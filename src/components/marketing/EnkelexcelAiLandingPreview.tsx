'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  FileText,
  LayoutGrid,
  Menu,
  MessageSquare,
  PiggyBank,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import LandingFooter from '@/components/marketing/LandingFooter'
import { CTA_HREF, LOGIN_HREF } from '@/components/marketing/constants'

const NAV = [
  { href: '#fordeler', label: 'Fordeler' },
  { href: '#moduler', label: 'Moduler' },
  { href: '#enkelt', label: 'Enkelt' },
  { href: '#kom-i-gang', label: 'Kom i gang' },
] as const

const MODULES = [
  { icon: Wallet, title: 'Budsjett og husholdning', text: 'Kategorier, mål og struktur som assistenten kan forklare i kontekst.' },
  { icon: Receipt, title: 'Transaksjoner', text: 'Faktisk forbruk og mønster over tid — grunnlag for konkrete spørsmål.' },
  { icon: TrendingDown, title: 'Gjeld', text: 'Oversikt som gjør det lettere å prioritere og følge nedbetaling.' },
  { icon: PiggyBank, title: 'Sparing og sparemål', text: 'Koble spørsmål til målene du har satt i appen.' },
  { icon: TrendingUp, title: 'Investering', text: 'Registrert posisjonsdata der du bruker det i appen.' },
  { icon: FileText, title: 'Rapporter', text: 'Sammendrag og utdrag som støtter oppfølging over tid.' },
] as const

const STEPS = [
  { n: '1', title: 'Opprett konto', text: 'Start prøveperiode og fyll inn dine tall i Smart Budsjett — ferdig struktur, enkelt oppsett.' },
  { n: '2', title: 'Bruk appen som vanlig', text: 'Transaksjoner, budsjett og mål. Jo mer som ligger inne, desto nyttigere blir spørsmålene dine.' },
  { n: '3', title: 'Spør EnkelExcel AI', text: 'Åpne assistenten og få svar med utgangspunkt i dataene dine — som hjelp, ikke personlig rådgivning.' },
] as const

export default function EnkelexcelAiLandingPreview() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const mobileNav =
    mobileOpen && typeof document !== 'undefined' ? (
      <div className="fixed inset-0 z-[60] lg:hidden" id="eex-landing-nav" role="dialog" aria-modal="true" aria-label="Navigasjon">
        <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk meny" onClick={close} />
        <aside
          className="absolute inset-y-0 left-0 flex w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto shadow-xl"
          style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b px-3 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Meny
            </span>
            <button
              type="button"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:opacity-90"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-label="Lukk meny"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-col gap-1 p-3">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/"
              onClick={close}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Hovedforside
            </Link>
          </div>
        </aside>
      </div>
    ) : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 max-w-[min(100%,12rem)] shrink items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:max-w-none sm:gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              SB
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
                EnkelExcel AI
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                Forhåndsvisning
              </p>
            </div>
          </Link>

          <nav className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-90 lg:hidden"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-expanded={mobileOpen}
              aria-controls="eex-landing-nav"
              aria-label={mobileOpen ? 'Lukk meny' : 'Åpne meny'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-flex lg:items-center"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={LOGIN_HREF}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 py-2 text-sm font-medium sm:px-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Logg inn
            </Link>
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[44px] max-w-[11rem] flex-col items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-semibold leading-tight text-white shadow-sm transition-opacity hover:opacity-95 sm:max-w-none sm:px-4 sm:text-sm"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              <span className="sm:hidden">Prøv gratis</span>
              <span className="hidden sm:inline">Start gratis prøveperiode</span>
            </Link>
          </nav>
        </div>
      </header>
      {mobileNav ? createPortal(mobileNav, document.body) : null}

      <main>
        <section id="topp" className="scroll-mt-24 relative overflow-hidden px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% -10%, var(--primary-pale), transparent)',
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Assistenten som kjenner tallene dine i Smart Budsjett
            </p>
            <h1
              className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.6rem]"
              style={{ color: 'var(--text)' }}
            >
              Spør. Få svar. Med utgangspunkt i <span className="whitespace-nowrap">dine data.</span>
            </h1>
            <p
              className="mx-auto mt-4 text-sm font-semibold leading-relaxed sm:text-base"
              style={{ color: 'var(--primary)' }}
            >
              Dine tall. Ett svar.
            </p>
            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              EnkelExcel AI er inne i appen: still spørsmål om budsjett, mønster, kategorier og veien videre — bygget på
              strukturert utdrag fra Smart Budsjett, ikke gjetting.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={CTA_HREF}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
              >
                Start gratis prøveperiode
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#fordeler"
                className="inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition-colors hover:opacity-90 sm:w-auto"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                Se fordelene
              </a>
            </div>
            <p className="mt-6 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Krever innlogging for å bruke assistenten. 14 dagers prøveperiode — tydelige vilkår før du betaler.
            </p>
          </div>
        </section>

        <section
          className="border-y px-4 py-8 text-center sm:px-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: 'var(--text)' }}>
            Dine tall. Ett svar.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Samme hjelpelinje — tydelig, gjentatt, lett å huske når du vurderer om dette er noe for deg.
          </p>
        </section>

        <section id="fordeler" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Hvorfor bruke det?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Mindre manuell leting i menyer — flere svar knyttet til det du faktisk har lagt inn.
            </p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                'Får med kontekst fra appen: budsjett, transaksjoner, mål og mer (etter hva som finnes hos deg).',
                'Forslag til spørsmål hvis du lurer på hvor du skal begynne.',
                'Designet som hjelpeverktøy — ikke personlig økonomisk, juridisk eller skattemessig rådgivning.',
                'Deler økosystem med Smart Budsjett — når modulen er tilgjengelig for kontoen din.',
              ].map((line) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-2xl p-4 sm:p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text)' }}>
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="moduler"
          className="scroll-mt-24 border-t px-4 py-14 sm:px-6 sm:py-16"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-center gap-2 sm:justify-center">
              <LayoutGrid className="mt-0.5 h-6 w-6 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
              <div className="text-center">
                <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                  Modulene assistenten bygger på
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
                  Spørsmål og svar knyttes til data du har i Smart Budsjett — for eksempel slik (avhengig av hva som er
                  registrert):
                </p>
              </div>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl p-5 text-left"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'var(--primary-pale)' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              EnkelExcel AI får med et utdrag i hver melding; store datasett kan teknisk avkortes. Dette er et
              hjelpeverktøy — svar kan ta feil; ved viktige valg, kontroller selv og ta kontakt med fagfolk der det trengs.
            </p>
          </div>
        </section>

        <section
          id="enkelt"
          className="scroll-mt-24 border-t px-4 py-14 sm:px-6 sm:py-16"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Så enkelt er det
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Ingen egen opplæring i prompt-teknikk — du bruker appen, så spør du.
            </p>
            <ol className="mt-10 space-y-4">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
                      {s.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="kom-i-gang"
          className="scroll-mt-24 border-t px-4 py-16 sm:px-6"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div
            className="mx-auto max-w-3xl overflow-hidden rounded-2xl p-8 text-center sm:p-10"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), var(--surface))',
              border: '1px solid var(--border)',
            }}
          >
            <div className="mb-3 flex justify-center" aria-hidden>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
              >
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Klar for å prøve?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Opprett konto, logg inn, og åpne EnkelExcel AI fra menyen. Allerede bruker? Logg inn og gå rett til
              assistenten.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href={CTA_HREF}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
              >
                Registrer deg
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={LOGIN_HREF}
                className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Logg inn og åpne assistenten
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              Etter innlogging: <span className="font-mono">/enkelexcel-ai</span> (også i venstremenyen)
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
