import { describe, expect, it } from 'vitest'
import { computeStats, computeStreaks } from './stats'
import type { DayRecord } from './types'

function record(date: string, status: DayRecord['status'], overrides: Partial<DayRecord> = {}): DayRecord {
  return { date, status, cluesUsed: 1, durationMs: 60_000, wrongGuesses: 0, completedAt: 1, ...overrides }
}

function records(...entries: DayRecord[]): Record<string, DayRecord> {
  return Object.fromEntries(entries.map((entry) => [entry.date, entry]))
}

describe('computeStreaks', () => {
  it('counts consecutive solved days', () => {
    const result = computeStreaks(
      records(record('2026-09-01', 'solved'), record('2026-09-02', 'solved'), record('2026-09-03', 'solved')),
      '2026-09-03',
    )
    expect(result).toEqual({ current: 3, longest: 3 })
  })

  it('breaks the streak on a revealed day but keeps the longest', () => {
    const result = computeStreaks(
      records(
        record('2026-09-01', 'solved'),
        record('2026-09-02', 'solved'),
        record('2026-09-03', 'revealed'),
        record('2026-09-04', 'solved'),
      ),
      '2026-09-04',
    )
    expect(result).toEqual({ current: 1, longest: 2 })
  })

  it('breaks the streak on a day that passed unplayed', () => {
    const result = computeStreaks(
      records(record('2026-09-01', 'solved'), record('2026-09-03', 'solved')),
      '2026-09-03',
    )
    expect(result).toEqual({ current: 1, longest: 1 })
  })

  it('does not break the streak for an unplayed today', () => {
    const result = computeStreaks(
      records(record('2026-09-01', 'solved'), record('2026-09-02', 'solved')),
      '2026-09-03',
    )
    expect(result).toEqual({ current: 2, longest: 2 })
  })

  it('ignores days beyond today', () => {
    const result = computeStreaks(records(record('2026-09-05', 'solved')), '2026-09-02')
    expect(result).toEqual({ current: 0, longest: 0 })
  })
})

describe('computeStats', () => {
  it('summarises play across the season so far', () => {
    const stats = computeStats(
      records(
        record('2026-09-01', 'solved', { durationMs: 30_000, cluesUsed: 1 }),
        record('2026-09-02', 'solved', { durationMs: 90_000, cluesUsed: 3 }),
        record('2026-09-03', 'revealed', { durationMs: 120_000, cluesUsed: 3 }),
      ),
      '2026-09-04',
    )

    expect(stats.played).toBe(3)
    expect(stats.solved).toBe(2)
    expect(stats.revealed).toBe(1)
    // Sep 4 is today and unplayed, so it is not counted as missed yet.
    expect(stats.missed).toBe(1)
    expect(stats.bestDurationMs).toBe(30_000)
    expect(stats.averageDurationMs).toBe(80_000)
    expect(stats.averageCluesUsed).toBe(2)
    expect(stats.clueBreakdown).toEqual([1, 0, 1])
  })

  it('reports empty stats without dividing by zero', () => {
    const stats = computeStats({}, '2026-09-01')
    expect(stats.solveRate).toBe(0)
    expect(stats.averageDurationMs).toBeNull()
    expect(stats.bestDurationMs).toBeNull()
    expect(stats.averageCluesUsed).toBeNull()
  })
})
