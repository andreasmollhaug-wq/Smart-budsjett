import type { Metadata } from 'next'
import Link from 'next/link'
import LegalArticle, { LegalLi, LegalP, LegalSection, LegalUl } from '@/components/legal/LegalArticle'
import { COMPANY_NAME, CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Sikkerhet',
  description: `Slik tenker vi sikkerhet og tilgang i Smart Budsjett fra ${COMPANY_NAME}.`,
}

export default function SikkerhetPage() {
  return (
    <LegalArticle
      title="Sikkerhet i Smart Budsjett"
      description={`Sist oppdatert: 14. april 2026 · Smart Budsjett er levert av ${COMPANY_NAME}.`}
    >
      <LegalSection title="Innledning">
        <LegalP>
          Denne siden forklarer på et overordnet nivå hvordan vi bygger og drifter Smart Budsjett med tanke på sikkerhet og
          kontroll over egne data. Den erstatter ikke den juridiske personvernerklæringen eller vilkårene for bruk.
        </LegalP>
        <LegalP>
          For hvordan vi behandler personopplysninger, se{' '}
          <Link href="/personvern" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            personvernerklæringen
          </Link>
          . For avtalevilkår, se{' '}
          <Link href="/vilkar" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            vilkårene
          </Link>
          . Juridisk formulering av sikkerhet ved behandling av personopplysninger finner du i personvernerklæringen under{' '}
          <Link href="/personvern#sikkerhet" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            avsnittet om sikkerhet
          </Link>
          .
        </LegalP>
        <LegalP>
          Innstillinger for passord og egen konto etter innlogging ligger under <strong style={{ color: 'var(--text)' }}>Min konto</strong>{' '}
          → <strong style={{ color: 'var(--text)' }}>Sikkerhet</strong> — det er ikke det samme som denne offentlige oversiktssiden.
        </LegalP>
      </LegalSection>

      <LegalSection title="Innlogging og tilgang til appen">
        <LegalP>
          Innlogging og kontoautentisering håndteres av vår leverandør for identitet og database (Supabase). Trafikk mellom
          nettleseren din og tjenesten skjer over kryptert tilkobling (HTTPS). Nettapplikasjonen kjører på en moderne
          vertsplattform (som beskrevet i personvernerklæringen, typisk Vercel eller tilsvarende).
        </LegalP>
        <LegalP>
          Beskyttede deler av Smart Budsjett krever gyldig innlogging. Offentlige sider (for eksempel forsiden, guider og disse
          juridiske sidene) er tilgjengelige uten konto. Uten gyldig økt vil du bli bedt om å logge inn for å bruke appdelen.
        </LegalP>
      </LegalSection>

      <LegalSection title="Data i databasen og tilgangskontroll">
        <LegalP>
          Økonomidata og app-innhold du lagrer, ligger i en database hos vår leverandør. Tilgang er begrenset slik at du som
          regel bare kan lese og endre data som hører til din egen konto — dette er teknisk håndhevet i databasen (radbasert
          tilgangskontroll), ikke bare i brukergrensesnittet.
        </LegalP>
        <LegalP>
          Noen oppgaver som krever ekstra tillatelse — for eksempel synkronisering av betalingsstatus eller teknisk drift —
          kjøres på server med kontrollerte nøkler, slik at hemmeligheter ikke eksponeres i nettleseren din.
        </LegalP>
      </LegalSection>

      <LegalSection title="Abonnement og økonomidata">
        <LegalP>
          Smart Budsjett tilbys som abonnementstjeneste. For å beskytte både tjenesten og integriteten til lagrede
          økonomidata, kan lagring av slik data i appen kreve gyldig abonnement eller annen forhåndsdefinert tilgang. Uten slik
          tilgang vil du typisk kunne se innhold i nettleseren, men ikke få varig lagring av nye endringer — i tråd med hvordan
          produktet er bygget.
        </LegalP>
      </LegalSection>

      <LegalSection title="Betaling">
        <LegalP>
          Betaling og abonnement håndteres av Stripe. Kortinformasjon behandles i stor grad direkte av betalingsleverandøren; vi
          lagrer ikke fullt kortnummer på våre servere. Du kan administrere abonnement og betalingsmåte gjennom Stripe sine
          selvbetjeningsflater der dette er aktivert fra kontoen din.
        </LegalP>
      </LegalSection>

      <LegalSection title="EnkelExcel AI">
        <LegalP>
          Når du bruker EnkelExcel AI, sendes forespørselen fra appen til en server hos oss. API-nøkler til underliggende
          språkmodell ligger på server og eksponeres ikke i nettleseren. Innhold i spørsmålene dine og nødvendig kontekst kan
          sendes videre til vår AI-leverandør (OpenAI eller tilsvarende) for å generere svar — se personvernerklæringen for
          detaljer om behandling, informasjonskapsler og lokal lagring av samtalehistorikk der det er relevant.
        </LegalP>
      </LegalSection>

      <LegalSection title="Eksterne leverandører">
        <LegalP>
          Vi bruker anerkjente leverandører for blant annet database og innlogging, betaling, hosting og AI. Navn og roller er
          beskrevet nærmere under «Databehandlere og overføring» i{' '}
          <Link href="/personvern" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            personvernerklæringen
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="Din del av sikkerheten">
        <LegalP>Du bidrar til god sikkerhet ved å:</LegalP>
        <LegalUl>
          <LegalLi>bruke et sterkt, unikt passord og ikke dele innloggingsinformasjon;</LegalLi>
          <LegalLi>holde nettleser og enhet oppdatert;</LegalLi>
          <LegalLi>logge ut på delte eller offentlige enheter når det er aktuelt.</LegalLi>
        </LegalUl>
        <LegalP>
          Du er også ansvarlig for aktivitet på kontoen din i tråd med vilkårene, med mindre annet følger av gjeldende rett.
        </LegalP>
      </LegalSection>

      <LegalSection title="Kontakt og relaterte sider">
        <LegalP>
          Spørsmål om sikkerhet eller personvern:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>
        </LegalP>
        <LegalP className="pt-2">
          Se også{' '}
          <Link href="/personvern" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            personvernerklæringen
          </Link>
          ,{' '}
          <Link href="/personvern#sikkerhet" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            det juridiske avsnittet om sikkerhet
          </Link>
          , og{' '}
          <Link href="/vilkar" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            vilkår for bruk
          </Link>
          .
        </LegalP>
      </LegalSection>
    </LegalArticle>
  )
}
