import { describe, expect, it } from 'vitest'
import {
  HJEMFLYT_PRESET_TASKS,
  hjemflytTaskTitleExists,
  normalizeHjemflytTaskTitleForDedupe,
} from './hjemflytPresetTasks'

describe('HJEMFLYT_PRESET_TASKS', () => {
  it('har ca. 50 forslag med unike nøkler og titler', () => {
    expect(HJEMFLYT_PRESET_TASKS.length).toBeGreaterThanOrEqual(48)
    expect(HJEMFLYT_PRESET_TASKS.length).toBeLessThanOrEqual(52)
    const keys = new Set(HJEMFLYT_PRESET_TASKS.map((t) => t.presetKey))
    expect(keys.size).toBe(HJEMFLYT_PRESET_TASKS.length)
    for (const t of HJEMFLYT_PRESET_TASKS) {
      expect(t.title.trim().length).toBeGreaterThan(0)
      expect(t.presetKey.length).toBeGreaterThan(0)
    }
  })
})

describe('hjemflytTaskTitleExists', () => {
  it('matcher trim og store/små bokstaver', () => {
    const existing = [{ title: '  Ta oppvasken ' }]
    expect(hjemflytTaskTitleExists('ta oppvasken', existing)).toBe(true)
    expect(hjemflytTaskTitleExists('Annen ting', existing)).toBe(false)
  })

  it('normalizeHjemflytTaskTitleForDedupe kollapser whitespace', () => {
    expect(normalizeHjemflytTaskTitleForDedupe('A  b')).toBe('a b')
  })
})
