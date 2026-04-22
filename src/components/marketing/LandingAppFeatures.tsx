'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  PiggyBank,
  Receipt,
  Snowflake,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { landingHorizontalPadding } from './constants'

type FeatureItem = {
  id: string
  icon: typeof Wallet
  title: string
  text: string
  color: string
  paragraphs: string[]
}

const features: FeatureItem[] = [
  {
    id: 'oversikt',
    icon: LayoutDashboard,
    title: 'Oversikt',
    text: 'Samlet bilde av økonomien din på dashbordet.',
    color: '#3B5BDB',
    paragraphs: [
      'På oversikten ser du hovedtallene samlet: inntekter, utgifter og hva som er igjen — slik at du raskt forstår om måneden ser sunn ut.',
      'Du kan bruke dashbordet som utgangspunkt før du går dypere inn i budsjett, transaksjoner eller sparing.',
    ],
  },
  {
    id: 'budsjett',
    icon: Wallet,
    title: 'Budsjett',
    text: 'Planlegg inntekter og utgifter med ferdig struktur.',
    color: '#4C6EF5',
    paragraphs: [
      'Budsjettsiden er satt opp med struktur og kategorier på forhånd, så du slipper å bygge alt fra bunnen av.',
      'Du fyller inn egne beløp og justerer underveis når inntekt eller vaner endrer seg — tallene henger sammen med resten av løsningen.',
      'På inntekter kan du bruke brutto med et valgfritt trekkprosent (forenklet skatt), slik at månedstallene speiler det du beholder etter trekk.',
    ],
  },
  {
    id: 'transaksjoner',
    icon: Receipt,
    title: 'Transaksjoner',
    text: 'Før og kategoriser kjøp slik at tallene stemmer.',
    color: '#0CA678',
    paragraphs: [
      'Her registrerer du kjøp og utgifter og fordeler dem i kategorier, slik at budsjett og grafer blir riktige.',
      'Jo mer du følger med, jo tydeligere blir bildet av hvor pengene faktisk går.',
      'For lønnsinntekt kan du føre brutto og la appen ta hensyn til trekk, eller registrere netto — det som passer deg.',
    ],
  },
  {
    id: 'sparing',
    icon: PiggyBank,
    title: 'Sparing',
    text: 'Følg med på sparemål og fremdrift.',
    color: '#F08C00',
    paragraphs: [
      'Sett opp sparemål og se fremdrift over tid — nyttig når du vil prioritere buffer, ferie eller noe større.',
      'Sparing er knyttet til oversikten din, så du ser målet i sammenheng med resten av økonomien.',
    ],
  },
  {
    id: 'gjeld',
    icon: CreditCard,
    title: 'Gjeld',
    text: 'Oversikt over lån og avdrag.',
    color: '#E03131',
    paragraphs: [
      'Få oversikt over lån, renter og avdrag slik at du vet hva som går ut til gjeld hver måned.',
      'Det gjør det lettere å planlegge nedbetaling sammen med budsjett og eventuell snøballstrategi.',
    ],
  },
  {
    id: 'snoball',
    icon: Snowflake,
    title: 'Snøball',
    text: 'Strategi for å nedbetale gjeld smartere.',
    color: '#7048E8',
    paragraphs: [
      'Snøballmetoden handler om å prioritere ekstra innsats mot ett lån av gangen, i en fastlagt rekkefølge, for å bygge motivasjon og spare renter over tid.',
      'Verktøyet i Smart Budsjett støtter planlegging — du må selv vurdere hva som passer din situasjon og eventuelle lånevilkår.',
    ],
  },
  {
    id: 'investering',
    icon: TrendingUp,
    title: 'Investering',
    text: 'Enkel oversikt over investeringer du registrerer.',
    color: '#0B7285',
    paragraphs: [
      'Registrer posisjoner du ønsker å følge med på, slik at verdi og utvikling vises samlet i Smart Budsjett der det er støttet.',
      'Dette er oversikt og struktur — ikke personlig investeringsrådgivning. Vurder alltid egen risiko og vilkår hos megler/bank.',
    ],
  },
  {
    id: 'rapporter',
    icon: FileText,
    title: 'Rapporter',
    text: 'Rapporter og utdrag som støtter oversikten.',
    color: '#495057',
    paragraphs: [
      'Hent ut rapporter og sammendrag som gjør det lettere å se trender over tid eller dele oversikt med noen i husholdningen (der det er relevant for din plan).',
      'Innholdet bygger på data du har lagt inn i Smart Budsjett.',
    ],
  },
  {
    id: 'enkelexcel-ai',
    icon: MessageSquare,
    title: 'EnkelExcel AI',
    text: 'Spør om tall og budsjett i Smart Budsjett — et hjelpeverktøy, ikke personlig rådgivning.',
    color: '#364FC7',
    paragraphs: [
      'EnkelExcel AI lar deg stille spørsmål om tallene og strukturen i Smart Budsjett, for eksempel hvordan kategorier henger sammen eller hvordan du finner noe i grensesnittet.',
      'Svarene er automatiserte og kan ta feil — bruk dem som hjelp, ikke som juridisk, skattemessig eller personlig økonomisk rådgivning. Ved viktige valg bør du kontakte fagfolk.',
    ],
  },
]

const PRIMARY_FEATURE_IDS = ['oversikt', 'budsjett', 'transaksjoner', 'sparing'] as const

function partitionFeatures(all: FeatureItem[]) {
  const primary = PRIMARY_FEATURE_IDS.map((id) => all.find((f) => f.id === id)).filter((f): f is FeatureItem => Boolean(f))
  const primarySet = new Set<string>(PRIMARY_FEATURE_IDS)
  const secondary = all.filter((f) => !primarySet.has(f.id))
  return { primary, secondary }
}

export default function LandingAppFeatures() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const titleId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const active = openId ? features.find((f) => f.id === openId) : null
  const { primary: primaryFeatures, secondary: secondaryFeatures } = partitionFeatures(features)

  useEffect(() => {
    const el = dialogRef.current
    if (!el || !openId) return
    if (!el.open) el.showModal()
    requestAnimationFrame(() => closeBtnRef.current?.focus())
  }, [openId])

  function dismissDialog() {
    dialogRef.current?.close()
  }

  function onDialogClose() {
    setOpenId(null)
  }

  return (
    <section id="funksjoner" className={`scroll-mt-24 py-14 ${landingHorizontalPadding}`}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Funksjoner i Smart Budsjett
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Samme moduler som i menyen etter innlogging — én oversikt fra tall til sparing og gjeld.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Klikk en modul for kort forklaring.
        </p>

        <h3 className="mt-10 text-center text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
          Det meste starter her
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {primaryFeatures.map(({ id, icon: Icon, title, text, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOpenId(id)}
              aria-expanded={openId === id}
              aria-haspopup="dialog"
              aria-controls="landing-feature-dialog"
              className="cursor-pointer rounded-2xl p-5 text-left transition-[border-color,box-shadow] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={20} style={{ color }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                    {text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <h3 className="mt-12 text-center text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
          Mer i Smart Budsjett
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryFeatures.map(({ id, icon: Icon, title, text, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOpenId(id)}
              aria-expanded={openId === id}
              aria-haspopup="dialog"
              aria-controls="landing-feature-dialog"
              className="cursor-pointer rounded-2xl p-5 text-left transition-[border-color,box-shadow] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={20} style={{ color }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                    {text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <dialog
        id="landing-feature-dialog"
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-[100] w-[min(100%-2rem,28rem)] max-h-[min(85dvh,32rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        aria-labelledby={titleId}
        onClose={onDialogClose}
        onClick={(e) => {
          if (e.target === dialogRef.current) dismissDialog()
        }}
      >
        {active &&
          (() => {
            const Icon = active.icon
            return (
              <>
                <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${active.color}18` }}
                  >
                    <Icon size={22} style={{ color: active.color }} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2 id={titleId} className="text-lg font-semibold leading-tight">
                      {active.title}
                    </h2>
                  </div>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={dismissDialog}
                    className="rounded-lg p-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Lukk"
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>
                <div className="overflow-y-auto overscroll-contain px-5 py-4 max-h-[min(70dvh,calc(32rem-5.75rem))]">
                  <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {active.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}
      </dialog>
    </section>
  )
}
