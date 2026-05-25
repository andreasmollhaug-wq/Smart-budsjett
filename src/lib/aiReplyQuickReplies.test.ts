import { describe, expect, it } from 'vitest'
import { parseAiReplyQuickReplies, resolveAiReplyQuickReplies } from '@/lib/aiReplyQuickReplies'

describe('parseAiReplyQuickReplies', () => {
  it('stripper Hurtigsvar-linje på slutten', () => {
    const input =
      'Jeg kan hjelpe deg videre.\n\nHurtigsvar: Ja takk | Vis meg hvor | Nei takk'
    expect(parseAiReplyQuickReplies(input)).toEqual({
      body: 'Jeg kan hjelpe deg videre.',
      quickReplies: ['Ja takk', 'Vis meg hvor', 'Nei takk'],
    })
  })

  it('returnerer uendret tekst uten Hurtigsvar', () => {
    const input = 'Hvis du vil kan jeg hjelpe deg — men da trenger jeg tallene først.'
    expect(parseAiReplyQuickReplies(input)).toEqual({
      body: input,
      quickReplies: [],
    })
  })
})

describe('resolveAiReplyQuickReplies', () => {
  it('gjetter ikke knapper uten Hurtigsvar-linje', () => {
    expect(
      resolveAiReplyQuickReplies('Hvis du vil kan jeg hjelpe — legg inn tallene først.'),
    ).toEqual({
      body: 'Hvis du vil kan jeg hjelpe — legg inn tallene først.',
      quickReplies: [],
    })
  })
})
