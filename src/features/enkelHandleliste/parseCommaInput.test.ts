import { describe, expect, it } from 'vitest'
import {
  capitalizeWords,
  findDuplicateNames,
  formatItemName,
  splitShoppingInput,
} from './parseCommaInput'

describe('splitShoppingInput', () => {
  it('splits on comma and dedupes case-insensitively', () => {
    expect(splitShoppingInput('brød, melk, brød')).toEqual(['brød', 'melk'])
  })

  it('splits on newline', () => {
    expect(splitShoppingInput('a\nb;c')).toEqual(['a', 'b', 'c'])
  })
})

describe('formatItemName', () => {
  it('capitalizes when enabled', () => {
    expect(formatItemName('melk og brød', true)).toBe('Melk Og Brød')
  })
})

describe('findDuplicateNames', () => {
  it('finds existing names', () => {
    expect(findDuplicateNames(['Melk'], ['melk'])).toEqual(['Melk'])
  })
})

describe('capitalizeWords', () => {
  it('handles single word', () => {
    expect(capitalizeWords('ost')).toBe('Ost')
  })
})
