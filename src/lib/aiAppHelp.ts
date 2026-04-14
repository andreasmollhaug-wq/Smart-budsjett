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
- Sikkerhet (offentlig oversikt, ikke Min konto): /sikkerhet
- Innlogging: /logg-inn · Registrering: /registrer

Hovednavigasjon (venstremeny etter innlogging)
- /dashboard — Oversikt
- /budsjett — Budsjett (underfaner: /budsjett/dashboard — Budsjett dashboard; /budsjett/husholdning — Husholdning, kun når «Viser data for» er husholdning med Familie og minst to profiler)
- /transaksjoner — Transaksjoner (undermeny: /transaksjoner/kommende — Kommende planlagte transaksjoner; /transaksjoner/dashboard — Transaksjonsdashboard)
- /sparing — Sparing (under /sparing/formuebygger — Formuebyggeren PRO)
- /gjeld — Gjeld
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

Data og lagring
- Innlogget bruker har økonomidata knyttet til kontoen (synkronisert via tjenesten). Ikke gi tekniske detaljer brukeren ikke trenger med mindre de spør.

Startveiledning (første gangs oppsett, 6 steg)
- Vises som dialog over appen når ny bruker starter (kan åpnes på nytt fra Min konto → Innstillinger → «Vis veiledningen på nytt»).
- Steg: velkomst → navn på profil → budsjettår (eller melding hvis du allerede har arkiverte år) → omtrentlig hovedinntekt per måned (setter «Lønn» i budsjettet) → valgfritt demodata → «Du er klar» med lenker til oversikt, transaksjoner, budsjett.
- «Hopp over» avslutter veiledningen uten alle steg.
- Utvidet valgfri guide (anbefalt rekkefølge, moduler, tips): /konto/kom-i-gang — også lenket fra siste steg i startveiledningen og fra Min konto → Innstillinger.

Demodata
- Slås på/av under startveiledning eller Min konto → Innstillinger (seksjonen «Demodata»). Når demodata er på, vises eksempeldata for blant annet budsjett, transaksjoner, sparemål, investeringer og lån; egne data lagres og gjenopprettes når demodata slås av. I familiehusholdning med flere profiler er eksempeldata ulike per medlem (første profil følger standardsettet).

Oversikt (/dashboard)
- Undertittel: personlig oversikt, eller «Samlet husholdning — alle profiler» i husholdningsmodus.
- Øverst under overskriften: periodeverktøy (velg år, og periode: «Hittil i år» som standard, eller én måned, eller hele året). For «Hittil i år» kan du også velge siste måned i intervallet (f.eks. januar–april). Dette styrer hvilke transaksjons- og budsjett-tall som vises i de delene av siden som følger filteret (se under).
- Følger valgt år/periode: KPI-kortene «Inntekt» og «Utgifter» (faktiske beløp i perioden), «Topp 10 utgifter» (summert per kategori i perioden). På brede skjermer er hovedinnholdet i to kolonner (venstrejustert, ikke midtstilt): venstre kolonne har «Mot budsjett» (plan vs. faktisk), under det «Faste trekk (budsjett)» (budsjett for valgt sluttmåned i perioden), og under det eventuelt «Dette bør du sjekke»; høyre kolonne har «Siste aktivitet». På smal skjerm stables samme rekkefølge vertikalt. Modaler som åpnes fra inntekt/utgift-KPI viser hele budsjettåret for budsjett, med tydelig markering av hvilke måneder som er utenfor valgt periode.
- Følger ikke perioden (uavhengig av datovelgeren): «Total gjeld» (samlet restgjeld per nå), «Investeringer» (markedsverdi per nå), og sparemål-panelet «Sparemål» / «Spart totalt» (bygger på sparemål og tilknyttede beløp — ikke filtrert på valgt måned/år på oversikten). Seks-månedersgrafen «Inntekt vs. utgifter (6 mnd)» følger alltid aktivt budsjettår i appen (trend), ikke nødvendigvis det året du har valgt i filteret; hjelpetekst på siden forklarer når du filtrerer på et annet år enn aktivt budsjettår.
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
- Undermeny på transaksjonssidene: «Transaksjoner» (liste med filtre), «Kommende» (/transaksjoner/kommende — planlagte fremover og utestående etter planlagt dato; marker som gjennomgått eller betalt, eller slett), «Transaksjonsdashboard» med oppdeling og lenker inn til filtrert liste.
- Fremtidig dato ved registrering eller importerte fremtidige rader kan merkes som planlagt oppfølging. Synkede planlagte trekk fra gjeld eller tjenesteabonnement følger samme flyt.
- Varsler (klokke): når planlagt dato er passert, vises innsikt fra dagen etter med liste over poster som trenger oppfølging; åpne «Kommende» fra varselet eller menyen. Grensesnittet er tilpasset mobil (korte faner, store trykkflater).
- I transaksjonslisten kan du se om en planlagt rad er «gjennomgått» (stempel). Kortene på listen viser fortsatt beløp til og med i dag; fremtidige beløp står i listen.
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

Tjenesteabonnementer (/abonnementer)
- Oversikt over faste tjenesteabonnementer (streaming, programvare m.m.) med sum per måned og per år og antall aktive abonnement.
- Valgfritt: «Legg inn i budsjettet» synkroniserer planbeløp til en linje under Regninger (du slipper å taste samme beløp to ganger).
- Faktisk «brukt» i budsjettet følger fortsatt transaksjoner når du fører trekk i samme kategori.
- I Familie vises abonnementer samlet i husholdning med profilnavn; redigering gjøres når én profil er valgt. Når flere profiler har valgt samme tjeneste fra forhåndslisten, kan appen vise et nøytralt forslag om delt eller familieabonnement hos leverandøren.
- Registrerte abonnementer inngår i tallkonteksten til EnkelExcel AI når du spør om slike kostnader. I husholdningsvisning er abonnementer i AI-konteksten merket med profil der det er relevant.

Rapporter
- /rapporter — menyvalg «Rapport til bank», «Månedsinnsikt» og «Sparemålrapport».
- /rapporter/bank — velg år og måned; kryss av hvilke deler som skal med; valgfri fritekst til saksbehandler; tre måneders sammenligning fra transaksjoner; utskrift eller lagre som PDF.
- /rapporter/manedsinnsikt — velg år og måned; generer ett AI-sammendrag per kalendermåned (serverstyrt kvote); nøkkeltall og tabeller mot budsjett; utskrift eller lagre som PDF (PDF teller ikke som ny generering). Tallene følger samme valgte visning som resten av appen (én profil eller samlet husholdning); siden forklarer hvilket grunnlag som brukes.
- /rapporter/sparemal — sparemål, fremdrift, aktivitet; PDF/utskrift.

EnkelExcel AI (/enkelexcel-ai)
- Chat med «EnkelExcel AI» om budsjett, sparing, gjeld og hvordan appen brukes (sammen med bruksveiledningen du leser nå og brukerens tall i samme forespørsel).
- Hvilket tallgrunnlag som sendes til AI følger profilvelgeren til venstre: én profil eller samlet husholdning (Familie med minst to profiler). Chattsiden viser tydelig hvilket grunnlag som gjelder. I husholdningsmodus er transaksjoner og enkeltposter i konteksten merket med profil der det er relevant; konteksten kan også inkludere sparemål, gjeld og investeringer fra appen.
- Svar skal være ren tekst uten Markdown (ingen **, kodeblokker, osv.) — som beskrevet i systeminstruksen.
- Meldingskvote: standard inkludert antall meldinger per kalendermåned (serverstyrt; typisk 100 med mindre drift har satt annet). Når inkluderte meldinger er brukt opp, kan du ha «ekstra meldinger» (bonus credits) hvis kjøpt.
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

Formuebyggeren PRO (/sparing/formuebygger)
- Langsiktig simulering av formue og kjøpekraft; egne felt og tabeller; kan eksportere PDF der det er knapp for det i grensesnittet.

Viktig for svar i chat
- Match spørsmålet mot riktig seksjon over (f.eks. investering → Investering, abonnement → Betalinger).
- Når brukeren spør «hvordan gjør jeg …», gi steg som finnes i appen her — ikke finn opp nye knapper.
- Skille mellom generell økonomiteori og det Smart Budsjett faktisk gjør.
- Ved tvil om hva som er implementert: si at brukeren kan sjekke siden i appen eller kontakte post@enkelexcel.no.`
