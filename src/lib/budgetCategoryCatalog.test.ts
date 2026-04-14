import { describe, expect, it } from 'vitest'
import { emptyLabelLists, getAvailableLabels } from './budgetCategoryCatalog'

describe('getAvailableLabels', () => {
  const lists = emptyLabelLists()

  it('filtrerer bort eksisterende linjenavn som standard', () => {
    const r = getAvailableLabels('regninger', lists, ['Strøm'])
    expect(r).not.toContain('Strøm')
  })

  it('inkluderer navn som allerede er linje når omitExistingLines er false', () => {
    const r = getAvailableLabels('regninger', lists, ['Strøm'], { omitExistingLines: false })
    expect(r).toContain('Strøm')
  })
})
