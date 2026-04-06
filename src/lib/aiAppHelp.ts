/**
 * Offisiell bruksveiledning for EnkelExcel AI (Smart Budsjett).
 * Oppdater når UI, flyter eller produkttekst endres.
 */
export const AI_APP_HELP_TEXT = `--- Bruksveiledning for Smart Budsjett (offisiell referanse for AI) ---

Om denne teksten og ansvar
- Bruk denne teksten når brukeren spør hvordan appen fungerer, hvor noe finnes, eller hva som er støttet.
- Smart Budsjett er et verktøy for oversikt og planlegging — ikke personlig økonomisk, juridisk, skattemessig eller investeringsrådgivning. AI-svar i appen er automatisert hjelp.
- Ikke finn opp skjermbilder, knapper eller menyer som ikke står beskrevet her.

Kontakt og juridiske sider (utenfor innlogget app)
- Leverandør: EnkelExcel. Generell kontakt e-post for personvern og henvendelser: post@enkelexcel.no (som i personvernerklæringen).
- Personvernerklæring: /personvern
- Vilkår: /vilkar
- Innlogging: /logg-inn · Registrering: /registrer

Hovednavigasjon (venstremeny etter innlogging)
- /dashboard — Oversikt
- /budsjett — Budsjett (med underfane /budsjett/dashboard — Budsjett dashboard)
- /transaksjoner — Transaksjoner (med underfane /transaksjoner/dashboard — Transaksjonsdashboard)
- /sparing — Sparing (under /sparing/formuebygger — Formuebyggeren PRO)
- /gjeld — Gjeld
- /snoball — Snøball
- /investering — Investering
- /rapporter — Rapporter (under /rapporter/bank og /rapporter/sparemal)
- /enkelexcel-ai — EnkelExcel AI
- Nederst i menyen: snarvei «Administrer abonnement» → /konto/betalinger (viser Solo/Familie og Stripe)
- Min konto: /konto/innstillinger (redirect fra /konto), med undermenyer Innstillinger, Budsjettkategorier, Betalinger, Sikkerhet, Roadmap

Profiler, abonnement og «Viser data for»
- Solo-abonnement: én profil i appen.
- Familie-abonnement: flere profiler i samme husholdning (inntil fem profiler).
- Øverst i menyen velger du hvilken profils data som vises, eller «Husholdning» når Familie har minst to profiler — da vises summerte tall for alle.
- I husholdningsvisning er mange skjemaer skrivebeskyttet (kun lesing). For å redigere tall, bytt til én enkeltprofil.
- App-valg for Solo vs Familie (hvilken plan som styrer antall profiler) skilles fra betalt Stripe-abonnement; det siste styres på Betalinger-siden.

Data og lagring
- Innlogget bruker har økonomidata knyttet til kontoen (synkronisert via tjenesten). Ikke gi tekniske detaljer brukeren ikke trenger med mindre de spør.

Startveiledning (første gangs oppsett, 6 steg)
- Vises som dialog over appen når ny bruker starter (kan åpnes på nytt fra Min konto → Innstillinger → «Vis veiledningen på nytt»).
- Steg: velkomst → navn på profil → budsjettår (eller melding hvis du allerede har arkiverte år) → omtrentlig hovedinntekt per måned (setter «Lønn» i budsjettet) → valgfritt demodata → «Du er klar» med lenker til oversikt, transaksjoner, budsjett.
- «Hopp over» avslutter veiledningen uten alle steg.

Demodata
- Slås på/av under startveiledning eller Min konto → Innstillinger (seksjonen «Demodata»). Når demodata er på, vises eksempeldata for blant annet budsjett, transaksjoner, sparemål, investeringer og lån; egne data lagres og gjenopprettes når demodata slås av.

Oversikt (/dashboard)
- Undertittel: personlig oversikt, eller «Samlet husholdning — alle profiler» i husholdningsmodus.
- Kort: inntekt i år, utgifter i år (budsjettår), total gjeld, investeringer (markedsverdi) — basert på registrerte data.
- Graf: inntekt vs. utgifter (seks måneder), topp 10 utgiftskategorier (kan åpnes for detaljer), lenke til transaksjoner, modaler for inntekt/utgift per måned, sparing og investeringer der det er implementert.

Budsjett (/budsjett)
- Planlegg inntekter og utgifter per måned for valgt budsjettår.
- Grupper: Inntekter; Regninger; Utgifter; Gjeld; Sparing — hver med egne budsjettlinjer du kan legge til.
- Månedsvisning eller årsvisning; «brukt» mot plan kobles til transaksjoner i samme kategori der det er relevant.
- Underfaner: «Budsjett» og «Budsjett dashboard» — dashboard har blant annet sammenligning plan vs. faktisk og knapp «Last ned CSV» for eksport.
- Bytt budsjettår, start nytt år, åpne arkiverte år (visning av gamle år kan være skrivebeskyttet; aktivt år redigeres normalt).

Transaksjoner (/transaksjoner)
- Registrer enkelttransaksjoner: dato, beskrivelse, beløp, kategori, ev. underkategori.
- Kobling til budsjettkategorier oppdaterer «brukt» i budsjettet.
- Underfaner: liste med filtre (år, måned, kategori, søk) og «Transaksjonsdashboard» med oppdeling og lenker inn til filtrert liste.
- Fra flere steder (f.eks. budsjettdashboard) kan du komme til transaksjoner med forhåndsfilter.

Sparing (/sparing)
- Sparemål: navn, målbeløp, valgfri måldato, valgfri kobling til en budsjettkategori under gruppen «Sparing».
- Med kobling til sparekategori: innskudd kan registreres som transaksjon i den kategorien. Uten kobling: innskudd som egne poster på målet.
- Lenke «Formuebyggeren PRO» (/sparing/formuebygger): egen simulator for langsiktig formue, kjøpekraft og milepæler (separat fra sparemål-listen).

Gjeld (/gjeld)
- Registrer lån med navn, total/rest, rente, månedlig betaling og type (bl.a. Boliglån, Lån, Studielån, Kredittkort, Annet).
- Standard: boliglån er ofte ikke med i snøball automatisk; andre typer kan være det — overstyr med «Ta med i snøball» (også i detalj).
- Detaljer: pause, endre felter, snøball-innstilling. Oversikt viser bl.a. total gjeld, månedlige avdrag, høyeste rente, estimat årlig rentekostnad.

Snøball (/snoball)
- Strategi: Snøball (minste restgjeld først) eller Avalanche (høyeste rente først).
- «Ekstra nedbetaling per måned» for simulering. Viser kø, fokuslån, grafer basert på gjeld fra Gjeld-modulen og hva som er med i snøball.
- Lån utenfor kø eller med pause kan fortsatt administreres under Gjeld.

Investering (/investering) — sidetittel «Investering», undertittel «Porteføljeoversikt og avkastning»
- Formål: samle egen portefølje i NOK — ikke skatte-, juridisk eller investeringsrådgivning.
- Øverst til høyre: «Mer om daglig verdi» forklarer daglig markedsverdi.
- Fire sammendragskort: «Kjøpsverdi», «Markedsverdi», «Total avkastning» (kr), «Avkastning %» — med små topplister.
- «Kursoppslag» (sammenleggbar; «Åpne for søk i aksjer og fond»):
  - Uten komma: søk på selskapsnavn eller ticker; i trefflisten «Legg til» åpner «Legg til posisjon» (kjøpsdato, antall enheter, valgfritt kjøpsbeløp NOK, valg om kjøpsverdi = kurs pluss typisk valuta-/meglerpåslag).
  - Med komma i feltet (flere tickere): kun hurtig kursvisning — ingen lagring som porteføljeposisjon.
  - Kursdata via Finnhub (deres vilkår/kvoter). Pris i instrumentvaluta; omregning til NOK med dagskurs (Frankfurter/ECB) via server.
  - Posisjoner med ticker og antall: knapp «Oppdater kurs og dagens verdi» (fersk kurs + dagens verdi i historikk).
- «Utvikling i porteføljen»: graf «Samlet markedsverdi over tid» — trenger minst tre historikkpunkter (bygges bl.a. ved gjentatte besøk for kurskoblede posisjoner eller manuell historikk).
- «Portefølje»: liste med kjøp, marked, avkastning kr/%; kurskoblede rader viser antall, ticker, valuta og at markedsverdi oppdateres ved besøk; ellers felt «Oppdater verdi», klokke for historikk, søppel for slett; klikk rad for detalj/historikk.
- «Fordeling»: kakediagram etter type (Aksjer, Fond, Krypto, Obligasjoner, Annet).
- «Legg til investering»: manuelt skjema — navn, type, kjøpsverdi (NOK), nåværende verdi (NOK), kjøpsdato; «Legg til» / «Avbryt».

Rapporter
- /rapporter — menyvalg «Rapport til bank» og «Sparemålrapport».
- /rapporter/bank — velg år og måned; utskrift eller lagre som PDF; innhold: blant annet gjeld, sparing, investeringer, budsjett mot faktisk for måneden.
- /rapporter/sparemal — sparemål, fremdrift, aktivitet; PDF/utskrift.

EnkelExcel AI (/enkelexcel-ai)
- Chat med «EnkelExcel AI» om budsjett, sparing, gjeld og hvordan appen brukes (sammen med bruksveiledningen du leser nå og brukerens tall i samme forespørsel).
- Svar skal være ren tekst uten Markdown (ingen **, kodeblokker, osv.) — som beskrevet i systeminstruksen.
- Meldingskvote: standard inkludert antall meldinger per kalendermåned (serverstyrt; typisk 100 med mindre drift har satt annet). Når inkluderte meldinger er brukt opp, kan du ha «ekstra meldinger» (bonus credits) hvis kjøpt.
- Kjøp av ekstra AI-meldinger: fra chattsiden går betaling via Stripe (egen checkout); etter vellykket betaling returneres du til chatten med ?ai_credits=success.
- Samtale lagres lokalt i nettleseren per bruker (persistens på enheten), ikke som full sikkerhetskopi i skyen — ta kontakt ved behov for personsikkerhet.
- Forslag til spørsmål i UI matcher typiske bruksmønstre (oppsummering, sparing, gjeld, tips).
- Erstatter ikke menneskelig rådgivning.

Min konto — oversikt
- Header «Min konto» med undertittel om administrasjon. Venstre undermeny: Innstillinger, Budsjettkategorier, Betalinger, Sikkerhet, Roadmap.

Innstillinger (/konto/innstillinger)
- Profil: navn og e-post (Supabase), lagre endringer.
- Demodata og startveiledning (se over).
- Varsler: visuelle brytere i grensesnittet (visningsformål i appen).

Budsjettkategorier (/konto/budsjett-kategorier)
- Skjul standardforslag du ikke bruker, legg til egne navn per hovedgruppe (Inntekter, Regninger, Utgifter, Gjeld, Sparing). Brukes i nedtrekk ved nye budsjettlinjer.

Betalinger og abonnement (/konto/betalinger)
- Stripe-abonnement Solo eller Familie: knappene «Abonner med kort (Solo)» / «Abonner med kort (Familie)» starter Stripe Checkout.
- «Velg Solo (app)» / «Velg Familie (app)» styrer hvilken plan som gjelder profiler lokalt i appen (opp mot maks profiler for Solo).
- Ved aktivt Stripe-abonnement vises status og ofte sluttdato for gjeldende periode.
- Endre betalingskort eller si opp abonnement: ingen full Stripe-kundeportal innebygd i app per nå (teksten på siden sier kundeportal kan komme senere). For kortbytte eller oppsigelse: kontakt post@enkelexcel.no eller bruk det du har mottatt fra Stripe på e-post.
- Seksjonen «Betalingsmetode» forklarer at kort knyttes til Stripe ved abonnement.

Sikkerhet (/konto/sikkerhet)
- Passord: skjema for å endre innloggingspassord.
- Tofaktorautentisering: seksjon med knapp «Aktiver» (ekstra beskyttelse med engangskode — om funksjonen er aktiv, følg appens meldinger).
- Aktive økter: viser blant annet «Denne enheten» (forenklet liste).

Roadmap (/konto/roadmap)
- Funksjonsønsker: opprett forslag (tittel/beskrivelse), stem, se statuskolonner (venter, godkjent, under arbeid, ferdig, avvist). Ved demodata kan eksempelønsker vises.

Formuebyggeren PRO (/sparing/formuebygger)
- Langsiktig simulering av formue og kjøpekraft; egne felt og tabeller; kan eksportere PDF der det er knapp for det i grensesnittet.

Viktig for svar i chat
- Match spørsmålet mot riktig seksjon over (f.eks. investering → Investering, abonnement → Betalinger).
- Når brukeren spør «hvordan gjør jeg …», gi steg som finnes i appen her — ikke finn opp nye knapper.
- Skille mellom generell økonomiteori og det Smart Budsjett faktisk gjør.
- Ved tvil om hva som er implementert: si at brukeren kan sjekke siden i appen eller kontakte post@enkelexcel.no.`
