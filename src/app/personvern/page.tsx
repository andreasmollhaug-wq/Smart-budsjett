import type { Metadata } from 'next'
import Link from 'next/link'
import LegalArticle, { LegalLi, LegalP, LegalSection, LegalUl } from '@/components/legal/LegalArticle'
import { COMPANY_NAME, CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Personvern',
  description: `Personvernerklæring for Smart Budsjett fra ${COMPANY_NAME}.`,
}

export default function PersonvernPage() {
  return (
    <LegalArticle
      title="Personvernerklæring"
      description={`Sist oppdatert: 6. april 2026 · Smart Budsjett er levert av ${COMPANY_NAME}.`}
    >
      <LegalSection title="1. Innledning">
        <LegalP>
          Denne personvernerklæringen beskriver hvordan {COMPANY_NAME} («vi», «oss») behandler personopplysninger når du bruker
          nettjenesten Smart Budsjett («Tjenesten»). Vi respekterer personvernet ditt og behandler opplysninger i tråd med
          personopplysningsloven og EU-forordning 2016/679 (GDPR).
        </LegalP>
        <LegalP>
          Ved å bruke Tjenesten samtykker du til denne erklæringen der loven åpner for det, og du er informert om behandlingen som
          beskrives nedenfor.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Behandlingsansvarlig">
        <LegalP>
          Behandlingsansvarlig for personopplysningene knyttet til Smart Budsjett er {COMPANY_NAME}. For spørsmål om
          personvern, kontakt oss på{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Hvilke opplysninger vi behandler">
        <LegalP>Avhengig av hvordan du bruker Tjenesten, kan vi behandle:</LegalP>
        <LegalUl>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Konto og innlogging:</strong> e-postadresse, passord (kryptert hos
            leverandør), teknisk identifikator for økt og autentisering.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Budsjett- og økonomidata:</strong> opplysninger du selv legger inn i
            Tjenesten, for eksempel inntekter, utgifter, kategorier, transaksjoner, sparemål, gjeld, investeringsregistreringer
            og annet innhold du velger å lagre.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Abonnement og betaling:</strong> opplysninger knyttet til kjøp og
            abonnement (f.eks. kundeidentifikator, plan, betalingsstatus). Betalingskortinformasjon behandles av vår
            betalingsleverandør; vi lagrer ikke fullt kortnummer på våre servere.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Bruk av EnkelExcel AI:</strong> meldinger du sender til AI-funksjonen og
            nødvendig kontekst fra kontoen din for å besvare forespørselen, i samsvar med funksjonens formål og tekniske
            begrensninger.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Teknisk og bruksdata:</strong> IP-adresse, enhetstype, nettlesertype,
            tidspunkt for forespørsel og informasjon som trengs for drift, sikkerhet og feilsøking.
          </LegalLi>
        </LegalUl>
      </LegalSection>

      <LegalSection title="4. Formål og rettslig grunnlag">
        <LegalP>Vi behandler personopplysninger for å:</LegalP>
        <LegalUl>
          <LegalLi>levere, drifte og forbedre Tjenesten (avtale med deg, GDPR art. 6 nr. 1 bokstav b);</LegalLi>
          <LegalLi>oppfylle rettslige forpliktelser, f.eks. bokførings- og regnskapskrav der det gjelder (art. 6 nr. 1 bokstav c);</LegalLi>
          <LegalLi>
            ivareta berettigede interesser, for eksempel å sikre systemer mot misbruk og analysere aggregert bruk (art. 6 nr. 1
            bokstav f), med mindre dine interesser går foran;
          </LegalLi>
          <LegalLi>
            der det er nødvendig, innhente samtykke til bestemte behandlinger, for eksempel valgfrie funksjoner eller
            markedsføring hvis vi tilbyr det og du har samtykket (art. 6 nr. 1 bokstav a).
          </LegalLi>
        </LegalUl>
      </LegalSection>

      <LegalSection title="5. Databehandlere og overføring">
        <LegalP>
          Vi bruker nøye utvalgte leverandører som behandler data på våre vegne («databehandlere»), blant annet:
        </LegalP>
        <LegalUl>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Supabase</strong> for autentisering, database og lagring av applikasjonsdata
            i sikre miljøer.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Stripe</strong> for betaling og abonnementshåndtering.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>Vercel</strong> (eller tilsvarende) for hosting og kjøring av
            nettapplikasjonen.
          </LegalLi>
          <LegalLi>
            <strong style={{ color: 'var(--text)' }}>OpenAI</strong> (eller tilsvarende) der du bruker EnkelExcel AI, for å
            generere svar basert på forespørsel og tillatt kontekst.
          </LegalLi>
        </LegalUl>
        <LegalP>
          Databehandlere er kontraktsmessig forpliktet til å følge våre instruksjoner og tilby tilstrekkelig sikkerhet. Noen
          leverandører kan ha servere utenfor EU/EØS. I slike tilfeller sikrer vi overføring gjennom godkjente mekanismer, for
          eksempel EU-standardkontraktsklausuler eller beslutning om tilstrekkelig beskyttelsesnivå.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Lagringstid">
        <LegalP>
          Vi lagrer personopplysninger så lenge du har aktiv konto og det er nødvendig for formålene over, med mindre lenger
          lagring kreves ved lov (f.eks. regnskapsmaterialer). Når du sletter kontoen eller vi avslutter avtalen, sletter eller
          anonymiserer vi data innen rimelig tid, med mindre vi må oppbevare visse opplysninger for å oppfylle rettslige krav.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Dine rettigheter">
        <LegalP>Etter GDPR har du rett til å:</LegalP>
        <LegalUl>
          <LegalLi>kreve innsyn i egne personopplysninger;</LegalLi>
          <LegalLi>kreve retting av uriktige opplysninger;</LegalLi>
          <LegalLi>under visse vilkår kreve sletting («retten til å bli glemt»);</LegalLi>
          <LegalLi>under visse vilkår kreve begrensning av behandling eller utlevere data i et strukturert format (dataportabilitet);</LegalLi>
          <LegalLi>gjøre innsigelse mot behandling som bygger på berettiget interesse;</LegalLi>
          <LegalLi>trekke tilbake samtykke der behandlingen er basert på samtykke, uten at det påvirker lovligheten før tilbaketrekking.</LegalLi>
        </LegalUl>
        <LegalP>
          Ta kontakt på{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>{' '}
          for å utøve rettighetene dine. Vi svarer så raskt vi kan, og senest innen én måned der loven krever det.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Informasjonskapsler og lokal lagring">
        <LegalP>
          Tjenesten kan bruke teknisk nødvendige informasjonskapsler eller tilsvarende lagring for innlogging, sikkerhet og
          preferanser. EnkelExcel AI kan bruke lokal lagring i nettleseren for å huske samtalehistorikk på enheten din; du kan
          slette dette i nettleserens innstillinger.
        </LegalP>
      </LegalSection>

      <LegalSection id="sikkerhet" title="9. Sikkerhet">
        <LegalP>
          Vi iverksetter passende tekniske og organisatoriske tiltak for å beskytte personopplysninger mot uautorisert tilgang,
          tap og endring. Ingen overføring over internett er imidlertid hundre prosent sikker; du bruker Tjenesten på eget ansvar
          når det gjelder sikker bruk av passord og enheter.
        </LegalP>
      </LegalSection>

      <LegalSection title="10. Klage til Datatilsynet">
        <LegalP>
          Hvis du mener vi behandler personopplysninger i strid med regelverket, oppfordrer vi deg til å kontakte oss først. Du
          har også rett til å klage til Datatilsynet (
          <a
            href="https://www.datatilsynet.no"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--primary)' }}
          >
            datatilsynet.no
          </a>
          ).
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Endringer i personvernerklæringen">
        <LegalP>
          Vi kan oppdatere denne erklæringen ved endringer i Tjenesten eller lovkrav. Den til enhver tid gjeldende versjon
          publiseres på denne siden med oppdatert «sist oppdatert»-dato. Ved vesentlige endringer kan vi varsle deg på e-post eller
          i Tjenesten.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Kontakt">
        <LegalP>
          Spørsmål om personvern:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>
        </LegalP>
        <LegalP className="pt-2">
          Se også{' '}
          <Link href="/vilkar" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            vilkår for bruk
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
