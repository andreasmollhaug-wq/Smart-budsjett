import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  PiggyBank,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

export type ProductFlowPhase = {
  id: string
  shortTitle: string
  title: string
  /** Én linje: hva brukeren får ut av dette steget */
  outcome: string
  lead: string
  bullets: string[]
  pitfall: string
  /** Valgfritt: ekstra avsnitt under «Utvidet informasjon» */
  expandedParagraphs?: string[]
  householdNote?: string
  icon: LucideIcon
  accent: string
}

export const PRODUCT_FLOW_PHASES: ProductFlowPhase[] = [
  {
    id: 'grunnlag',
    shortTitle: 'Grunnlag',
    title: 'Budsjett og struktur',
    outcome: 'Du får et kart over økonomien som resten av appen bygger på — uten å starte fra blankt ark.',
    lead:
      'Du starter med budsjettår og en plan: inntekter, regninger, utgifter, gjeld og sparing — med ferdig struktur som du tilpasser.',
    bullets: [
      'Velg riktig budsjettår og bygg linje for linje slik at planen speiler hverdagen din.',
      'Under Min konto kan du justere hvilke budsjettkategorier som foreslås — mindre støy, mer treffsikkert.',
      'Resten av appen forholder seg til det du legger inn her: «brukt mot plan», oversikt og rapporter.',
    ],
    pitfall:
      'Hvis hovedinntekten er satt til null eller er helt urealistisk, vil oversikt og «brukt mot plan» føles meningsløse. Juster tidlig.',
    expandedParagraphs: [
      'Startveiledningen ved første innlogging hjelper deg med år og omtrentlig lønn — den utvidede guiden under Min konto går dypere når du er inne.',
      'Du kan arkivere eldre budsjettår og bytte aktivt år når livet endrer seg.',
    ],
    householdNote:
      'Med Familie-abonnement kan flere profiler i samme husholdning ha egne tall; du bytter profil eller ser summert husholdning når det passer.',
    icon: Wallet,
    accent: '#4C6EF5',
  },
  {
    id: 'transaksjoner',
    shortTitle: 'Transaksjoner',
    title: 'Faktiske tall inn',
    outcome: 'Du ser om du faktisk lever etter planen — ikke bare hva du skrev inn i budsjettet.',
    lead:
      'Budsjettet er planen — transaksjonene er det som skjedde. Når du fører kjøp og inntekter, kobles de til kategorier og oppdaterer budsjettet.',
    bullets: [
      'Registrer transaksjoner med dato, beløp og kategori slik at grafer og «brukt mot plan» stemmer.',
      'Bruk transaksjonsdashboardet for å se mønstre før du justerer budsjettet.',
      'Jo mer du følger med, jo tydeligere blir bildet på oversikten.',
    ],
    pitfall:
      'Uten transaksjoner ser du bare plan — ikke om du holder deg innenfor. Én kort økt med innlegging løfter hele oversikten.',
    expandedParagraphs: [
      'Du kan importere transaksjoner fra CSV (Excel-mal) fra Min konto når du vil spare tid.',
      'Kategorivalg bestemmer hvordan utgifter fordeles i grafer og mot budsjettlinjer.',
    ],
    icon: Receipt,
    accent: '#0CA678',
  },
  {
    id: 'oversikt',
    shortTitle: 'Oversikt',
    title: 'Dashboard: helheten',
    outcome: 'Du får et raskt svar på «hvordan går det?» — trender, topp utgifter og hovedtall samlet.',
    lead:
      'Når både plan og noe faktisk finnes, samler oversikten hovedtall, trender og topp utgifter — raskt svar på hvordan det går.',
    bullets: [
      'Se inntekt, utgifter og hva som er igjen i valgt periode.',
      'Følg med på gjeld, sparing og investering når du har lagt inn data der.',
      'Perioden (år/måned) styrer hvilke tall som vises i de delene som følger filteret.',
    ],
    pitfall:
      'Hvis du filtrerer på et annet år enn aktivt budsjettår, kan enkel graf eller hjelpetekst forklare at trend og budsjett ikke alltid er samme år — sjekk verktøylinjen på oversikten.',
    expandedParagraphs: [
      'Noen kort (f.eks. total gjeld, investering, sparemål) følger ikke alltid månedsfilteret — det står forklart på siden.',
    ],
    householdNote:
      'I husholdningsvisning ser du summerte tall for alle profiler; mange skjemaer er da skrivebeskyttet — bytt til én profil når du skal redigere.',
    icon: LayoutDashboard,
    accent: '#3B5BDB',
  },
  {
    id: 'sparing-gjeld',
    shortTitle: 'Sparing og gjeld',
    title: 'Mål, lån og snøball',
    outcome: 'Du kan prioritere buffer, mål og nedbetaling med tall som henger sammen — ikke bare godvilje.',
    lead:
      'Når grunnflyten sitter, kan du jobbe målrettet med sparemål, oversikt over lån og — om du vil — snøballstrategi for nedbetaling.',
    bullets: [
      'Sparemål kan kobles til budsjettlinjer slik at innskudd og fremdrift henger sammen med planen.',
      'Registrer lån med avdrag og renter slik at gjeldssiden og rapporter blir riktige.',
      'Snøball lar deg simulere ekstra nedbetaling ut fra gjelden du har lagt inn.',
    ],
    pitfall:
      'Snøball og rapporter forutsetter at gjeld og beløp stemmer omtrent med virkeligheten — ta en runde med tallene før du tolker strategien.',
    expandedParagraphs: [
      'Boliglån er ofte utelatt fra snøball som standard; du kan overstyre hva som skal med.',
      'Formuebyggeren PRO er en egen simulator for langsiktig formue og kjøpekraft — tillegg til sparemålene.',
    ],
    icon: PiggyBank,
    accent: '#F08C00',
  },
  {
    id: 'investering',
    shortTitle: 'Investering',
    title: 'Portefølje i appen',
    outcome: 'Du samler posisjoner og utvikling på ett sted — for oversikt, ikke for kjøpsråd.',
    lead:
      'Investeringsmodulen samler posisjoner og avkastning du registrerer — for oversikt, ikke som rådgivning.',
    bullets: [
      'Følg kjøpsverdi, markedsverdi og utvikling over tid der funksjonen støtter det.',
      'Dette erstatter ikke personlig investerings-, skatte- eller juridisk rådgivning.',
    ],
    pitfall:
      'Markedsverdi og kurs kan endre seg raskt — tallene i appen er et verktøy for struktur, ikke en anbefaling om å kjøpe eller selge.',
    expandedParagraphs: [
      'Kursoppslag og posisjoner følger leverandørens vilkår og tilgjengelighet; sjekk alltid mot bank eller megler ved viktige beslutninger.',
    ],
    icon: TrendingUp,
    accent: '#0B7285',
  },
  {
    id: 'rapporter',
    shortTitle: 'Rapporter',
    title: 'Dokumenter og innsikt',
    outcome: 'Du kan dokumentere for banken, hente månedlig innsikt og sparemålrapport — fra data du allerede har lagt inn.',
    lead:
      'Når dataene ligger i appen, kan du hente ut rapporter til ulike formål — utskrift eller PDF der det støttes.',
    bullets: [
      'Rapport til bank: velg år og måned, kryss av hvilke deler som skal med, og legg ved kort tekst til saksbehandler om du trenger det.',
      'Månedsinnsikt: månedlig sammendrag med nøkkeltall og tabeller mot budsjett (AI-generert sammendrag per måned innenfor appens kvoter).',
      'Sparemålrapport: sparemål, fremdrift og aktivitet — nyttig til eget arkiv eller dialog.',
    ],
    pitfall:
      'Månedsinnsikt med AI har kvote per måned — PDF av allerede generert sammendrag teller ikke som ny generering.',
    expandedParagraphs: [
      'Rapport til bank trekker blant annet på transaksjoner og budsjett for valgt måned — kryss av hvilke seksjoner som skal med.',
      'Alle tre rapporttypene finnes under Rapporter i appen etter innlogging.',
    ],
    householdNote:
      'Rapportene følger den visningen du har valgt i appen (én profil eller samlet husholdning) der det er relevant.',
    icon: FileText,
    accent: '#495057',
  },
  {
    id: 'enkelexcel-ai',
    shortTitle: 'EnkelExcel AI',
    title: 'Spør om tall og appen',
    outcome: 'Du får hjelp til å forstå appen og tallene dine — innenfor det produktet faktisk støtter.',
    lead:
      'EnkelExcel AI svarer innenfor det Smart Budsjett faktisk gjør — med kontekst fra dine tall når du er innlogget.',
    bullets: [
      'Typisk: forklaringer av funksjoner, hvor du finner noe, og sammenhenger mellom budsjett, transaksjoner og oversikt.',
      'Hjelpeverktøy i appen — ikke personlig økonomisk, juridisk eller skatterådgivning.',
      'Meldinger per måned er begrenset (med mulighet for ekstra kjøp der det er aktivert).',
    ],
    pitfall:
      'AI erstatter ikke menneskelig rådgivning — bruk den til brukshjelp og å forstå sammenhenger, ikke til skatte- eller investeringsbeslutninger.',
    expandedParagraphs: [
      'Konteksten som sendes til AI følger profilvelgeren: én profil eller samlet husholdning i Familie-modus.',
      'Samtaler lagres lokalt i nettleseren; les personvern om du trenger detaljer.',
    ],
    householdNote:
      'I husholdningsmodus kan konteksten inkludere flere profiler der det er relevant — tydelig merket i chatten.',
    icon: MessageSquare,
    accent: '#364FC7',
  },
  {
    id: 'husholdning',
    shortTitle: 'Husholdning',
    title: 'Sammen i samme abonnement',
    outcome: 'Dere kan dele abonnement og likevel se egne tall — eller summert når dere vil snakke om fellesskapet.',
    lead:
      'Med Familie-plan kan opptil fem brukere i samme husholdning dele abonnement — med egne profiler og valgfri samlet visning.',
    bullets: [
      'Profiler administreres fra appen; hovedprofilen kan ikke slettes, ekstra profiler kan fjernes fra Min konto når det trengs.',
      'Velg «Husholdning» i visning når du vil se summerte tall på tvers — nyttig for felles budsjett og dialog.',
      'Budsjettfanen Husholdning viser fordeling per person når du er i husholdningsmodus.',
    ],
    pitfall:
      'I husholdningsvisning er mange skjemaer skrivebeskyttet — bytt til én profil når du skal endre budsjett eller transaksjoner for den personen.',
    expandedParagraphs: [
      'Familie-plan og Solo-plan i appen styres fra Betalinger-sammen med Stripe-abonnementet — se siden for detaljer.',
      'Invitasjoner og antall profiler følger vilkår for Familie-abonnementet.',
    ],
    icon: Users,
    accent: '#7048E8',
  },
]
