import { describe, expect, it } from 'vitest'
import { sanitizeAiReplyMarkdown } from './aiReplyDisplay'

describe('sanitizeAiReplyMarkdown', () => {
  it('erstatter Betalinger (/konto/betalinger) med markdown-lenke', () => {
    const input = 'Gå til Betalinger (/konto/betalinger) og trykk Administrer abonnement.'
    expect(sanitizeAiReplyMarkdown(input)).toBe(
      'Gå til [Betalinger](/konto/betalinger) og trykk Administrer abonnement.',
    )
  })

  it('erstatter backtick-sti', () => {
    expect(sanitizeAiReplyMarkdown('Se `/gjeld` for oversikt.')).toBe('Se [Gjeld](/gjeld) for oversikt.')
  })

  it('erstatter frittstående sti', () => {
    expect(sanitizeAiReplyMarkdown('Gå til /konto/betalinger for å administrere.')).toBe(
      'Gå til [Betalinger](/konto/betalinger) for å administrere.',
    )
  })

  it('lar eksisterende markdown-lenke være', () => {
    const input = 'Trykk [Betalinger](/konto/betalinger) nå.'
    expect(sanitizeAiReplyMarkdown(input)).toBe(input)
  })

  it('erstatter offentlig rute med menneskelig navn uten lenke', () => {
    expect(sanitizeAiReplyMarkdown('Bruk /glemt-passord på innloggingssiden.')).toBe(
      'Bruk Glemt passord på innloggingssiden.',
    )
  })

  it('rører ikke e-postadresser', () => {
    const input = 'Kontakt post@enkelexcel.no for hjelp.'
    expect(sanitizeAiReplyMarkdown(input)).toBe(input)
  })

  it('håndterer Min konto-sti', () => {
    expect(sanitizeAiReplyMarkdown('Åpne /konto/sikkerhet for passord.')).toBe(
      'Åpne [Sikkerhet](/konto/sikkerhet) for passord.',
    )
  })

  it('prioriterer lengre sti (/konto/betalinger over /konto)', () => {
    expect(sanitizeAiReplyMarkdown('Side: /konto/betalinger')).toBe('Side: [Betalinger](/konto/betalinger)')
  })

  it('returnerer tom tekst uendret', () => {
    expect(sanitizeAiReplyMarkdown('   ')).toBe('   ')
  })

  it('beholder ukjent sti som tekst', () => {
    const input = 'Gå til /ukjent/side for noe.'
    expect(sanitizeAiReplyMarkdown(input)).toBe(input)
  })
})
