/** Enkel tilbakemelding i skjema (farge styres av variant, ikke tekstanalyse). */
export type FormFeedback = { variant: 'success' | 'error'; text: string } | null
