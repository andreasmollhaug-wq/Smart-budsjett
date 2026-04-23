import type { Metadata } from 'next'
import Link from 'next/link'
import LegalArticle, { LegalLi, LegalP, LegalSection, LegalUl } from '@/components/legal/LegalArticle'
import { COMPANY_NAME, COMPANY_ORG_NR_DISPLAY, CONTACT_EMAIL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Sikkerhet',
  description: `Slik tenker vi sikkerhet og tilgang i Smart Budsjett fra ${COMPANY_NAME}.`,
}

export default function SikkerhetPage() {
  return (
    <LegalArticle
      title="Sikkerhet i Smart Budsjett"
      description={`Sist oppdatert: 23. april 2026 · Smart Budsjett er levert av ${COMPANY_NAME} (org.nr. ${COMPANY_ORG_NR_DISPLAY}).`}
    >
      <LegalSection title="Innledning">
        <LegalP>
          Her beskriver vi — i korte trekk — hvordan Smart Budsjett er utformet for å beskytte dataene dine og gi deg forutsigbar
          tilgang til egen konto. Siden er ment som praktisk orientering for deg som bruker tjenesten; den erstatter ikke
          personvernerklæringen eller vilkårene.
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
          Innlogging og identitet håndteres av vår leverandør for autentisering og database (Supabase). All kommunikasjon mellom
          nettleseren din og tjenesten går over kryptert tilkobling (HTTPS). Selve applikasjonen kjører på en moderne
          vertsplattform (typisk Vercel eller tilsvarende, jf. personvernerklæringen).
        </LegalP>
        <LegalP>
          Appdelen av Smart Budsjett krever gyldig innlogging. Offentlige sider — forsiden, guider og disse juridiske sidene —
          kan leses uten konto. Uten aktiv, gyldig økt blir du bedt om å logge inn før du kan bruke funksjoner som lagrer
          personlig økonomidata.
        </LegalP>
      </LegalSection>

      <LegalSection title="Data i databasen og tilgangskontroll">
        <LegalP>
          Budsjett, transaksjoner og annet du lagrer, ligger i en database hos leverandøren vår. Når du er innlogget, følger hver
          forespørsel din autentiserte brukeridentitet inn i lagringslaget. Databasen har da egne sikkerhetsregler som avgjør
          hvilke rader og filer som kan leses eller endres for nettopp den identiteten — såkalt radbasert tilgangskontroll,
          slik plattformen er bygget for å støtte.
        </LegalP>
        <LegalP>
          Poenget er enkelt: tilgang styres der dataene faktisk ligger, og vurderes på nytt for relevante operasjoner — ikke bare
          ved å skjule eller vise elementer i brukergrensesnittet. Det gir et mer forutsigbart vern enn om beskyttelsen kun lå i
          appens skjermbilder.
        </LegalP>
        <LegalP>
          Oppgaver som av natur må gå utenfor en vanlig brukerøkt — for eksempel synkronisering av betalingsstatus med Stripe
          eller nødvendig drift — kjøres i kontrollerte servermiljøer med begrensede nøkler og etter prinsippet om minst mulig
          tilgang. Hemmeligheter som API-nøkler til underliggende tjenester eksponeres ikke i nettleseren din.
        </LegalP>
      </LegalSection>

      <LegalSection title="Abonnement og økonomidata">
        <LegalP>
          Smart Budsjett er en abonnementstjeneste. For å ivareta både tjenestens integritet og vernet av lagret økonomidata, kan
          varig lagring og synkronisering av slike data i appen forutsette gyldig abonnement eller annen tilgang vi uttrykkelig
          har åpnet for. Uten det vil du normalt kunne bruke grensesnittet i begrenset omfang, men ikke få varige endringer
          lagret — i tråd med hvordan produktet er satt opp.
        </LegalP>
      </LegalSection>

      <LegalSection title="Betaling">
        <LegalP>
          Betaling og abonnementsforhold håndteres av Stripe. Kort- og betalingsdata behandles i stor grad direkte hos
          betalingsleverandøren etter bransjestandard; vi lagrer ikke fullt kortnummer på egne servere. Hvor det er aktivert,
          kan du administrere abonnement og betalingsmåte via Stripes selvbetjeningsløsninger knyttet til kontoen din.
        </LegalP>
      </LegalSection>

      <LegalSection title="EnkelExcel AI">
        <LegalP>
          Når du bruker EnkelExcel AI, går forespørselen fra appen til vår server. Nøkler til underliggende språkmodell ligger på
          server og sendes ikke til nettleseren. Tekst du skriver, og den konteksten som er nødvendig for et svar, kan videreformidles
          til vår AI-leverandør (OpenAI eller tilsvarende) for å generere svaret — se personvernerklæringen for detaljer om
          behandling, informasjonskapsler og lokal lagring av samtalehistorikk der det er relevant.
        </LegalP>
      </LegalSection>

      <LegalSection title="Eksterne leverandører">
        <LegalP>
          Vi benytter etablerte leverandører for blant annet database og innlogging, betaling, hosting og AI. Hvem som gjør hva,
          og på hvilket grunnlag, fremgår under «Databehandlere og overføring» i{' '}
          <Link href="/personvern" className="font-medium underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            personvernerklæringen
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="Din del av sikkerheten">
        <LegalP>Sterk sikkerhet er et samspill. Du bidrar ved å:</LegalP>
        <LegalUl>
          <LegalLi>velge et sterkt, unikt passord og aldri dele innloggingsinformasjon;</LegalLi>
          <LegalLi>holde nettleser, operativsystem og apper oppdatert;</LegalLi>
          <LegalLi>logge ut på delte eller offentlige enheter når det er naturlig.</LegalLi>
        </LegalUl>
        <LegalP>
          Du er ansvarlig for aktivitet som skjer på kontoen din etter vilkårene, med mindre annet følger av ufravikelig rett.
        </LegalP>
      </LegalSection>

      <LegalSection title="Kontakt og relaterte sider">
        <LegalP>
          {COMPANY_NAME}, org.nr. {COMPANY_ORG_NR_DISPLAY}. Spørsmål om sikkerhet eller personvern:{' '}
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
