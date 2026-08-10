import { describe, expect, it } from 'vitest'
import { getEntry, validateEntry, validateWordData, WORDS } from '../data/words'
import { addDays, daysBetween, formatDuration, isISODate, seasonDays } from './dates'
import { isCorrectGuess } from './normalize'

describe('guess matching', () => {
  it('forgives case, spacing, punctuation and accents', () => {
    expect(isCorrectGuess('sunset', 'SUNSET')).toBe(true)
    expect(isCorrectGuess('  Sunset  ', 'SUNSET')).toBe(true)
    expect(isCorrectGuess('sun set', 'SUNSET')).toBe(true)
    expect(isCorrectGuess("sun-set!", 'SUNSET')).toBe(true)
    expect(isCorrectGuess('résumé', 'RESUME')).toBe(true)
  })

  it('rejects wrong or empty guesses', () => {
    expect(isCorrectGuess('sunrise', 'SUNSET')).toBe(false)
    expect(isCorrectGuess('', 'SUNSET')).toBe(false)
    expect(isCorrectGuess('   ', 'SUNSET')).toBe(false)
    expect(isCorrectGuess('!!!', 'SUNSET')).toBe(false)
  })
})

describe('season dates', () => {
  it('covers 122 days from September 1 to December 31', () => {
    const days = seasonDays()
    expect(days).toHaveLength(122)
    expect(days[0]).toBe('2026-09-01')
    expect(days[days.length - 1]).toBe('2026-12-31')
  })

  it('steps across month boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(daysBetween('2026-09-01', '2026-12-31')).toBe(121)
  })

  it('validates ISO dates strictly', () => {
    expect(isISODate('2026-09-01')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-13-01')).toBe(false)
    expect(isISODate('9/1/2026')).toBe(false)
    expect(isISODate(null)).toBe(false)
  })

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65_000)).toBe('1:05')
    expect(formatDuration(3_725_000)).toBe('1:02:05')
  })
})

describe('word data', () => {
  it('ships valid placeholder entries', () => {
    expect(validateWordData()).toEqual([])
    expect(Object.keys(WORDS).length).toBeGreaterThanOrEqual(5)
  })

  it('rejects malformed entries', () => {
    expect(validateEntry({ word: 'X', clues: ['a', 'b'] })).toMatch(/2 clues/)
    expect(validateEntry({ word: '', clues: ['a', 'b', 'c'] })).toMatch(/missing a word/)
    expect(validateEntry({ word: 'X', clues: ['a', '  ', 'c'] })).toMatch(/empty clue/)
    expect(validateEntry(null)).toMatch(/not an object/)
  })

  it('reports a missing day instead of crashing', () => {
    const result = getEntry('2026-12-25')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing')
  })
})
