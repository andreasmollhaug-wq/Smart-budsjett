import { describe, expect, it } from 'vitest'
import { uniqueDescriptionsForDatalist } from './transactionDescriptionSuggestions'

describe('uniqueDescriptionsForDatalist', () => {
  it('returnerer tom liste uten input', () => {
    expect(uniqueDescriptionsForDatalist([])).toEqual([])
  })

  it('trimmer og hopper over tomme beskrivelser', () => {
    expect(
      uniqueDescriptionsForDatalist([
        { description: '  A  ' },
        { description: '' },
        { description: '   ' },
        { description: null },
      ]),
    ).toEqual(['A'])
  })

  it('slår sammen duplikater case-insensitivt og beholder første skrevne variant', () => {
    const o = uniqueDescriptionsForDatalist([
      { description: 'Husleie' },
      { description: 'husleie' },
      { description: 'HUSLEIE' },
    ])
    expect(o).toEqual(['Husleie'])
  })

  it('sorterer etter frekvens (høyest først)', () => {
    const o = uniqueDescriptionsForDatalist([
      { description: 'Sjelden' },
      { description: 'Ofte' },
      { description: 'Ofte' },
      { description: 'Ofte' },
    ])
    expect(o[0]).toBe('Ofte')
    expect(o[1]).toBe('Sjelden')
  })

  it('respekterer max', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ description: `x${i}` }))
    expect(uniqueDescriptionsForDatalist(rows, { max: 3 })).toHaveLength(3)
  })
})
