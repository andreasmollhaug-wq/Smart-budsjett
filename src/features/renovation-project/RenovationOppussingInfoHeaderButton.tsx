'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, Info, X } from 'lucide-react'
import RenovationModalFrame, {
  renovationModalScrollbarSafeBottom,
  renovationModalScrollableMainClass,
} from './RenovationModalFrame'

const MODAL_TITLE_ID = 'oppussing-info-modal-title'
const MODAL_DIALOG_ID = 'oppussing-info-modal-dialog'

type Variant = 'list' | 'detail'

function InfoAccordionSection({
  sectionId,
  title,
  defaultOpen,
  children,
}: {
  sectionId: string
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultOpen ?? false)
  const headingId = `${sectionId}-heading`
  const panelId = `${sectionId}-panel`

  return (
    <div
      className="overflow-hidden rounded-xl min-w-0"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <h3 className="m-0 border-0 p-0" id={headingId}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full min-h-[44px] items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
          style={{
            color: 'var(--text)',
            background: expanded ? 'var(--bg)' : 'transparent',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{title}</span>
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform duration-200 ${expanded ? '-rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
            aria-hidden
          />
        </button>
      </h3>
      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className="min-w-0 break-words border-t px-4 py-3 text-sm leading-relaxed"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function SectionProse({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>
}

function Subheading({ children }: { children: ReactNode }) {
  return <p className="m-0 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>{children}</p>
}

export default function RenovationOppussingInfoHeaderButton({ variant }: { variant: Variant }) {
  const [open, setOpen] = useState(false)
  const reactId = useId()
  const idPrefix = `opp-inf-${variant}-${reactId.replace(/:/g, '')}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border-0 bg-transparent p-0 transition-colors touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={MODAL_DIALOG_ID}
        title="Om Oppussing"
        aria-label="Om Oppussing — hjelp til denne siden"
      >
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          aria-hidden
        >
          <Info size={16} style={{ color: 'var(--text-muted)' }} aria-hidden />
        </span>
      </button>

      {!open ? null : (
        <RenovationModalFrame
          rootElementId={MODAL_DIALOG_ID}
          onRequestClose={() => setOpen(false)}
          ariaLabelledBy={MODAL_TITLE_ID}
          maxWidth="xl"
        >
            <div
              className="relative flex shrink-0 items-start border-b min-w-0 p-4 sm:p-5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="min-w-0 flex-1 pr-14">
                <h2 id={MODAL_TITLE_ID} className="text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                  Om Oppussing
                </h2>
                <p className="mt-2 text-xs leading-snug sm:text-sm break-words" style={{ color: 'var(--text-muted)' }}>
                  Åpne seksjonene under etter behov — slik kan du forklare eller finne fram uten å lese alt på én gang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border touch-manipulation"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Lukk"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className={`${renovationModalScrollableMainClass} ${renovationModalScrollbarSafeBottom}`}>
              <div className="flex flex-col gap-2">
                <InfoAccordionSection sectionId={`${idPrefix}-1`} title="Start her" defaultOpen>
                  <SectionProse>
                    {variant === 'list' ? (
                      <>
                        <Subheading>Hva gjør du på denne oversikten</Subheading>
                        <ul className="m-0 list-disc space-y-2 pl-[1.125rem]" style={{ color: 'var(--text-muted)' }}>
                          <li>
                            Trykk «<strong style={{ color: 'var(--text)' }}>Nytt hovedprosjekt</strong>» om du starter med et
                            nytt hus eller større prosjektenhet.
                          </li>
                          <li>
                            Under hvert hovedprosjekt-kort legges <strong style={{ color: 'var(--text)' }}>rom eller andre delprosjekter</strong>{' '}
                            til med «Nytt rom» eller tilsvarende når det er aktivert.
                          </li>
                          <li>
                            <strong style={{ color: 'var(--text)' }}>Trykk på en rom-rad</strong> i listen for kjapp forklaring på
                            nøkkeltall. Velg «Se detaljer» for full visning på det prosjektet.
                          </li>
                          <li>
                            Informasjonsfeltet på listen (under overskriften) kan skjules med «Skjul»; det huskes på denne enheten.
                          </li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <Subheading>Hva gjør du på denne siden</Subheading>
                        <ul className="m-0 list-disc space-y-2 pl-[1.125rem]" style={{ color: 'var(--text-muted)' }}>
                          <li>
                            Fyll inn <strong style={{ color: 'var(--text)' }}>budsjettlinjer</strong>, registrer{' '}
                            <strong style={{ color: 'var(--text)' }}>utgifter</strong> og bruk{' '}
                            <strong style={{ color: 'var(--text)' }}>sjekklisten</strong> i blokken øverst i innholdet.
                          </li>
                          <li>
                            Har prosjektet rom under seg, vises forklaring eller infotekst om{' '}
                            <strong style={{ color: 'var(--text)' }}>rollup</strong> — altså hva som er summert øverst — opp mot det du ser i tabellen lenger ned.
                          </li>
                          <li>
                            «<strong style={{ color: 'var(--text)' }}>Liste</strong>» i toppstripe tar deg tilbake til alle prosjekter. På et rom er det også snarvei til hovedprosjektet ved behov.
                          </li>
                        </ul>
                      </>
                    )}
                  </SectionProse>
                </InfoAccordionSection>

                <InfoAccordionSection sectionId={`${idPrefix}-2`} title="Hvordan fungerer hovedprosjekt og rom">
                  <SectionProse>
                    <Subheading>Struktur</Subheading>
                    <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                      Et <strong style={{ color: 'var(--text)' }}>hovedprosjekt</strong> er øverste nivå uten «forelder» — i
                      praksis ofte ett hus eller en større enhet du renoverer.{' '}
                      <strong style={{ color: 'var(--text)' }}>Rom</strong>{' '}
                      (eller mindre prosjektdeler) må knyttes til nøyaktig <strong style={{ color: 'var(--text)' }}>ett</strong>{' '}
                      aktivt hovedprosjekt om gangen.
                    </p>
                    <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                      Modellen tillater ikke <strong style={{ color: 'var(--text)' }}>rom under rom</strong> — bare ett nivå under
                      hovedprosjekt. Det gjør oversikten enklere og hindrer kronglete summeringer.
                    </p>
                    <Subheading>Opprett og mal</Subheading>
                    <ul className="m-0 list-disc space-y-2 pl-[1.125rem]" style={{ color: 'var(--text-muted)' }}>
                      <li>
                        «<strong style={{ color: 'var(--text)' }}>Nytt rom</strong>» krever at det finnes minst ett hovedprosjekt
                        å henge det på.
                      </li>
                      <li>
                        Ved opprettelse kan du velge <strong style={{ color: 'var(--text)' }}>mal</strong> (f.eks. kjøkken, bad,
                        egen), som foreslår sjekkliste og oppstartstruktur.
                      </li>
                    </ul>
                  </SectionProse>
                </InfoAccordionSection>

                <InfoAccordionSection sectionId={`${idPrefix}-3`} title="Slik leser du tallene">
                  <SectionProse>
                    {variant === 'list' ? (
                      <>
                        <Subheading>Portefølje-KPI-kortene</Subheading>
                        <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                          Kortene øverst summerer <strong style={{ color: 'var(--text)' }}>alle aktive</strong> prosjekter.
                          Summeringen er lagt opp så <strong style={{ color: 'var(--text)' }}>samme penger ikke telles to ganger</strong>:
                          per hovedprosjekt legges husets egne tall sammen med aktive rom under — deretter summeres hovedprosjektene.
                        </p>
                        <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                          Tallet for <strong style={{ color: 'var(--text)' }}>aktive hovedprosjekt</strong> teller bare røtter;
                          antall rom vises i undertekst eller når du åpner forklaring via kortet.
                        </p>
                        <p className="m-0 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                          Tips: trykk på et KPI-kort for kort teknisk forklaring og tabell for den modusen.
                        </p>
                      </>
                    ) : (
                      <>
                        <Subheading>Kort øverst mot tabell lenger ned</Subheading>
                        <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                          På et <strong style={{ color: 'var(--text)' }}>hovedprosjekt som har aktive rom</strong>, kan
                          nøkkeltallene øverst vise <strong style={{ color: 'var(--text)' }}>hus pluss rom samlet</strong>. I
                          tabeller og lister under gjelder tallene <strong style={{ color: 'var(--text)' }}>kun dette</strong>{' '}
                          prosjektet (rommet alene hvis du står på et rom).
                        </p>
                        <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                          Er du usikker, åpne <strong style={{ color: 'var(--text)' }}>info på KPI-kortet</strong> eller se den
                          grå infostripen rett over kortene — den gjentar poenget.
                        </p>
                      </>
                    )}
                  </SectionProse>
                </InfoAccordionSection>

                <InfoAccordionSection sectionId={`${idPrefix}-4`} title="Budsjettlinjer, utgifter og sjekkliste">
                  <SectionProse>
                    <ul className="m-0 list-disc space-y-2 pl-[1.125rem]" style={{ color: 'var(--text-muted)' }}>
                      <li>
                        <strong style={{ color: 'var(--text)' }}>Budsjettlinjer</strong> er planlagte delposter (hva du har satt av
                        til ulike kostnader). Panelet «Budsjettlinjer» og feltet «Sjekkliste» kan begge lukkes eller åpnes; valget
                        husker <strong style={{ color: 'var(--text)' }}>per prosjekt på denne enheten</strong>.
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text)' }}>Utgifter</strong> er faktiske betalinger med dato og beskrivelse —
                        knytt gjerne til en budsjettlinje der det passer.
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text)' }}>Sjekkliste</strong> er gjøremål du kan krysse av og utvide underveis.
                      </li>
                    </ul>
                  </SectionProse>
                </InfoAccordionSection>

                <InfoAccordionSection sectionId={`${idPrefix}-5`} title="Om prosjektet — navn, flytting og arkivering">
                  <SectionProse>
                    <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                      Nederst på prosjektsiden ligger seksjonen <strong style={{ color: 'var(--text)' }}>Om prosjektet</strong>{' '}
                      (sammenleggbar). Der endrer du blant annet navn, ser sted og plan, og du kan{' '}
                      <strong style={{ color: 'var(--text)' }}>arkivere</strong> eller <strong style={{ color: 'var(--text)' }}>slette</strong>.
                    </p>
                    <ul className="m-0 list-disc space-y-2 pl-[1.125rem]" style={{ color: 'var(--text-muted)' }}>
                      <li>
                        Sletting av et hovedprosjekt som har rom under krever bekreftelse — hele <strong style={{ color: 'var(--text)' }}>undertreet</strong>{' '}
                        fjernes.
                      </li>
                      <li>
                        Et <strong style={{ color: 'var(--text)' }}>hovedprosjekt uten aktive barn</strong> kan i noen tilfeller{' '}
                        <strong style={{ color: 'var(--text)' }}>kobles under et annet</strong> hovedprosjekt (f.eks. feiloppretting).
                      </li>
                      <li>
                        Et <strong style={{ color: 'var(--text)' }}>rom</strong> kan flyttes til annet aktivt hus, eller gjøres
                        til <strong style={{ color: 'var(--text)' }}>nytt hovedprosjekt</strong> («Gjør til hovedprosjekt»).
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text)' }}>Arkiver hus</strong> setter samtidig huset og alle aktive rom
                        under til arkivert — for å unngå halvveis tilstand.
                      </li>
                    </ul>
                  </SectionProse>
                </InfoAccordionSection>

                <InfoAccordionSection sectionId={`${idPrefix}-6`} title="Hvor er vanlig budsjett og transaksjoner?">
                  <SectionProse>
                    <p className="m-0" style={{ color: 'var(--text-muted)' }}>
                      Oppussing er et <strong style={{ color: 'var(--text)' }}>eget spor</strong>. Det kopieres{' '}
                      <strong style={{ color: 'var(--text)' }}>ikke automatisk</strong> til ordinært{' '}
                      <strong style={{ color: 'var(--text)' }}>Budsjett</strong> eller <strong style={{ color: 'var(--text)' }}>Transaksjoner</strong>.
                      Skal samme utgift også inn i husøkonomien, må du registrere den der — da styrer du selv evt. «dobbelt»
                      økonomispor.
                    </p>
                  </SectionProse>
                </InfoAccordionSection>
              </div>
            </div>
        </RenovationModalFrame>
      )}
    </>
  )
}
