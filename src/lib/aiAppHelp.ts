/**
 * Offisiell bruksveiledning for EnkelExcel AI (Smart Budsjett).
 * Oppdater når UI, flyter eller produkttekst endres.
 */
export const AI_APP_HELP_TEXT = `--- Bruksveiledning for Smart Budsjett (offisiell referanse for AI) ---

Om denne teksten og ansvar
- Bruk denne teksten når brukeren spør hvordan appen fungerer, hvor noe finnes, eller hva som er støttet.
- Smart Budsjett er et verktøy for oversikt og planlegging — ikke personlig økonomisk, juridisk, skattemessig eller investeringsrådgivning. AI-svar i appen er automatisert hjelp.
- Ikke finn opp skjermbilder, knapper eller menyer som ikke står beskrevet her.
- Vær på brukerens lag: svar konkret med neste steg i appen der det er naturlig, og praktiske tips som passer innholdet her og brukerens tall — uten nedlatende tone.

Kontakt og juridiske sider (utenfor innlogget app)
- Leverandør: EnkelExcel. Generell kontakt e-post for personvern og henvendelser: post@enkelexcel.no (som i personvernerklæringen).
- Personvernerklæring: /personvern
- Vilkår: /vilkar
- Sikkerhet (offentlig oversikt, ikke Min konto): /sikkerhet
- Innlogging: /logg-inn · Registrering: /registrer
- Glemt passord: /glemt-passord — bestill e-post med lenke for å sette nytt passord. Etter at du åpner lenken fra e-post, kan du angi nytt passord på /tilbakestill-passord (når gjenopprettingsøkta fra e-postlenken er aktiv). Er du allerede innlogget og vil bytte passord uten «glemt», bruk Min konto → Sikkerhet (/konto/sikkerhet).
- Markedsføring og innhold uten app-shell (eksempler): forsiden / · partner-/kampanjeside /iris · artikler /guider · /produktflyt — innlogging skjer via /logg-inn.

Hovednavigasjon (venstremeny etter innlogging)
- /dashboard — Oversikt
- /budsjett — Budsjett (underfaner: /budsjett/dashboard — Budsjett dashboard; /budsjett/husholdning — Husholdning, kun når «Viser data for» er husholdning med Familie og minst to profiler)
- /transaksjoner — Transaksjoner (undermeny: /transaksjoner/kommende — Kommende planlagte transaksjoner; /transaksjoner/dashboard — Transaksjonsdashboard)
- /sparing — Sparing (underfaner: /sparing/smartspare — smartSpare, planlegging av inntekt mot mål over en periode; /sparing/formuebygger — Formuebyggeren PRO)
- /gjeld — Gjeld: under «Oversikt» (/gjeld) registreres og administreres lån. Når appen er satt til Familie-abonnement og det finnes minst to profiler, vises også underfanen «Husholdning» (/gjeld/husholdning) med samlet husholdnings-KPI, per-person-kort, diagrammer og modal (se egen seksjon «Gjeld»). Uten to profiler eller med Solo vises ingen gjeld-underfane — bare hovedsiden.
- /snoball — Snøball
- /investering — Investering
- /rapporter — Rapporter (under bl.a. /rapporter/bank, /rapporter/manedsinnsikt og /rapporter/sparemal)
- /enkelexcel-ai — EnkelExcel AI
- /abonnementer — Tjenesteabonnementer (faste abonnement som Netflix/Spotify; sum mnd/år, antall aktive; valgfri synk til budsjett under Regninger; i husholdning kan appen foreslå delt/familieabonnement når samme tjeneste er valgt fra listen for flere profiler)
- Nederst i menyen: snarvei «Administrer abonnement» → /konto/betalinger (viser Solo/Familie og Stripe)
- Min konto: /konto/innstillinger (redirect fra /konto), med undermenyer Innstillinger, **Profiler** (kun synlig med Familie-abonnement — se egen seksjon), Kom i gang (utvidet guide), Budsjettkategorier, Betalinger, Sikkerhet, Roadmap, Importer transaksjoner (CSV fra Excel-mal; beløp støtter norsk tallformat med tusenskille og komma som desimal, avrundet til hele kroner; nederst i menyen)

Profiler, abonnement og «Viser data for»
- Solo-abonnement: én profil i appen.
- Familie-abonnement: flere profiler i samme husholdning (inntil fem profiler).
- Øverst i menyen velger du hvilken profils data som vises, eller «Husholdning» når Familie har minst to profiler — da vises summerte tall for alle.
- I husholdningsvisning er mange skjemaer skrivebeskyttet (kun lesing). For å redigere tall, bytt til én enkeltprofil.
- App-valg for Solo vs Familie (hvilken plan som styrer antall profiler) skilles fra betalt Stripe-abonnement; det siste styres på Betalinger-siden.
- Felles utgift mellom profiler (Familie): appen har ingen egen «splitt»-knapp. Vanlig praksis er å bruke samme budsjettkategori og registrere riktig andel på hver profil (f.eks. halvpart på hver ved 50/50) — bytt til én profil om gangen i «Viser data for» og legg inn transaksjonen der.

Data og lagring
- Innlogget bruker har økonomidata knyttet til kontoen (synkronisert via tjenesten). Ikke gi tekniske detaljer brukeren ikke trenger med mindre de spør.

Startveiledning (første gangs oppsett, 6 steg)
- Vises som dialog over appen når ny bruker starter (kan åpnes på nytt fra Min konto → Innstillinger → «Vis veiledningen på nytt»).
- Steg: velkomst → navn på profil → budsjettår (eller melding hvis du allerede har arkiverte år) → omtrentlig hovedinntekt per måned (setter «Lønn» i budsjettet) → valgfritt demodata → «Du er klar» med lenker til oversikt, transaksjoner, budsjett.
- «Hopp over» avslutter veiledningen uten alle steg.
- Utvidet valgfri guide (anbefalt rekkefølge, moduler, tips): /konto/kom-i-gang — også lenket fra siste steg i startveiledningen og fra Min konto → Innstillinger.
- Kom i gang-siden (/konto/kom-i-gang) er en utvidet reise i anbefalt rekkefølge: (1) budsjettår og hovedinntekt, (2) budsjett linje for linje, (3) transaksjoner for faktiske tall, (4) oversikten, (5) sparing/gjeld/snøball, (6) rapporter, investering og EnkelExcel AI — pluss valgfri dybde om Formuebyggeren PRO.

Demodata
- Slås på/av under startveiledning eller Min konto → Innstillinger (seksjonen «Demodata»). Når demodata er på, vises eksempeldata for blant annet budsjett, transaksjoner, sparemål, investeringer og lån; egne data lagres og gjenopprettes når demodata slås av. I familiehusholdning med flere profiler er eksempeldata ulike per medlem (første profil følger standardsettet).

Oversikt (/dashboard)
- Undertittel: personlig oversikt, eller «Samlet husholdning — alle profiler» i husholdningsmodus.
- Øverst under overskriften: periodeverktøy (velg år, og periode: «Hittil i år» som standard, eller én måned, eller hele året). For «Hittil i år» kan du også velge siste måned i intervallet (f.eks. januar–april). Dette styrer hvilke transaksjons- og budsjett-tall som vises i de delene av siden som følger filteret (se under).
- Følger valgt år/periode: KPI-kortene «Inntekt», «Utgifter», «Total gjeld», «Investeringer»; «Topp 10 utgifter» (summert per kategori i perioden); «Fest og variabelt forbruk» (faktiske utgifter: fest = månedlige budsjettkategorier eller kobling til tjenesteabonnement/gjeldstrekk; variabelt = resten). Under det: eget kompakt kort «Sparegrad» (ikke full bredde) med total sparegrad for valgt periode og linjegraf for samme nøkkeltall måned for måned innenfor perioden. Nederst på siden (etter «Mot budsjett» / «Siste aktivitet»): to KPI-lignende kort «Abo-kostnad» og «Antall abonnement» for tjenesteabonnementer (samme periode som filter; årlige fordeles på 12 måneder per aktive måneder) med lenke til /abonnementer. I husholdningsvisning: kompakt tabell «Fordeling i husholdningen» med lenke til /budsjett/husholdning.
- På brede skjermer er hovedinnholdet i to kolonner (venstrejustert): venstre kolonne har «Mot budsjett» (plan vs. faktisk) med valgfri boks «Samme periode i [forrige år]» når det finnes transaksjonsdata for sammenligning, under det «Faste trekk (budsjett)», og under det eventuelt «Dette bør du sjekke»; høyre kolonne har «Siste aktivitet». På smal skjerm stables vertikalt. Modaler fra inntekt/utgift-KPI viser hele budsjettåret for budsjett, med markering av måneder utenfor valgt periode.
- Følger ikke perioden (uavhengig av datovelgeren): «Total gjeld» (samlet restgjeld per nå), «Investeringer» (markedsverdi per nå), og sparemål-kortene lenger ned (bygger på sparemål og tilknyttede beløp — ikke filtrert på valgt måned/år på oversikten). Seks-månedersgrafen «Inntekt vs. utgifter (6 mnd)» inkluderer grønn linje for netto (inntekt − utgift) per måned og følger aktivt budsjettår (trend), ikke nødvendigvis filteråret; hjelpetekst på siden forklarer dette.
- Lenker til transaksjoner kan forhåndsfiltere på samme år/periode som på oversikten.

Budsjett (/budsjett)
- Planlegg inntekter og utgifter per måned for valgt budsjettår.
- Grupper: Inntekter; Regninger; Utgifter; Gjeld; Sparing — hver med egne budsjettlinjer du kan legge til.
- Innenfor hver gruppe kan du endre rekkefølgen på linjene med små opp/ned-knapper ved linjen (når budsjettet er redigerbart).
- Månedsvisning eller årsvisning; «brukt» mot plan kobles til transaksjoner i samme kategori der det er relevant.
- Underfaner: «Budsjett», «Budsjett dashboard» (plan vs. faktisk, «Last ned CSV»), og «Husholdning» (kun i husholdningsvisning) med fordeling per person: budsjettert inntekt og faktiske beløp per profil.
- Bytt budsjettår, start nytt år, åpne arkiverte år (visning av gamle år kan være skrivebeskyttet; aktivt år redigeres normalt).

Transaksjoner (/transaksjoner)
- Registrer enkelttransaksjoner: dato, beskrivelse, beløp, kategori, ev. underkategori.
- Kobling til budsjettkategorier oppdaterer «brukt» i budsjettet.
- Undermeny på transaksjonssidene: «Transaksjoner» (liste med filtre), «Kommende» (/transaksjoner/kommende — etter forfall, inneværende måned og senere; marker som gjennomgått eller betalt, eller slett), «Transaksjonsdashboard» med oppdeling og lenker inn til filtrert liste.
- Fremtidig dato ved registrering eller importerte fremtidige rader kan merkes som planlagt oppfølging. Synkede planlagte trekk fra gjeld eller tjenesteabonnement følger samme flyt.
- Varsler (klokke): innsikt når forfalte planlagte poster finnes og/eller uferdig plan i inneværende måned (ikke gjennomgått); åpne «Kommende» fra varselet eller menyen. Grensesnittet er tilpasset mobil (korte faner, store trykkflater).
- I transaksjonslisten kan du se om en planlagt rad er «gjennomgått» (stempel). Kortene på listen viser fortsatt beløp til og med i dag; fremtidige beløp står i listen.
- Fra flere steder (f.eks. budsjettdashboard) kan du komme til transaksjoner med forhåndsfilter.

Sparing (/sparing)
- Underfaner: «Sparing» (/sparing), «smartSpare» (/sparing/smartspare), «Formuebygger» (/sparing/formuebygger).
- Sparing (/sparing): sparemål med navn, målbeløp, valgfri måldato, valgfri kobling til en budsjettkategori under gruppen «Sparing».
- Med kobling til sparekategori: innskudd kan registreres som transaksjon i den kategorien. Uten kobling: innskudd som egne poster på målet.
- smartSpare: **Oversikt** på /sparing/smartspare (i **enkeltprofilvisning** kun aktiv profils planer; i **husholdning** alle medlemmer). **Periodefilter** (år / hittil i år / én måned / hele året) styrer «hittil»-KPI på oversikt og planside (klippet til i dag). **Tjent hittil** kommer fra brutto-tabellen (målgrunnlag før/etter skatt). **Innbetalt hittil** er månedlige tilføringer (trykk på **kildeknappen** i venstrespalten med kildenavnet — i vinduet velger du **måned** og kan tilføre) pluss valgfri **engangs** under Innstillinger — fremdriftskake og rest mot mål bygger på **innbetalt**, ikke tjent+innbetalt (unngår dobbeltelling). **Månedscellene** er **brutto per måned**; i kildevinduet ser du brutto/skatt/netto for valgt måned, og med skatt på kan du sette **egen skatteprosent per kilde** (tom = planens standard). **Én plan** på rute /sparing/smartspare/ etterfulgt av plan-id. Nye planer lagres på valgt profil under «Viser data for». «Åpne» på kort i husholdning bytter til riktig profil. Gammel ?plan= på oversikten videresendes til plansiden. /sparing/innspurt videresendes til /sparing/smartspare.
- Formuebyggeren PRO (/sparing/formuebygger): egen simulator for langsiktig formue, kjøpekraft og milepæler (separat fra sparemål-listen og smartSpare).

Gjeld (/gjeld)
- Registrer lån med navn, total/rest, rente, månedlig betaling og type (bl.a. Boliglån, Lån, Studielån, Kredittkort, Annet).
- Standard: boliglån er ofte ikke med i snøball automatisk; andre typer kan være det — overstyr med «Ta med i snøball» (også i detalj).
- Detaljer: pause, endre felter, snøball-innstilling. Oversikt viser bl.a. total gjeld, månedlige avdrag, høyeste rente, estimat årlig rentekostnad.
- Underfaner vises bare når **Familie-abonnement** og **minst to profiler** er på plass. Da har du «Oversikt» (/gjeld) og «Husholdning» (/gjeld/husholdning). Med Solo eller bare én profil kommer **ingen** horisontal underfane — kun gjeldssiden som i dag.
- Direkte besøk på /gjeld/husholdning uten rett til siden (ikke Familie eller færre enn to profiler) **videresendes** til /gjeld.
- **Gjeld → Husholdning** (/gjeld/husholdning): Tallene **følger «Viser data for»** øverst i menyen. Når **Husholdning** er valgt: samlet KPI for hele husholdningen, **per-person-kort**, diagrammer som sammenligner alle, stablet diagram per person og type. Når **én profil** er valgt: samme side viser **kun den profilens** gjeld, kort og diagrammer (ett medlem). KPI-tekstene og undertittel på siden tilpasses modus. Søylene har **tall over seg** i forkortet form (**k** = tusen, **M** = millioner). Klikk på **person** eller **søyle** åpner **modal** med alle lån for den profilen (lesing); redigering skjer på Gjeld → Oversikt når riktig profil er valgt, som forklart i modalen.
- Tallene på husholdningssiden er **samme registrerte gjeld** som under hver profil — appen **beregner ikke** egen «hvem bør betale hvor mye»-fordeling; det er ren oversikt og sammenligning.
- Lenker fra husholdningssiden: til full gjeldsoversikt og til Snøball der det er knapper for det.

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

Tjenesteabonnementer (/abonnementer)
- Oversikt over faste tjenesteabonnementer (streaming, programvare m.m.) med sum per måned og per år og antall aktive abonnement.
- Valgfritt: «Legg inn i budsjettet» synkroniserer planbeløp til en linje under Regninger (du slipper å taste samme beløp to ganger).
- Faktisk «brukt» i budsjettet følger fortsatt transaksjoner når du fører trekk i samme kategori.
- I Familie vises abonnementer samlet i husholdning med profilnavn; redigering gjøres når én profil er valgt. Når flere profiler har valgt samme tjeneste fra forhåndslisten, kan appen vise et nøytralt forslag om delt eller familieabonnement hos leverandøren.
- Registrerte abonnementer inngår i tallkonteksten til EnkelExcel AI når du spør om slike kostnader. I husholdningsvisning får AI en tabell med sum per profil (hvem som abonnerer på hva) pluss total for husholdningen, i tillegg til detaljlisten med profilmerking.
- Under /abonnementer finnes tre faner: «Registrer abonnement» (/abonnementer) — registrer og eventuelt synk til budsjett; «Sammendrag» (/abonnementer/sammendrag) — oversikt per profil, samlet kostnad og enkel visning av overlapp når samme tjeneste er valgt for flere; «Avsluttede» (/abonnementer/avsluttet) — tidligere avsluttede abonnement (historikk).

Rapporter
- /rapporter — menyvalg «Rapport til bank», «Månedsinnsikt» og «Sparemålrapport».
- /rapporter/bank — velg år og måned; kryss av hvilke deler som skal med; valgfri fritekst til saksbehandler; tre måneders sammenligning fra transaksjoner; utskrift eller lagre som PDF.
- /rapporter/manedsinnsikt — velg år og måned; generer ett AI-sammendrag per kalendermåned (serverstyrt kvote); nøkkeltall og tabeller mot budsjett; utskrift eller lagre som PDF (PDF teller ikke som ny generering). Tallene følger samme valgte visning som resten av appen (én profil eller samlet husholdning); siden forklarer hvilket grunnlag som brukes.
- /rapporter/sparemal — sparemål, fremdrift, aktivitet; PDF/utskrift.

EnkelExcel AI (/enkelexcel-ai)
- Chat med «EnkelExcel AI» om budsjett, sparing, gjeld og hvordan appen brukes (sammen med bruksveiledningen du leser nå og brukerens tall i samme forespørsel).
- Personvern: tallteksten som sendes til AI bygges kun fra den innloggede brukerens egen lagrede app-data — ikke andre brukeres kontoer.
- Hvilket tallgrunnlag som sendes til AI følger profilvelgeren til venstre: én profil eller samlet husholdning (Familie med minst to profiler). Chattsiden viser tydelig hvilket grunnlag som gjelder.
- I husholdningsmodus er mange beløp i tallteksten summert på tvers av profiler (aggregat). Enkeltlinjer som transaksjoner, abonnementer og en del andre poster kan være merket med profil (f.eks. [navn]). Når brukeren spør om hvem eller fordeling, bruk slike profilmerker og eventuell tabell per profil — ikke anta mer enn teksten viser.
- Innhold i tallteksten (typisk rekkefølge): innledning med budsjettår og visningsmodus; deretter tjenesteabonnementer (i husholdning: tabell per profil + detaljliste med [profil], plassert før transaksjoner slik at summene ikke forsvinner ved avkorting); transaksjoner (nyeste først, begrenset antall linjer) med profilkolonne i husholdning; kort utdrag av planlagte poster som krever oppfølging (Kommende); budsjettkategorier (brukt/plan for året); sparemål; gjeld; investeringer — med [profil] der det er relevant i husholdning. Ved svært mye data kan teksten avkortes (øvre tegnbegrensning); ikke gjett utover det som står.
- Spørsmål om **hvor i appen** man ser gjeld **fordelt på person**, **diagram** eller **detaljvisning per medlem**: med Familie og minst to profiler finnes **Gjeld → Husholdning** (/gjeld/husholdning) med grafer, tall over søyler (forkortet k/M) og modal ved klikk på person eller søyle — dette er **ikke** en egen datakilde utover registrert gjeld per profil; tallteksten til AI er liste/tabellbasert, siden er visuell.
- Svar skal være ren tekst uten Markdown (ingen **, kodeblokker, osv.) — som beskrevet i systeminstruksen.
- Meldingskvote: standard inkludert antall meldinger per kalendermåned (serverstyrt; miljøvariabel AI_MONTHLY_MESSAGE_LIMIT, standard 100). Når inkluderte meldinger er brukt opp, kan du ha «ekstra meldinger» (bonus credits) hvis kjøpt.
- Kjøp av ekstra AI-meldinger: fra chattsiden går betaling via Stripe (egen checkout); etter vellykket betaling returneres du til chatten med ?ai_credits=success.
- Samtale lagres lokalt i nettleseren per bruker (persistens på enheten), ikke som full sikkerhetskopi i skyen — ta kontakt ved behov for personsikkerhet.
- Forslag til spørsmål i UI matcher typiske bruksmønstre (oppsummering, sparing, gjeld, tips).
- Erstatter ikke menneskelig rådgivning.

Min konto — oversikt
- Header «Min konto» med undertittel om administrasjon. Venstre undermeny: Innstillinger, (med Familie også Profiler rett etter Innstillinger), Kom i gang, Budsjettkategorier, Betalinger, Sikkerhet, Roadmap, Importer transaksjoner.

Profiler (/konto/profiler) — kun med Familie-abonnement
- Menypunktet «Profiler» vises bare når appen er satt til Familie-plan (samme som for flere profiler i husholdningen). Med Solo-abonnement finnes ikke dette menypunktet; direkte besøk på /konto/profiler sender til Innstillinger.
- Her administrerer du **budsjettprofiler** i husholdningen (samme innloggede konto — ikke egne brukerkontoer per familiemedlem): se liste over profiler, **endre visningsnavn** (Lagre navn per rad), og **fjerne en ekstra profil** som ble lagt inn ved en feil eller ikke lenger skal brukes.
- **Hovedprofilen** (standard «Meg») kan **ikke slettes**; kun ekstra profiler kan fjernes med «Fjern profil» (med bekreftelse). Sletting er permanent og fjerner all økonomidata for den profilen (transaksjoner, budsjett, sparemål, gjeld, investeringer, tjenesteabonnementer m.m. knyttet til profilen).
- Nye profiler legges fortsatt til via «Legg til» ved «Viser data for» i sidemenyen (ikke på denne siden).

Innstillinger (/konto/innstillinger)
- Profil: navn og e-post (Supabase), lagre endringer.
- Demodata og startveiledning (se over); lenke «Les utvidet guide» til /konto/kom-i-gang.
- Varsler: visuelle brytere i grensesnittet (visningsformål i appen).

Budsjettkategorier (/konto/budsjett-kategorier)
- Skjul standardforslag du ikke bruker, legg til egne navn per hovedgruppe (Inntekter, Regninger, Utgifter, Gjeld, Sparing). Brukes i nedtrekk ved nye budsjettlinjer.

Betalinger og abonnement (/konto/betalinger)
- Stripe-abonnement Solo eller Familie: knappene «Abonner med kort (Solo)» / «Abonner med kort (Familie)» starter Stripe Checkout.
- «Velg Solo (app)» / «Velg Familie (app)» styrer hvilken plan som gjelder profiler lokalt i appen (opp mot maks profiler for Solo).
- Ved aktivt Stripe-abonnement vises status og ofte sluttdato for gjeldende periode.
- Endre betalingskort eller si opp abonnement: knappen «Administrer abonnement» på /konto/betalinger åpner Stripes kundeportal (når brukeren har Stripe-kunde). Ved behov kan bruker også kontakte post@enkelexcel.no.
- Seksjonen «Betalingsmetode» forklarer at kort knyttes til Stripe ved abonnement og at administrasjon skjer via kundeportalen.

Sikkerhet (/konto/sikkerhet)
- Passord: skjema for å endre innloggingspassord.
- Tofaktorautentisering: seksjon med knapp «Aktiver» (ekstra beskyttelse med engangskode — om funksjonen er aktiv, følg appens meldinger).
- Aktive økter: viser blant annet «Denne enheten» (forenklet liste).

Roadmap (/konto/roadmap)
- Funksjonsønsker: opprett forslag (tittel/beskrivelse), stem, se statuskolonner (venter, godkjent, under arbeid, ferdig, avvist). Ved demodata kan eksempelønsker vises.

Importer transaksjoner (/konto/importer-transaksjoner)
- Last opp CSV (Excel-mal fra siden eller egen fil i støttet format). Beløp kan bruke norsk tallformat (tusenskille og komma som desimal) og avrundes til hele kroner.
- Flyt: last opp → eventuelt kartlegg ukjente kategorinavn mot appens kategorier → forhåndsvis og bekreft import. Du kan laste ned mal fra importsiden.
- Importerte rader blir transaksjoner på aktiv profil (bytt profil i menyen før import hvis du vil legge inn på en bestemt profil).

Intern prosjekt — oppussing (/intern/prosjekt)
- Valgfri intern modul for prosjekt/oppussing med egne poster; ikke fullt synkronisert med hovedbudsjettet som resten av appen. Bruk hovedbudsjett og transaksjoner for ordinær husholdningsøkonomi.

Formuebyggeren PRO (/sparing/formuebygger)
- Langsiktig simulering av formue og kjøpekraft; egne felt og tabeller; kan eksportere PDF der det er knapp for det i grensesnittet.

Viktig for svar i chat
- Match spørsmålet mot riktig seksjon over (f.eks. investering → Investering; faste tjenesteabonnementer som Netflix/Spotify registrert i appen → Tjenesteabonnementer /abonnementer; betalt Solo/Familie-abonnement og Stripe → Betalinger /konto/betalinger; gjeld per person / diagram / modal på husholdningssiden → Gjeld-seksjonen over, rute /gjeld/husholdning med forutsetning Familie + minst to profiler).
- Når brukeren spør «hvordan gjør jeg …», gi steg som finnes i appen her — ikke finn opp nye knapper.
- Skille mellom generell økonomiteori og det Smart Budsjett faktisk gjør.
- Ved spørsmål om husholdning og fordeling: bruk profilmerket data og aggregater som beskrevet under EnkelExcel AI og Profiler — ikke anta tall som ikke står i tallteksten. Gjeld-husholdningssiden viser **ikke** en egen «rettferdig fordeling» av hvem som bør betale — bare registrerte lån og avdrag per profil.
- Ved tvil om hva som er implementert: si at brukeren kan sjekke siden i appen eller kontakte post@enkelexcel.no.`
