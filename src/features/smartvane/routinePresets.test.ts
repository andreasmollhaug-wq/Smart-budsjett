import { describe, expect, it } from 'vitest'
import {
  ROUTINE_PRESET_BATCH_MAX,
  getRoutinePresetById,
  normalizeNoSearch,
  searchPresets,
} from './routinePresets'

describe('normalizeNoSearch', () => {
  it('fjerner aksent-tegn konsistent med søkehøstack', () => {
    expect(normalizeNoSearch('Bad É')).toContain('bad')
  })
})

describe('searchPresets', () => {
  it('finner rutiner på navn eller tag trening/hjem', () => {
    expect(searchPresets('vaske').some((x) => x.name.includes('Vaske badet'))).toBe(true)
    expect(searchPresets('budjett', 'okonomi_hus').length).toBeGreaterThan(0)
  })

  it('returner tom ved ingen treff tokens', () => {
    expect(searchPresets('ikke-finnes-zzz-zzz', null)).toEqual([])
  })
})

describe('getRoutinePresetById', () => {
  it('inneholder kjente id-er', () => {
    expect(getRoutinePresetById('preset_gaatur')).toBeTruthy()
    expect(getRoutinePresetById('preset_nope')).toBeUndefined()
  })
})

describe('ROUTINE_PRESET_BATCH_MAX', () => {
  it('matcher server-grensen', () => {
    expect(ROUTINE_PRESET_BATCH_MAX).toBe(10)
  })
})
