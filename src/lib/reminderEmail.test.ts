import { describe, expect, it } from 'vitest'
import { composeReminder, dayNumber, totalDays } from './reminderEmail'

describe('dayNumber', () => {
  it('numbers the season from one', () => {
    expect(dayNumber('2026-09-01')).toBe(1)
    expect(dayNumber('2026-12-31')).toBe(122)
    expect(totalDays()).toBe(122)
  })

  it('returns null outside the season', () => {
    expect(dayNumber('2026-08-31')).toBeNull()
    expect(dayNumber('2027-01-01')).toBeNull()
  })
})

describe('composeReminder', () => {
  const base = { date: '2026-09-12', appUrl: 'https://example.com/word/' }

  it('leads with the day and includes the clue and link', () => {
    const email = composeReminder({ ...base, clue: 'It needs a wall to exist.' })

    expect(email.subject).toBe('Word of the Day · Day 12')
    expect(email.text).toContain('Saturday, September 12')
    expect(email.text).toContain('Day 12 of 122')
    expect(email.text).toContain('It needs a wall to exist.')
    expect(email.text).toContain(base.appUrl)
    expect(email.html).toContain(base.appUrl)
    expect(email.html).toContain('It needs a wall to exist.')
  })

  it('still sends something useful when the clue is missing', () => {
    const email = composeReminder(base)
    expect(email.text).toContain("Today's word is waiting for you.")
    expect(email.text).toContain(base.appUrl)
    expect(email.html).not.toContain('Clue 1')
  })

  it('never leaks the answer', () => {
    const email = composeReminder({ ...base, clue: 'Orange and pink sky' })
    expect(email.text.toLowerCase()).not.toContain('sunset')
    expect(email.html.toLowerCase()).not.toContain('sunset')
  })

  it('escapes clue text so an apostrophe or bracket cannot break the markup', () => {
    const email = composeReminder({ ...base, clue: `A <script> & "quotes"` })
    expect(email.html).toContain('&lt;script&gt; &amp; &quot;quotes&quot;')
    expect(email.html).not.toContain('<script>')
  })
})
