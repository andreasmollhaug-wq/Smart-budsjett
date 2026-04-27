'use client'

import Link from 'next/link'

export function HjemFlytStartPage() {
  return (
    <div className="space-y-8 max-w-2xl min-w-0 mx-auto pb-2">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Velkommen til HjemFlyt
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Her får hele husholdningen oversikt over oppgaver hjemme — med valgfri poengmotivasjon for barn.
        </p>
      </header>

      <section
        className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Hva er HjemFlyt?
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Du legger inn oppgaver (eller velger fra forslagslisten under innstillinger på oversikten). Barn og voksne
          markerer når noe er gjort. Med poeng kan en voksen godkjenne før det teller — det bygger trygg rutine.
        </p>
      </section>

      <section
        className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
        style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Ikke det samme som budsjett
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Poeng i HjemFlyt er bare motivasjon her i modulen. De kobles ikke til kroner, budsjett eller transaksjoner i
          Smart Budsjett.
        </p>
      </section>

      <section
        className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Hvem er med?
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          På <strong style={{ color: 'var(--text)' }}>oversikten</strong> kan du under innstillinger velge hvilke
          profiler som deltar i HjemFlyt — da styrer du hvem «Alle kan ta den»-oppgaver gjelder for. Profiler som ikke
          er med, ser fortsatt oversikten som voksne, men er ikke i den felles poolen. For enkelte oppgaver kan du i
          stedet bruke <strong style={{ color: 'var(--text)' }}>Kun valgte</strong> eller{' '}
          <strong style={{ color: 'var(--text)' }}>Ruller mellom valgte</strong>.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Barneprofiler og emoji setter du under{' '}
          <Link href="/konto/profiler" className="font-medium underline touch-manipulation" style={{ color: 'var(--primary)' }}>
            Konto → Profiler
          </Link>
          .
        </p>
      </section>

      <section
        className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Vanlige oppgaver
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Under innstillinger på oversikten finner du et forslagsbibliotek med typiske husoppgaver — kryss av og legg
          inn flere på én gang.
        </p>
      </section>

      <section
        className="rounded-2xl p-4 sm:p-5 space-y-4 min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Barnevisning
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          En enklere skjerm for barn — bytt til barneprofilen i profilvelgeren, eller åpne fanen under.
        </p>
        <Link
          href="/hjemflyt/barn"
          className="inline-flex min-h-[44px] items-center justify-center px-5 rounded-xl text-sm font-semibold touch-manipulation w-full sm:w-auto"
          style={{ background: 'var(--primary-pale)', color: 'var(--primary)', border: '1px solid var(--border)' }}
        >
          Åpne barnevisning
        </Link>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/hjemflyt"
          className="inline-flex min-h-[48px] items-center justify-center px-6 rounded-xl text-base font-semibold touch-manipulation w-full sm:flex-1"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          Gå til oversikt
        </Link>
      </div>
    </div>
  )
}
