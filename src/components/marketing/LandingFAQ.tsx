const faqs: { q: string; a: string }[] = [
  {
    q: 'Hvorfor må jeg registrere betalingskort ved oppstart?',
    a: 'Det gjør det enkelt å fortsette etter prøveperioden uten avbrudd, og du slipper å huske å legge inn kort på nytt. Du kan si opp før prøveperioden er over — vi trekker ikke før etter de 14 dagene er ferdige.',
  },
  {
    q: 'Hva skjer når de 14 dagene er over?',
    a: 'Da starter det aktive abonnementet du valgte (Solo eller Familie), og månedlig pris faktureres. Du får påminnelse i forkant slik at du vet hva som kommer.',
  },
  {
    q: 'Hva menes med «familie» og husholdning?',
    a: 'Familie-planen er for to eller flere personer som deler samme husholdning (typisk partner, barn eller andre du bor sammen med). Du kan invitere opptil fem brukere i samme abonnement.',
  },
  {
    q: 'Kan jeg bytte mellom Solo og Familie?',
    a: 'Ja. Du kan oppgradere eller nedgradere når som helst — endringen slår inn fra neste faktureringsperiode med mindre annet er oppgitt i kontoen din.',
  },
  {
    q: 'Hvordan sier jeg opp?',
    a: 'Du administrerer abonnementet fra kontoinnstillingene i Smart Budsjett. Ingen binding utover det du allerede har betalt for inneværende periode.',
  },
  {
    q: 'Hva skjer med dataene mine?',
    a: 'Dataene dine brukes til å vise budsjett og oversikt i Smart Budsjett. Vi selger ikke personopplysninger til tredjeparter. Mer finner du i personvernerklæringen.',
  },
]

export default function LandingFAQ() {
  return (
    <section id="faq" className="scroll-mt-24 px-4 py-14 sm:px-6" style={{ background: 'color-mix(in srgb, var(--primary-pale) 35%, var(--bg))' }}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Ofte stilte spørsmål
        </h2>
        <p className="mx-auto mt-3 text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Kort svar på det mange lurer på før de starter.
        </p>
        <div className="mt-10 space-y-3">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl p-5 open:shadow-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <summary className="cursor-pointer list-none font-semibold outline-none [&::-webkit-details-marker]:hidden" style={{ color: 'var(--text)' }}>
                <span className="flex items-center justify-between gap-2">
                  {q}
                  <span className="text-lg font-normal transition-transform group-open:rotate-180" style={{ color: 'var(--text-muted)' }}>
                    ▾
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
