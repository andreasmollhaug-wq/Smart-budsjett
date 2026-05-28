export const DOTTIR_AI_ASSISTANT_NAME = 'dottir AI'

/** Generiske forslag (full side + fallback i modal). Korte nok til vertikal liste. */
export const SUGGESTED_QUESTIONS_REST = [
  'Legg inn 1500 kr under Strøm hver måned i budsjettet',
  'Oppsummer de viktigste tallene mine — hva bør jeg merke meg?',
  'Hva koster abonnementene mine per måned til sammen?',
  'Hvordan deler jeg en felles utgift mellom to profiler?',
  'Gi meg tre konkrete grep ut fra tallene, med neste steg i appen',
  'Hvor avviker jeg mest fra budsjettet akkurat nå?',
  'Hvordan bør jeg prioritere nedbetaling av gjeld?',
] as const

export function suggestedQuestionCurrentMonthSummary(): string {
  const now = new Date()
  const period = now.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
  return `Oppsummer utgiftene mine i ${period}.`
}

export function buildAllSuggestedQuestions(): string[] {
  return [suggestedQuestionCurrentMonthSummary(), ...SUGGESTED_QUESTIONS_REST]
}

export function dottirAiWelcomeMessage(assistantName = DOTTIR_AI_ASSISTANT_NAME): string {
  return `Hei! Jeg er ${assistantName}. Jeg svarer ut fra tallene for valgt profil eller husholdning — kort sammendrag først, deretter detaljer og konkrete neste steg i appen. Du kan også be meg **foreslå** innlegging i budsjett eller transaksjoner — da får du et kort å bekrefte før noe lagres. Automatisert hjelp, ikke personlig rådgivning.`
}
