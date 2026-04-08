'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, BookOpen, X } from 'lucide-react'

type GuideStep = {
  id: string
  title: string
  lead: string
  bullets: string[]
  primary?: { href: string; label: string }
  pitfall: string
}

const STEPS: GuideStep[] = [
  {
    id: 'import-steg-1',
    title: 'Forbered CSV-filen fra Excel',
    lead:
      'Importen forventer samme oppsett som vår mal: overskriftsrad med DATO, TRANSAKSJON, KATEGORI og BELØP, pluss valgfri beskrivelse i femte kolonne.',
    bullets: [
      'Lagre som CSV UTF-8 (Excel: «Lagre som» → CSV UTF-8 eller tilsvarende).',
      'Du kan laste ned vår tomme mal fra knappen på importsiden og lime inn egne rader.',
      'Kolonnen TRANSAKSJON styrer om raden blir inntekt eller utgift: «Inntekt» → inntekt; alt annet (Regning, Utgift, …) → utgift.',
    ],
    primary: { href: '#import-opplasting', label: 'Hopp til opplasting' },
    pitfall:
      'Hvis overskriftsraden mangler eller er på feil rad, finner ikke appen kolonnene. Sjekk at første kolonne heter DATO og at du ikke har ekstra tomme kolonner som forskyver alt.',
  },
  {
    id: 'import-steg-2',
    title: 'Velg riktig profil (familie)',
    lead:
      'Transaksjoner knyttes til den profilen som er valgt når du importerer. Feil profil gir feil eierskap i husholdningen.',
    bullets: [
      'Med flere profiler: velg «Importer til profil» før du laster opp filen.',
      'Med én profil er valget allerede satt.',
    ],
    pitfall:
      'Bytter du profil etter at du har parsert filen, bør du starte på nytt og laste opp igjen så kategorimatching og summer stemmer.',
  },
  {
    id: 'import-steg-3',
    title: 'Last opp og følg stegene i skjermbildet',
    lead:
      'Etter opplasting leser appen filen og tar deg videre automatisk når det trengs.',
    bullets: [
      'Nye kategorinavn som ikke finnes i budsjettet ditt: du får liste med Ja/Nei — vi oppretter inntekts- eller utgiftskategori etter det som står i TRANSAKSJON-kolonnen.',
      'Deretter ser du forhåndsvisning med tabell og summer per budsjettgruppe (inntekter, regninger, utgifter, gjeld, sparing) til sammenligning med Excel.',
    ],
    primary: { href: '#import-opplasting', label: 'Gå til opplasting' },
    pitfall:
      'Rader med ugyldig dato eller beløp vises i parser-feillisten og importeres ikke — rett i Excel og prøv på nytt.',
  },
  {
    id: 'import-steg-4',
    title: 'Bekreft og kontroller etterpå',
    lead:
      'Når du trykker «Bekreft import», får du en oppsummering. Åpne deretter transaksjonslisten og se at alt ser riktig ut.',
    bullets: [
      'Fra oppsummeringen kan du gå rett til Transaksjoner med filter på år.',
      'Ved tvil: sammenlign totaler med filen din før du legger inn mer manuelt.',
    ],
    primary: { href: '/transaksjoner', label: 'Åpne transaksjoner' },
    pitfall:
      'Mulige duplikater advares i forhåndsvisning — samme dato, beløp, beskrivelse og kategori som allerede finnes. Vurder om du importerer to ganger.',
  },
]

function GuideStepCard({
  step,
  index,
  onAfterPrimary,
}: {
  step: GuideStep
  index: number
  onAfterPrimary?: () => void
}) {
  return (
    <article id={step.id} className="relative scroll-mt-4 pl-12 sm:pl-14">
      <div
        className="absolute left-0 top-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-bold shadow-sm z-10"
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
        className="rounded-2xl p-4 sm:p-5"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
          {step.title}
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {step.lead}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed list-disc pl-4" style={{ color: 'var(--text)' }}>
          {step.bullets.map((b, bi) => (
            <li key={bi}>{b}</li>
          ))}
        </ul>

        {step.primary && (
          <div className="mt-4">
            <PrimaryAction
              href={step.primary.href}
              label={step.primary.label}
              onAfterNavigate={onAfterPrimary}
            />
          </div>
        )}

        <p
          className="mt-4 text-xs leading-relaxed rounded-xl px-3 py-2"
          style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
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

function PrimaryAction({
  href,
  label,
  onAfterNavigate,
}: {
  href: string
  label: string
  onAfterNavigate?: () => void
}) {
  if (href.startsWith('#')) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
        style={{ background: 'var(--primary)' }}
        onClick={() => {
          onAfterNavigate?.()
          requestAnimationFrame(() => {
            const id = href.slice(1)
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
        }}
      >
        {label}
        <ArrowRight size={14} className="opacity-90" aria-hidden />
      </button>
    )
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
      style={{ background: 'var(--primary)' }}
      onClick={() => onAfterNavigate?.()}
    >
      {label}
      <ArrowRight size={14} className="opacity-90" aria-hidden />
    </Link>
  )
}

export type TransactionImportGuideModalProps = {
  open: boolean
  onClose: () => void
}

export default function TransactionImportGuideModal({ open, onClose }: TransactionImportGuideModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="flex max-h-[min(90vh,840px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-xl sm:max-w-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-guide-modal-title"
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Steg for steg
            </p>
            <h2 id="import-guide-modal-title" className="text-lg font-semibold mt-1" style={{ color: 'var(--text)' }}>
              Slik importerer du transaksjoner
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Samme struktur som «Kom i gang» — anbefalt rekkefølge fra Excel til ferdige transaksjoner.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 shrink-0"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk veiledning"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="shrink-0 flex flex-wrap gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }} aria-label="Hurtiglenker til steg">
          {STEPS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: 'var(--primary-pale)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }}
            >
              {i + 1}. {s.title.split('(')[0]!.trim()}
            </a>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="relative">
            <div
              className="absolute left-[17px] top-6 bottom-6 w-0.5 rounded-full pointer-events-none hidden sm:block"
              style={{
                background: 'linear-gradient(to bottom, var(--primary), var(--accent))',
                opacity: 0.45,
              }}
              aria-hidden
            />
            <div className="space-y-6 sm:space-y-8">
              {STEPS.map((step, index) => (
                <GuideStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  onAfterPrimary={onClose}
                />
              ))}
            </div>
          </div>

          <div
            className="mt-6 rounded-xl p-4"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold mb-1.5 text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <BookOpen size={16} className="opacity-80" aria-hidden />
              Mer hjelp
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Den utvidede veiledningen for hele appen finner du under{' '}
              <Link
                href="/konto/kom-i-gang"
                className="font-medium underline"
                style={{ color: 'var(--primary)' }}
                onClick={onClose}
              >
                Kom i gang
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            className="w-full rounded-xl py-2.5 text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
