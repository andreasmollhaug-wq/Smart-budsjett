/**
 * Innholdsartikler for /guider — bokmål, «du», i tråd med docs/INNHOLD.md.
 * Utvid med nye oppføringer i `articles`; dynamisk rute plukker slug.
 */

export type ArticleBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }

export type Article = {
  slug: string
  title: string
  description: string
  /** ISO dato (YYYY-MM-DD) for strukturert data og visning */
  publishedAt: string
  updatedAt?: string
  blocks: ArticleBlock[]
}

export const articles: Article[] = [
  {
    slug: 'manedlig-budsjett-i-praksis',
    title: 'Månedlig budsjett i praksis',
    description:
      'Slik setter du opp et enkelt månedlig budsjett du faktisk følger — uten å måtte være økonom.',
    publishedAt: '2026-04-07',
    blocks: [
      {
        type: 'p',
        text:
          'Et månedlig budsjett handler ikke om å straffe deg selv. Det handler om å vite hva som er «normalt» for deg, ' +
          'slik at du kan ta bedre valg når noe uventet dukker opp. Du trenger ikke perfekte tall fra dag én — du trenger en enkel struktur du klarer å vedlikeholde.',
      },
      {
        type: 'h2',
        text: 'Start med det som er viktigst',
      },
      {
        type: 'p',
        text:
          'Del utgiftene dine grovt i tre lag: det du må betale (husleie, forsikring, lån), det du pleier å bruke på hverdag ' +
          '(mat, transport), og det som er valgfritt (restaurant, hobby). Når du ser forskjellen tydelig, blir det lettere å ' +
          'vite hvor du kan justere uten å rote til alt.',
      },
      {
        type: 'ul',
        items: [
          'Skriv ned faste beløp først — de endrer seg sjelden.',
          'Sett et realistisk beløp til mat og dagligvarer basert på de siste månedene, ikke på «idealet».',
          'Ha ett tall for «buffer» til uforutsette ting — det reduserer stress når fakturaen kommer.',
        ],
      },
      {
        type: 'h2',
        text: 'Følg opp kort, men ofte',
      },
      {
        type: 'p',
        text:
          'Du trenger ikke å sitte med regneark hver kveld. Mange har god nytte av å sjekke budsjettet én gang i uken, eller ' +
          'rett etter lønning. Poenget er at du jevnlig ser om du er i rute — da kan du korrigere tidlig i stedet for å oppdage ' +
          'overskridelsen når kontoen er tom.',
      },
      {
        type: 'p',
        text:
          'I Smart Budsjett er strukturen lagt inn på forhånd, slik at du kan fokusere på tallene dine og oversikten — ikke på ' +
          'å bygge mal fra bunnen av. Når du er klar, kan du prøve appen gratis i 14 dager og se om rytmen passer deg.',
      },
    ],
  },
  {
    slug: 'oversikt-utgifter-bedre-valg',
    title: 'Hvorfor oversikt over utgifter gir bedre valg',
    description:
      'Når du ser mønstrene i forbruket ditt, blir det lettere å prioritere — uten dårlig samvittighet for hver liten utgift.',
    publishedAt: '2026-04-07',
    blocks: [
      {
        type: 'p',
        text:
          'Mange opplever at penger «forsvinner» uten at de helt vet hvor. Det er vanlig — ikke et tegn på at du styrer økonomien dårlig. ' +
          'Hjernen er ikke laget for å huske hundre små kjøp. Derfor hjelper det å få dem samlet på ett sted, så du kan se helheten.',
      },
      {
        type: 'h2',
        text: 'Oversikt gir ro',
      },
      {
        type: 'p',
        text:
          'Når du vet omtrent hva du bruker på mat, abonnement og transport, slipper du å gjette hver gang du vil si ja til noe. ' +
          'Du kan heller spørre: «Passer dette inn i det jeg har planlagt?» — og svaret blir oftere ærlig og mindre stressende.',
      },
      {
        type: 'ul',
        items: [
          'Kategorier trenger ikke være perfekte; det viktigste er at du kjenner dem igjen.',
          'Små utgifter teller — mange «små» blir fort en stor sum.',
          'Når du ser totalen, er det lettere å velge bort det som ikke gir deg nok igjen.',
        ],
      },
      {
        type: 'h2',
        text: 'Fra innsikt til handling',
      },
      {
        type: 'p',
        text:
          'Oversikt alene endrer ingenting — men den gjør det mulig å ta ett grep av gangen. Kanskje du justerer ett abonnement, ' +
          'øker matbudsjettet fordi du ser at det var for lavt, eller setter av litt ekstra til sparing når du ser overskudd. ' +
          'Smart Budsjett er laget for å gi deg den oversikten i en ryddig flate, med rom for både hverdag og langsiktige mål.',
      },
    ],
  },
  {
    slug: 'snoeballmetoden-gjeld',
    title: 'Snøballmetoden: en enkel plan for nedbetaling av gjeld',
    description:
      'Slik fungerer snøballmetoden — og hvordan du kan bruke den uten å få økonomien til å føles som et regnestykke.',
    publishedAt: '2026-04-07',
    blocks: [
      {
        type: 'p',
        text:
          'Snøballmetoden går ut på å betale minimum på alt utenom den minste gjelden, og legge all ekstra kapasitet der. ' +
          'Når den minste er borte, ruller du beløpet du betalte der inn på neste lån. «Snøballen» vokser — derfor navnet.',
      },
      {
        type: 'h2',
        text: 'Hvorfor det fungerer psykologisk',
      },
      {
        type: 'p',
        text:
          'For mange er motivasjonen større når de ser en hel faktura forsvinne, sammenlignet med å spre litt ekstra over alt. ' +
          'Du får en tydelig seier tidlig, og det gjør det lettere å holde ut. Metoden passer godt når du har flere små krav ' +
          'med ulike renter og gebyrer.',
      },
      {
        type: 'h2',
        text: 'Det du bør passe på',
      },
      {
        type: 'ul',
        items: [
          'Høyrentegjeld (f.eks. kredittkort) kan koste mer over tid enn små lån — vurder om avvikling eller en hybrid strategi passer bedre.',
          'Ha fortsatt rom til nødfond hvis du kan; ett uventet behov uten buffer kan ødelegge planen.',
          'Vær ærlig på minimumsbeløp og renter slik at planen du skriver ned også stemmer i virkeligheten.',
        ],
      },
      {
        type: 'p',
        text:
          'I Smart Budsjett finnes støtte for å følge gjeld og snøball i samme oversikt som budsjettet ditt, slik at du ser ' +
          'sammenhengen mellom hverdagsutgifter og nedbetaling — uten å hoppe mellom flere verktøy.',
      },
    ],
  },
]

const bySlug = new Map(articles.map((a) => [a.slug, a]))

export function getArticleBySlug(slug: string): Article | undefined {
  return bySlug.get(slug)
}

export function getAllArticleSlugs(): string[] {
  return articles.map((a) => a.slug)
}
