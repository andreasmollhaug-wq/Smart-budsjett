import type { LucideIcon } from 'lucide-react'
import { RENOVATION_PROJECT_BASE_PATH } from '@/features/renovation-project/paths'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'
import { SIDEBAR_NAV } from '@/lib/sidebarNav'

export type DottirShowcaseCategoryId = 'alle' | 'okonomi' | 'hverdag' | 'innsikt'

export type DottirShowcaseCategory = {
  id: DottirShowcaseCategoryId
  label: string
}

export const DOTTIR_SHOWCASE_CATEGORIES: DottirShowcaseCategory[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'okonomi', label: 'Økonomi' },
  { id: 'hverdag', label: 'Liv og hverdag' },
  { id: 'innsikt', label: 'Innsikt' },
]

type ShowcaseCopy = {
  category: Exclude<DottirShowcaseCategoryId, 'alle'>
  hook: string
  what: string
  when: string
  outcome: string
}

const SHOWCASE_BY_HREF: Record<string, ShowcaseCopy> = {
  '/dashboard': {
    category: 'okonomi',
    hook: 'Én oversikt som faktisk tåler en travel uke.',
    what: 'Samlet bilde av hvor du står økonomisk — uten å hoppe mellom faner og apper.',
    when: 'Når du vil vite «hvordan ligger vi an?» før du tar en avgjørelse.',
    outcome: 'Tryggere startpunkt for resten av modulene — og mindre «tomt hode».',
  },
  '/budsjett': {
    category: 'okonomi',
    hook: 'Plan du kan holde — ikke bare et ark som straffer deg.',
    what: 'Legg plan for inntekter og utgifter med tydelig struktur, tilpasset hverdagen din.',
    when: 'Ved lønn, månedsskifte eller når du vil rydde i fastsatte beløp.',
    outcome: 'Klar forventning om hva som er «normalt» denne måneden — uten skamfølelse.',
  },
  '/transaksjoner': {
    category: 'okonomi',
    hook: 'Se hva pengene faktisk gjorde — ikke bare hva du håpet.',
    what: 'Registrer og kategoriser forbruk slik at virkeligheten matcher (eller utfordrer) planen.',
    when: 'Etter handletur, regninger, eller når du kjenner at «pengene forsvant».',
    outcome: 'Sannferdig bilde av vaner og engangsting — grunnlag for bedre valg.',
  },
  '/sparing': {
    category: 'okonomi',
    hook: 'Mål du ser — ikke bare «spar mer» på papiret.',
    what: 'Sett sparemål og følg fremdrift, koblet til det du faktisk har å gå på.',
    when: 'Når buffer, ferie eller større kjøp skal bli konkrete, ikke vage intensjoner.',
    outcome: 'Motivasjon som holder fordi fremgang er synlig.',
  },
  '/gjeld': {
    category: 'okonomi',
    hook: 'Gjeld som får struktur — ikke bare uro i magen.',
    what: 'Oversikt over lån og nedbetaling slik at du vet rekkefølge og realistisk tempo.',
    when: 'Når du vil prioritere nedbetaling uten å glemme vanlig drift.',
    outcome: 'Tydeligere vei ut av gjeld, med mindre mental støy.',
  },
  '/gjeld/kalkulator': {
    category: 'okonomi',
    hook: 'Se hva boliglånet faktisk koster — før du signerer.',
    what: 'Regn ut månedsbeløp, renter og total kostnad for boliglån med ulike forutsetninger.',
    when: 'Når du vurderer kjøp eller refinansiering, eller vil teste hvordan en renteendring slår ut.',
    outcome: 'Tryggere lånevalg basert på tall, ikke magefølelse.',
  },
  '/gjeld/studielan-kalkulator': {
    category: 'okonomi',
    hook: 'Studielånet ned i tempoet som passer livet ditt.',
    what: 'Beregn nedbetaling av studielån med ulike renter og terminbeløp.',
    when: 'Når du planlegger nedbetaling eller vil se effekten av å betale litt ekstra.',
    outcome: 'Realistisk plan for når studielånet er ute av livet.',
  },
  '/abonnementer': {
    category: 'okonomi',
    hook: 'Finn det som lekker ut måned etter måned uten at du merker det.',
    what: 'Hold styr på faste trekk og abonnementer som spiser margin.',
    when: 'Ved opprydding, flytting eller når budsjettet føles trangt «uten grunn».',
    outcome: 'Færre overraskelser og enklere å si fra eller bytte.',
  },
  '/snoball': {
    category: 'okonomi',
    hook: 'Snøball som forklarer seg selv — ikke bare et regneark for entusiaster.',
    what: 'Strategi for nedbetaling av gjeld der små seirer bygger momentum.',
    when: 'Når du har flere lån og vil vite hva som lønner seg å bite i først.',
    outcome: 'Tydelig prioritering og psyche-boost fra faktisk fremdrift.',
  },
  '/investering': {
    category: 'okonomi',
    hook: 'Langsiktige valg — uten at du mister kontakt med hverdagsøkonomien.',
    what: 'Ramme for investering og langsiktig sparing som hører hjemme i helheten.',
    when: 'Når du begynner å sette av til fond/aksjer eller vil samkjøre med gjeld/sparing.',
    outcome: 'Mindre «silomentale» mellom daglig drift og det du bygger for senere.',
  },
  '/rapporter': {
    category: 'innsikt',
    hook: 'Tall som svarer på spørsmålet du egentlig stiller.',
    what: 'Utdrag og rapporter som gjør mønster synlige — måned for måned.',
    when: 'Når du vil forstå «hvor går det egentlig?» før du endrer vaner eller plan.',
    outcome: 'Handling basert på innsikt, ikke bare mavefølelse.',
  },
  '/enkelexcel-ai': {
    category: 'innsikt',
    hook: 'Spør — få forklaring på norsk du tør å bruke.',
    what: 'AI-hjelp til økonomi og appen, i et språk som ikke krever fagbrev.',
    when: 'Når du står fast i et begrep, en fane eller et valg du ikke vet effekten av.',
    outcome: 'Færre blindsoner og raskere fra uro til forståelse.',
  },
  '/hjemflyt/start': {
    category: 'hverdag',
    hook: 'Hjemmet som prosjekt — ikke bare en liste du glemmer.',
    what: 'Struktur for oppgaver og flyt rundt bolig og husholdning, side om side med økonomien.',
    when: 'Flytting, sesongbytte, eller når samme gjøremål dukker opp uke etter uke.',
    outcome: 'Mer orden med mindre mental last — dere drar lasset sammen.',
  },
  '/intern/mat-handleliste/handleliste': {
    category: 'hverdag',
    hook: 'Handleliste som henger sammen med resten av livet (og lommeboka).',
    what: 'Planlegg handel og behold oversikt slik at butikken ikke ødelegger uka.',
    when: 'Før helghandel, storhandel eller når matbudsjettet skal ned uten dramatikk.',
    outcome: 'Mindre impulskjøp og færre «glemte» ting som koster ekstra turer.',
  },
  [RENOVATION_PROJECT_BASE_PATH]: {
    category: 'hverdag',
    hook: 'Oppussing med struktur — ikke bare kaos og underestimatede kvadratmeter.',
    what: 'Prosjekter, delmål og oversikt når boligen skal løftes over tid.',
    when: 'Renovering, vedlikehold eller større oppgraderinger hvor kostnader og oppgaver stables.',
    outcome: 'Kontroll på både gjøremål og forventet belastning — færre dyre overraskelser.',
  },
  [FORUM_BASE_PATH]: {
    category: 'hverdag',
    hook: 'Du er ikke alene om økonomien — spør og del med andre.',
    what: 'Et sted å stille spørsmål, dele erfaringer og lære av andre i samme situasjon.',
    when: 'Når du står fast, vil ha råd, eller bare vil høre hvordan andre løste det.',
    outcome: 'Mindre alene-følelse og praktiske tips fra folk som har vært der.',
  },
}

function missingShowcaseKeys(): { href: string; label: string }[] {
  return SIDEBAR_NAV.filter((item) => !SHOWCASE_BY_HREF[item.href]).map((item) => ({
    href: item.href,
    label: item.label,
  }))
}

/**
 * I dev/test kaster vi tidlig hvis en sidebar-modul mangler kopitekst, så det fanges før prod.
 * I produksjon skal en glemt modul aldri ta ned den offentlige /utforsk-siden — vi hopper heller
 * over den (se filter i `DOTTIR_SHOWCASE_MODULES`).
 */
if (process.env.NODE_ENV !== 'production') {
  const missing = missingShowcaseKeys()
  if (missing.length > 0) {
    throw new Error(
      `dottirModuleShowcaseData: mangler kopitekst for ${missing
        .map((m) => `${m.href} (${m.label})`)
        .join(', ')}`,
    )
  }
}

export type DottirShowcaseModule = {
  href: string
  label: string
  icon: LucideIcon
  category: ShowcaseCopy['category']
  hook: string
  what: string
  when: string
  outcome: string
}

export const DOTTIR_SHOWCASE_MODULES: DottirShowcaseModule[] = SIDEBAR_NAV.filter(
  (item) => SHOWCASE_BY_HREF[item.href],
).map((item) => {
  const copy = SHOWCASE_BY_HREF[item.href]!
  return {
    href: item.href,
    label: item.label,
    icon: item.icon,
    category: copy.category,
    hook: copy.hook,
    what: copy.what,
    when: copy.when,
    outcome: copy.outcome,
  }
})
