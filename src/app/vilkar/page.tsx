import type { Metadata } from 'next'
import Link from 'next/link'
import LegalArticle, { LegalLi, LegalP, LegalSection, LegalUl } from '@/components/legal/LegalArticle'
import { COMPANY_NAME, CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Vilkår',
  description: `Bruksvilkår for Smart Budsjett fra ${COMPANY_NAME}.`,
}

export default function VilkarPage() {
  return (
    <LegalArticle
      title="Vilkår for bruk av Smart Budsjett"
      description={`Sist oppdatert: 6. april 2026 · Tjenesten levert av ${COMPANY_NAME}.`}
    >
      <LegalSection title="1. Partene og aksept">
        <LegalP>
          Disse vilkårene («Vilkårene») regulerer bruk av nettjenesten Smart Budsjett («Tjenesten»), levert av {COMPANY_NAME}{' '}
          («vi», «oss»). Ved å opprette konto, registrere deg for prøveperiode eller på annen måte ta Tjenesten i bruk, erklærer du
          at du har lest og aksepterer Vilkårene. Hvis du ikke aksepterer Vilkårene, skal du ikke bruke Tjenesten.
        </LegalP>
        <LegalP>
          Du må være myndig eller ha samtykke fra foresatte for å inngå avtale om betalt abonnement der det er relevant etter
          norsk lov.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Beskrivelse av Tjenesten">
        <LegalP>
          Smart Budsjett er et digitalt verktøy for oversikt over privat økonomi, herunder blant annet budsjett, transaksjoner,
          sparing, gjeld, rapporter og valgfrie tilleggsfunksjoner som EnkelExcel AI. Funksjonalitet kan endres over tid.
          Tjenesten er et hjelpeverktøy; den erstatter ikke profesjonell økonomisk, juridisk eller skattemessig rådgivning.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Konto og påloggingsinformasjon">
        <LegalP>
          Du er ansvarlig for å oppgi korrekt informasjon ved registrering og for å holde innloggingsopplysninger konfidensielle.
          Du er ansvarlig for all aktivitet som skjer på kontoen din med mindre du kan dokumentere at uautorisert tilgang ikke
          skyldes uaktsomhet fra din side.
        </LegalP>
        <LegalP>
          Vi kan suspendere eller avslutte tilgang ved mistanke om misbruk, brudd på Vilkårene eller av sikkerhetsmessige grunner.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Prøveperiode, abonnement og betaling">
        <LegalP>
          Tjenesten tilbys som abonnement med de planer og priser som er angitt på nettsiden til enhver tid (f.eks. Solo og
          Familie). Priser kan endres med varsel i samsvar med punkt 11.
        </LegalP>
        <LegalP>
          Vi kan tilby en begrenset gratis prøveperiode. For prøveperioden kan det kreves registrering av betalingskort for
          senere fornyelse. Du blir ikke belastet for abonnementspris før prøveperioden er utløpt, med mindre annet er oppgitt ved
          registrering og i tråd med gjeldende informasjon på nettsiden.
        </LegalP>
        <LegalP>Betaling behandles av vår betalingsleverandør (Stripe). Ved kjøp godtar du også leverandørens vilkår i den grad de gjelder.</LegalP>
        <LegalP>
          Abonnement fornyes automatisk til gjeldende pris per periode (f.eks. månedlig) inntil det sies opp i henhold til punkt 5.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Oppsigelse og sletting">
        <LegalP>
          Du kan si opp abonnementet fra kontoinnstillingene i Tjenesten eller på annen måte vi til enhver tid oppgir. Oppsigelse
          slår som hovedregel inn ved utløpet av inneværende betalingsperiode, med mindre annet følger av lov eller av det som er
          opplyst i kassen.
        </LegalP>
        <LegalP>
          Vi kan si opp eller begrense Tjenesten med rimelig varsel ved vesentlige endringer eller avvikling, eller umiddelbart ved
          vesentlig kontraktsbrudd fra din side.
        </LegalP>
        <LegalP>
          Sletting av konto og behandling av personopplysninger beskrives i vår{' '}
          <Link href="/personvern" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            personvernerklæring
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Akseptabel bruk">
        <LegalP>Du forplikter deg til å:</LegalP>
        <LegalUl>
          <LegalLi>ikke bruke Tjenesten på en måte som bryter norsk lov eller tredjeparts rettigheter;</LegalLi>
          <LegalLi>ikke forsøke å omgå sikkerhet, få uautorisert tilgang til systemer eller andre brukeres data;</LegalLi>
          <LegalLi>ikke bruke Tjenesten til å spre skadelig kode eller overbelaste infrastruktur;</LegalLi>
          <LegalLi>ikke videreselge eller utleie Tjenesten uten skriftlig avtale med oss.</LegalLi>
        </LegalUl>
        <LegalP>
          Brudd kan føre til suspensjon, oppsigelse av avtalen og eventuelle erstatningskrav der det er grunnlag for det.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Immaterielle rettigheter">
        <LegalP>
          Alt innhold i Tjenesten (programvare, design, tekst, logoer med mer) tilhører {COMPANY_NAME} eller våre lisensgivere og er
          beskyttet av åndsverklov og annen lov. Du får en personlig, ikke-eksklusiv og ikke-overførbar rett til å bruke
          Tjenesten i henhold til Vilkårene.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. EnkelExcel AI">
        <LegalP>
          EnkelExcel AI er et automatisk verktøy. Svar kan være unøyaktige eller ufullstendige. Du skal ikke basere viktige
          økonomiske, juridiske eller skattemessige beslutninger utelukkende på AI-svar. Vi er ikke ansvarlige for følger av slik
          bruk.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Ansvarsbegrensning">
        <LegalP>
          Tjenesten leveres «som den er» i den utstrekning loven tillater. Vi garanterer ikke uavbrutt feilfri drift eller at
          resultatene oppfyller dine individuelle behov.
        </LegalP>
        <LegalP>
          Vi er ikke ansvarlige for indirekte tap, tap av fortjeneste, tap av data eller følgeskader, med mindre uaktsomheten er
          grov eller voldsforsett. Vårt samlede ansvar overfor deg i kontraktsforholdet er i utgangspunktet begrenset til det du har
          betalt oss for Tjenesten de siste tolv månedene før kravet oppstod, der ikke annet følger av ufravikelig lov.
        </LegalP>
        <LegalP>Vi er ikke ansvarlige for forhold som ligger utenfor vår rimelige kontroll (force majeure).</LegalP>
      </LegalSection>

      <LegalSection title="10. Endringer i Tjenesten og Vilkårene">
        <LegalP>
          Vi kan utvikle, endre eller avvikle funksjoner i Tjenesten. Vesentlige endringer i Vilkårene vil vi varsle om på
          rimelig vis, for eksempel via e-post eller melding i Tjenesten. Fortsatt bruk etter at endringen trer i kraft anses som
          aksept, med mindre du sier opp i forkant der loven krever det.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Lovvalg og tvister">
        <LegalP>
          Vilkårene er underlagt norsk lov. Tvister skal søkes løst i minnelighet. Dersom det ikke lykkes, kan hver part bringe
          saken inn for norske domstoler med verneting der loven gir adgang til det.
        </LegalP>
        <LegalP>
          For forbrukere gjelder ufravikelige rettigheter etter forbrukerkjøpsloven og annen relevant lov.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Kontakt">
        <LegalP>
          Spørsmål om Vilkårene eller Tjenesten:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>
        </LegalP>
        <LegalP className="pt-2">
          Se også{' '}
          <Link href="/personvern" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            personvernerklæringen
          </Link>{' '}
          og{' '}
          <Link href="/sikkerhet" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            sikkerhet (oversikt)
          </Link>
          .
        </LegalP>
      </LegalSection>
    </LegalArticle>
  )
}
