'use client'

import Link from 'next/link'
import { smartvanePageInner } from '@/features/smartvane/layoutClasses'
import { useSmartvaneTour } from '@/features/smartvane/SmartvaneTourProvider'
import { smartvanePaths } from '@/features/smartvane/paths'

export function SmartvaneStartHerPage() {
  const { startTour, startExtendedTour } = useSmartvaneTour()

  return (
    <div className={smartvanePageInner}>
      <div
        data-sv-tour="start-intro"
        className="rounded-2xl border p-5 shadow-sm mb-6"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 8px 28px -16px rgba(30, 43, 79, 0.14)',
        }}
      >
        <div data-sv-tour="ext-intro" className="space-y-4">
          <h2 className="text-xl font-bold m-0" style={{ color: 'var(--text)' }}>
            Start her
          </h2>
          <p className="text-sm m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            SmartVane hjelper deg med små vaner som bygges over måneder. Kjør en interaktiv gjennomgang for å se hvor alt
            ligger, eller les punktlisten under.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => startTour()}
              className="flex w-full min-h-[48px] min-w-0 items-center justify-center rounded-xl border text-sm font-semibold touch-manipulation sm:w-auto sm:min-w-[12rem]"
              style={{
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                background: 'var(--primary-pale)',
              }}
            >
              Vis meg rundt
            </button>
            <button
              type="button"
              onClick={() => startExtendedTour()}
              className="flex w-full min-h-[48px] min-w-0 items-center justify-center rounded-xl border text-sm font-semibold touch-manipulation sm:min-w-[12rem]"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                background: 'var(--bg)',
              }}
            >
              Utvidet gjennomgang
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm mb-6 m-0" style={{ color: 'var(--text-muted)' }}>
        Snarvei til arbeidsflaten:{' '}
        <Link href={smartvanePaths.today} className="font-medium underline" style={{ color: 'var(--primary)' }}>
          I dag
        </Link>
        .
      </p>

      <ol className="space-y-4 text-sm m-0 pl-4" style={{ color: 'var(--text)' }}>
        <li>
          <strong>1. Velg måned</strong>
          <p className="m-0 mt-1" style={{ color: 'var(--text-muted)' }}>
            Under «Måned» kan du bla mellom måneder. Nye måneder opprettes automatisk når du åpner dem.
          </p>
        </li>
        <li>
          <strong>2. Legg til vaner</strong>
          <p className="m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
            På «I dag» eller i månedsoversikten legger du inn daglige, ukentlige eller månedlige vaner. Valgfritt mål for
            antall dager per måned for daglige vaner.
          </p>
        </li>
        <li>
          <strong>3. Kryss av</strong>
          <p className="m-0 mt-1" style={{ color: 'var(--text-muted)' }}>
            Ett trykk per avkrysning. Ukentlige vaner har én boks per «uke-rad» i kalenderen (dag 1–7, 8–14, …). Månedlige
            har opptil to kryss.
          </p>
        </li>
        <li>
          <strong>4. Se innsikt</strong>
          <p className="m-0 mt-1" style={{ color: 'var(--text-muted)' }}>
            Under «Innsikt» finner du trend, ukedager, streaks og toppliste — uten å måtte regne selv.
          </p>
        </li>
      </ol>

      <section
        className="mt-8 rounded-2xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-sm font-semibold m-0 mb-2" style={{ color: 'var(--text)' }}>
          Vanlige spørsmål
        </h2>
        <dl className="text-sm space-y-3 m-0">
          <div>
            <dt className="font-medium" style={{ color: 'var(--text)' }}>
              Hva betyr daglig mål?
            </dt>
            <dd className="m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Hvor mange <em>forskjellige</em> daglige vaner du ønsker å fullføre på én dag (standard 10). Det er adskilt
              fra mål per vane.
            </dd>
          </div>
          <div>
            <dt className="font-medium" style={{ color: 'var(--text)' }}>
              Hva skjer når jeg går glipp av en dag?
            </dt>
            <dd className="m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Ingen straffetekster her — bare kryss av neste mulighet. Streak viser hva du har bygget, ikke at du har
              «feilet».
            </dd>
          </div>
        </dl>
      </section>

      <div
        data-sv-tour="ext-done"
        className="mt-8 rounded-2xl border p-5 shadow-sm"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 8px 28px -16px rgba(30, 43, 79, 0.1)',
        }}
      >
        <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
          Når du husker dette, er du i gang
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed m-0 pl-0" style={{ color: 'var(--text)' }}>
          <li>I dag = avkrysning og «Legg til vane».</li>
          <li>Måned = pilene, diagram, daglig mål, kalenderrutenett, ukentlige rader, månedlige spor, kopier til neste måned.</li>
          <li>Innsikt = trend, ukedager, streak, toppliste og oppsummering.</li>
          <li>Bunnmenyen skifter måned for Måned/Innsikt — Start gjenåpner denne hjelpesiden.</li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed m-0" style={{ color: 'var(--text-muted)' }}>
          «Vis meg rundt» og «Utvidet gjennomgang» finner du her og som «Rundtur» / «Utvidet» øverst på I dag, Måned og
          Innsikt.
        </p>
      </div>
    </div>
  )
}
