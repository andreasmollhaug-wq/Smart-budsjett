'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST } from '@/lib/bankImport/bankImport.constants'
import { ArrowRight, BookOpen, X } from 'lucide-react'

export type TransactionImportGuideMode =
  | 'template_csv'
  | 'bank_dnb'
  | 'bank_sparebank1'
  | 'bank_neonomics'

type GuideStep = {
  id: string
  title: string
  lead: string
  bullets: string[]
  primary?: { href: string; label: string }
  pitfall: string
}

const GUIDE_STEPS_CSV: GuideStep[] = [
  {
    id: 'import-csv-steg-1',
    title: 'Forbered CSV-filen fra Excel',
    lead:
      'Importen forventer samme oppsett som vår mal: overskriftsrad med DATO, TRANSAKSJON, KATEGORI og BELØP, pluss valgfri beskrivelse i femte kolonne.',
    bullets: [
      'Lagre som CSV UTF-8 (Excel: «Lagre som» → CSV UTF-8 eller tilsvarende).',
      'Du kan laste ned vår tomme mal fra knappen på importsiden og lime inn egne rader.',
      'Kolonnen TRANSAKSJON styrer om raden blir inntekt eller utgift: «Inntekt» → inntekt; alt annet (Regning, Utgift, …) → utgift.',
      'BELØP kan ha tusenskille og komma som desimal; beløp lagres med inntil to desimaler.',
    ],
    primary: { href: '#import-opplasting', label: 'Hopp til opplasting' },
    pitfall:
      'Hvis overskriftsraden mangler eller er på feil rad, finner ikke appen kolonnene. Sjekk at første kolonne heter DATO og at du ikke har ekstra tomme kolonner som forskyver alt.',
  },
  {
    id: 'import-csv-steg-2',
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
    id: 'import-csv-steg-3',
    title: 'Opplasting, ukjente kategorier og forhåndsvisning',
    lead:
      'Etter opplasting leser appen filen og tar deg videre automatisk når det trengs.',
    bullets: [
      'Nye kategorinavn som ikke finnes i budsjettet: du får liste med Ja/Nei — vi oppretter inntekts- eller utgiftskategori etter det som står i TRANSAKSJON-kolonnen.',
      'Forhåndsvisning viser summer per budsjettgruppe og tabell med alle rader. Kontoregulering (typisk egne overføringer) ligger i egen seksjon — samme import, samlet for oversikt.',
      'Bruk «Utvid forhåndsvisning» om du trenger mer plass på skjermen.',
    ],
    primary: { href: '#import-opplasting', label: 'Gå til opplasting' },
    pitfall:
      'Rader med ugyldig dato eller beløp vises i parser-feillisten og importeres ikke — rett i Excel og prøv på nytt.',
  },
  {
    id: 'import-csv-steg-4',
    title: 'Navn, budsjett og bekreft import',
    lead:
      'Når alt ser riktig ut, kan du legge inn et valgfritt navn, eventuelt krysse av for budsjettjustering, og trykke «Bekreft import».',
    bullets: [
      '«Navn på import (valgfritt)» vises under «Tidligere Excel-importer».',
      '«Legg også til i budsjett» øker planlagte månedsbeløp for treffende kategorier og måneder (med kjente begrensninger for delt husstandsbudsjett).',
      'Du får oppsummering etter import; åpne transaksjonslisten for å dobbeltsjekke.',
    ],
    primary: { href: '/transaksjoner', label: 'Åpne transaksjoner' },
    pitfall:
      'Mulige duplikater advares i forhåndsvisning — samme dato, beløp, beskrivelse og kategori som allerede finnes. Vurder om du importerer to ganger.',
  },
]

const GUIDE_STEPS_BANK: GuideStep[] = [
  {
    id: 'import-bank-steg-1',
    title: 'Fil fra DNB eller Sbanken',
    lead:
      'Last opp Excel (.xlsx) fra nettbanken eller en CSV med samme kolonner (Dato, Forklaring, Rentedato, Ut fra konto, Inn på konto).',
    bullets: [
      'Beløp og dato tolkes ut fra bankens eksport; beløp lagres med inntil to desimaler.',
      'Punktum som desimal fra Excel (f.eks. 499.5) støttes.',
      'Har du hovedbok fra regnskap i stedet for bankkontoutskrifter, bruk egen flyt under Import fra regnskap.',
    ],
    primary: { href: '#import-opplasting', label: 'Hopp til opplasting' },
    pitfall:
      'Mangler overskriftsraden eller kolonnene, får du feil ved lesing — eksporter på nytt fra banken og sjekk at første rad er kolonnenavn.',
  },
  {
    id: 'import-bank-steg-2',
    title: 'Velg riktig profil (familie)',
    lead:
      'Transaksjoner knyttes til den profilen som er valgt ved import. Feil profil gir feil eierskap i husholdningen.',
    bullets: [
      'Med flere profiler: velg «Importer til profil» før du laster opp filen.',
      'Med én profil er valget allerede satt.',
    ],
    pitfall:
      'Bytter du profil etter opplasting, bør du starte på nytt slik at kartlegging og summer stemmer.',
  },
  {
    id: 'import-bank-steg-3',
    title: 'Kartlegging per forklaring og KI',
    lead:
      'Hver unike forklaringstekst skal knyttes til en budsjettkategori. Filteret «Trenger kartlegging» viser bare det som ikke er mappet ennå.',
    bullets: [
      '«Utvid kartlegging» åpner hele listen i fullskjerm når du har mange linjer.',
      '«Foreslå kategorier med KI» sender forklaringstekster (og kategorilister) til modellen — ikke enkeltbeløp eller dato per rad.',
      `Mange uklassifiserte typer deles i batcher (maks ${BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST} unike nøkler per API-kall). Appen kjører flere kall automatisk ved behov; hvert steg teller som én melding mot AI-kvoten denne måneden.`,
    ],
    primary: { href: '#import-opplasting', label: 'Gå til opplasting' },
    pitfall:
      'KI kan foreslå feil kategori — kontroller alltid mot egne vaner før du går videre til forhåndsvisning.',
  },
  {
    id: 'import-bank-steg-4',
    title: 'Forhåndsvisning før du bekrefter',
    lead:
      'Her kan du justere kategori og beløp per rad. Kategoriendring for en forklaringstype gjenbrukes neste gang du importerer samme tekstmønster.',
    bullets: [
      'Beløpsendring i tabellen gjelder bare denne importen.',
      'Kontoregulering samles i egen seksjon som i Excel-flyten.',
      '«Utvid forhåndsvisning» gir samme tabell i fullskjerm.',
      '«Navn på import (valgfritt)» og «Legg også til i budsjett» fungerer som for Excel-mal.',
    ],
    pitfall:
      'Husk å sjekke advarsel om mulige duplikater mot eksisterende transaksjoner før du bekrefter.',
  },
  {
    id: 'import-bank-steg-5',
    title: 'Etter import og tidligere kjøringer',
    lead:
      'Når importen er fullført, ligger den under «Tidligere bankimporter». Derfra kan du åpne detaljer eller rette visningsnavn.',
    bullets: [
      '«Rediger» (visningsnavn) gjør det lettere å kjenne igjen riktig kjøring i listen.',
      'For enkeltposter: åpne Transaksjoner og juster der.',
    ],
    primary: { href: '/transaksjoner', label: 'Åpne transaksjoner' },
    pitfall:
      'Sletter du en import, velg om transaksjoner skal fjernes eller bare historikkposten — valget påvirker ikke nødvendigvis budsjett du allerede har justert manuelt.',
  },
]

const GUIDE_STEPS_BANK_NEONOMICS: GuideStep[] = [
  {
    id: 'import-bank-neo-steg-1',
    title: 'Koble bank (Neonomics sandbox)',
    lead:
      'Velg «Bank – Neonomics (sandbox)» som importkilde. Koble bank under Min konto → Koble til bank — listen hentes fra Neonomics.',
    bullets: [
      'DNB og Sbanken sandbox: test-personnummer 31125461118 (kryptert som x-psu-id). Folio krever ikke personnummer.',
      'Etter vellykket kobling kan du hente transaksjoner (ca. siste 12 måneder).',
    ],
    primary: { href: '#import-opplasting', label: 'Hopp til kobling' },
    pitfall:
      'Mangler server-oppsett (nøkler, krypteringsfil, migrasjon i Supabase), vises ikke importkilden eller API returnerer feil.',
  },
  ...GUIDE_STEPS_BANK.slice(1).map((step, i) => ({
    ...step,
    id: `import-bank-neo-steg-${i + 2}`,
    title:
      i === 0
        ? 'Velg riktig profil (familie)'
        : i === 1
          ? 'Kartlegging og KI (som filimport)'
          : i === 2
            ? 'Forhåndsvisning og import'
            : 'Etter import og re-sync',
    lead:
      i === 1
        ? 'Hentede transaksjoner kartlegges som bankfil: forklaring → budsjettkategori. Du kan bruke KI-forslag som for DNB Excel.'
        : step.lead,
  })),
]

const GUIDE_STEPS_BANK_SPAREBANK1: GuideStep[] = [
  {
    id: 'import-bank-sb1-steg-1',
    title: 'Fil fra Sparebank 1',
    lead:
      'Velg «Sparebank 1» som importkilde på denne siden. Last opp Excel (.xlsx) eller CSV med overskrifter som i nettbank-eksport: Dato, Beskrivelse, Rentedato, Inn, Ut (og eventuelt Til konto / Fra konto — sistnevnte brukes ikke til beløp).',
    bullets: [
      'Beskrivelse brukes som tekst for kategori-kartlegging (samme rolle som «Forklaring» hos DNB).',
      'Beløp leses fra Inn eller Ut; én av kolonnene skal være tom per rad.',
      'Har du hovedbok fra regnskap i stedet for bankkontoutskrifter, bruk egen flyt under Import fra regnskap.',
    ],
    primary: { href: '#import-opplasting', label: 'Hopp til opplasting' },
    pitfall:
      'Feil importkilde (DNB vs Sparebank 1) gir feil kolonneoppsett. Velg riktig bank under «Importkilde» før du laster opp.',
  },
  ...GUIDE_STEPS_BANK.slice(1).map((step, i) => ({
    ...step,
    id: `import-bank-sb1-steg-${i + 2}`,
  })),
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
  mode: TransactionImportGuideMode
}

export default function TransactionImportGuideModal({ open, onClose, mode }: TransactionImportGuideModalProps) {
  const steps = useMemo(() => {
    if (mode === 'template_csv') return GUIDE_STEPS_CSV
    if (mode === 'bank_sparebank1') return GUIDE_STEPS_BANK_SPAREBANK1
    if (mode === 'bank_neonomics') return GUIDE_STEPS_BANK_NEONOMICS
    return GUIDE_STEPS_BANK
  }, [mode])
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

  const backdropDismiss = useModalBackdropDismiss(onClose)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      role="presentation"
      {...backdropDismiss}
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
              {mode === 'template_csv'
                ? 'Slik importerer du fra Excel-mal'
                : mode === 'bank_sparebank1'
                  ? 'Slik importerer du fra Sparebank 1'
                  : mode === 'bank_neonomics'
                    ? 'Slik importerer du via Neonomics (sandbox)'
                    : 'Slik importerer du fra DNB / Sbanken'}
            </h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {mode === 'template_csv'
                ? 'Veiledningen følger CSV-mal-flyten på denne siden — fra fil til ferdige transaksjoner.'
                : 'Veiledningen følger bank-flyten — kartlegging, valgfritt KI, forhåndsvisning og import.'}
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
          {steps.map((s, i) => (
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
            <div key={mode} className="space-y-6 sm:space-y-8">
              {steps.map((step, index) => (
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
