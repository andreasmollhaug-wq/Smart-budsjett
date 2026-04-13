'use client'

import Link from 'next/link'
import { MessageSquare, ArrowDown, ArrowRight } from 'lucide-react'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'

type JourneyStep = {
  id: string
  title: string
  lead: string
  bullets: string[]
  primary: { href: string; label: string }
  extraLinks?: { href: string; label: string }[]
  pitfall: string
}

const STEPS: JourneyStep[] = [
  {
    id: 'steg-1',
    title: 'Start med budsjettår og hovedinntekt',
    lead:
      'Alt annet i appen bygger på at du har valgt riktig år og en realistisk hovedinntekt. Det er «kartet» resten av tallene forholder seg til.',
    bullets: [
      'Sjekk at budsjettåret matcher det du vil planlegge for (du kan bytte år fra budsjettsiden senere).',
      'Sett inn omtrentlig månedslønn etter skatt på linjen for lønn — du finpusser når du kjenner tallene bedre.',
    ],
    primary: { href: '/budsjett', label: 'Åpne budsjettet' },
    pitfall:
      'Hvis inntekten står på null eller er urealistisk høy, vil både oversikt og «brukt mot plan» føles meningsløse. Juster tidlig.',
  },
  {
    id: 'steg-2',
    title: 'Bygg budsjettet linje for linje',
    lead:
      'Når grunnlaget ligger der, er neste steg å speile virkeligheten: faste regninger, typiske utgifter og sparing du faktisk vil holde.',
    bullets: [
      'Legg til eller skjul linjer i gruppene Inntekter, Regninger, Utgifter, Gjeld og Sparing.',
      'Fordel beløp per måned der det svinger (ferie, forsikring, julegaver).',
      'Under Min konto → Budsjettkategorier kan du tilpasse hvilke kategorier som foreslås i nedtrekk.',
    ],
    primary: { href: '/budsjett', label: 'Gå til budsjett' },
    extraLinks: [{ href: '/konto/budsjett-kategorier', label: 'Budsjettkategorier' }],
    pitfall:
      'Et «perfekt på papiret»-budsjett som ikke matcher livet ditt gir bare dårlig samvittighet. Start enkelt og juster etter noen uker.',
  },
  {
    id: 'steg-3',
    title: 'Få faktiske tall inn med transaksjoner',
    lead:
      'Budsjettet er planen; transaksjonene er det som skjedde. Når du registrerer utgifter og inntekter, kobles «brukt» mot budsjett der kategoriene matcher.',
    bullets: [
      'Registrer gjerne etter lønning eller én gang i uken — viktigere er at det blir en vane.',
      'Velg riktig kategori slik at grafer og budsjettkolonner gir mening.',
      'Bruk transaksjonsdashboardet når du vil se mønstre før du går tilbake og justerer budsjettet.',
    ],
    primary: { href: '/transaksjoner', label: 'Åpne transaksjoner' },
    extraLinks: [{ href: '/transaksjoner/dashboard', label: 'Transaksjonsdashboard' }],
    pitfall:
      'Uten transaksjoner ser du bare plan — ikke om du holder deg innenfor. Én liten økt med innlegging løfter hele oversikten.',
  },
  {
    id: 'steg-4',
    title: 'Se helheten på oversikten',
    lead:
      'Når både plan og noe faktisk finnes, gir dashbordet deg trend, topp utgifter og et raskt svar på «hvordan går det nå?».',
    bullets: [
      'Sammenlign inntekt og utgifter over de siste månedene.',
      'Følg med på kortene for gjeld, sparing og investering når du har lagt inn data der.',
      'Med familieabonnement: bytt profil øverst eller velg husholdning for summerte tall.',
    ],
    primary: { href: '/dashboard', label: 'Åpne oversikten' },
    pitfall:
      'I husholdningsvisning er mange skjemaer skrivebeskyttet — bytt til én profil når du skal endre budsjett eller transaksjoner.',
  },
  {
    id: 'steg-5',
    title: 'Sparing, gjeld og videre strategi',
    lead:
      'Når grunnflyten sitter, kan du bruke appen til målrettet sparing, oversikt over lån og — om du vil — nedbetalingsstrategi.',
    bullets: [
      'Opprett sparemål og koble dem gjerne til en sparelinje i budsjettet.',
      'Registrer lån med avdrag og renter slik at gjeldssiden og rapporter blir riktige.',
      'Snøball bruker gjelden du har lagt inn og lar deg simulere ekstra nedbetaling.',
    ],
    primary: { href: '/sparing', label: 'Sparing' },
    extraLinks: [
      { href: '/gjeld', label: 'Gjeld' },
      { href: '/snoball', label: 'Snøball' },
    ],
    pitfall:
      'Snøball og rapporter forutsetter at gjeld og beløp stemmer omtrent med virkeligheten — ta en runde med tallene før du tolker strategien.',
  },
  {
    id: 'steg-6',
    title: 'Rapporter, investering og AI-hjelp',
    lead:
      'Når du vil dokumentere for banken, sparebanken eller egen arkiv, eller følge porteføljen i appen, finnes egne moduler.',
    bullets: [
      'Rapport til bank og sparemålrapport: velg periode og bruk utskrift eller PDF der det støttes.',
      'Investering samler posisjoner og avkastning i appen — det erstatter ikke rådgivning.',
      'EnkelExcel AI kan forklare hvordan funksjonene henger sammen og hjelpe deg innenfor det appen faktisk gjør.',
    ],
    primary: { href: '/rapporter', label: 'Rapporter' },
    extraLinks: [
      { href: '/investering', label: 'Investering' },
      { href: '/enkelexcel-ai', label: 'EnkelExcel AI' },
    ],
    pitfall:
      'AI gir ikke personlig økonomisk eller skatteråd — bruk den som brukshjelp og til å forstå appen.',
  },
]

const EXTRA_MODULES: { href: string; label: string; hint: string }[] = [
  { href: '/sparing/formuebygger', label: 'Formuebyggeren PRO', hint: 'Langsiktig simulering av formue og kjøpekraft.' },
]

function JourneyStepCard({ step, index }: { step: JourneyStep; index: number }) {
  const { ref, visible } = useRevealOnScroll()

  return (
    <article
      ref={ref}
      id={step.id}
      className={`relative scroll-mt-24 pl-14 transition-all duration-500 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div
        className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm z-10"
        style={{
          background: 'var(--surface)',
          border: '2px solid var(--primary)',
          color: 'var(--primary)',
        }}
        aria-hidden
      >
        {index + 1}
      </div>

      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-base font-semibold leading-snug" style={{ color: 'var(--text)' }}>
          {step.title}
        </h2>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {step.lead}
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed list-disc pl-5" style={{ color: 'var(--text)' }}>
          {step.bullets.map((b, bi) => (
            <li key={bi}>{b}</li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={step.primary.href}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
            style={{ background: 'var(--primary)' }}
          >
            {step.primary.label}
            <ArrowRight size={14} className="opacity-90" aria-hidden />
          </Link>
          {step.extraLinks?.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium underline underline-offset-2"
              style={{ color: 'var(--primary)' }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <p
          className="mt-5 text-xs leading-relaxed rounded-xl px-3 py-2.5"
          style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
        >
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            Vanlig fallgruve:{' '}
          </span>
          {step.pitfall}
        </p>
      </div>
    </article>
  )
}

export default function KomIGangJourney() {
  return (
    <div className="space-y-8">
      <header
        className="rounded-2xl p-6 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p
          className="text-xs font-medium uppercase tracking-wide mb-2 animate-[komIgangHero_0.55s_ease-out_both]"
          style={{ color: 'var(--text-muted)' }}
        >
          Din vei i appen
        </p>
        <h1
          className="text-xl font-semibold sm:text-2xl animate-[komIgangHero_0.55s_ease-out_both]"
          style={{ color: 'var(--text)', animationDelay: '70ms' }}
        >
          Utvidet kom i gang
        </h1>
        <p
          className="text-sm mt-3 leading-relaxed max-w-2xl animate-[komIgangHero_0.55s_ease-out_both]"
          style={{ color: 'var(--text-muted)', animationDelay: '140ms' }}
        >
          Følg stegene under i ro og mak — de speiler en anbefalt rekkefølge fra første budsjett til rapporter og verktøy.
          Startveiledningen du så ved oppstart dekker bare det korteste oppsettet; her går vi dypere.
        </p>

        <nav
          className="mt-5 flex flex-wrap gap-2 animate-[komIgangHero_0.55s_ease-out_both]"
          style={{ animationDelay: '210ms' }}
          aria-label="Hurtiglenker til steg"
        >
          {STEPS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: 'var(--primary-pale)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              {i + 1}. {s.title.split(',')[0]}
            </a>
          ))}
        </nav>

        <p
          className="mt-4 flex items-center gap-2 text-xs animate-[komIgangHero_0.55s_ease-out_both]"
          style={{ color: 'var(--text-muted)', animationDelay: '280ms' }}
        >
          <ArrowDown size={14} className="shrink-0" aria-hidden />
          Scroll nedover — hvert steg vises når det kommer inn i skjermen.
        </p>
      </header>

      <div className="relative">
        <div
          className="absolute left-[19px] top-8 bottom-8 w-0.5 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, var(--primary), var(--accent))',
            opacity: 0.45,
          }}
          aria-hidden
        />

        <div className="space-y-10 sm:space-y-12">
          {STEPS.map((step, index) => (
            <JourneyStepCard key={step.id} step={step} index={index} />
          ))}
        </div>
      </div>

      <section
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Kort: beste praksis
        </h2>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5" style={{ color: 'var(--text-muted)' }}>
          <li>Juster budsjettet når livet endrer seg — planen skal tjene deg, ikke omvendt.</li>
          <li>Hold transaksjoner oppdatert; selv små beløp gir bedre innsikt over tid.</li>
          <li>Test gjerne med demodata under Innstillinger, slik at du ser sammenhengen før du legger inn alt selv.</li>
          <li>Smart Budsjett er et planleggingsverktøy, ikke personlig økonomisk eller skatterådgivning.</li>
        </ul>
      </section>

      <section
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Flere moduler
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Alle hovedsidene finnes også i venstremenyen. Her er noen du ikke gikk gjennom som egne steg:
        </p>
        <ul className="space-y-2">
          {EXTRA_MODULES.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="text-sm font-medium underline" style={{ color: 'var(--primary)' }}>
                {m.label}
              </Link>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {' '}
                — {m.hint}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start gap-4"
        style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
      >
        <MessageSquare size={22} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
        <div>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Lurer du på noe underveis?
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
            I EnkelExcel AI kan du spørre hvordan funksjoner fungerer i appen og få hjelp til å sette opp budsjett, sparing
            og gjeld — innenfor det som faktisk støttes.
          </p>
          <Link
            href="/enkelexcel-ai"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline"
            style={{ color: 'var(--primary)' }}
          >
            Åpne EnkelExcel AI
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}
