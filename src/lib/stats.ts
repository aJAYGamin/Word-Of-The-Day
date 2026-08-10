import { SEASON_START, seasonDays } from './dates'
import type { DayRecord } from './types'

export interface Stats {
  played: number
  solved: number
  revealed: number
  missed: number
  solveRate: number
  currentStreak: number
  longestStreak: number
  averageDurationMs: number | null
  bestDurationMs: number | null
  averageCluesUsed: number | null
  /** Solves bucketed by clue tier: index 0 is a one-clue solve. */
  clueBreakdown: [number, number, number]
}

type Records = Record<string, DayRecord>

/**
 * A solved day extends the streak. A revealed day breaks it. A season day that
 * passed unplayed also breaks it — but only once it's in the past, so an
 * unplayed today is still a streak in waiting rather than a loss.
 */
export function computeStreaks(records: Records, today: string): { current: number; longest: number } {
  let current = 0
  let longest = 0
  for (const date of seasonDays()) {
    if (date > today) break
    const record = records[date]
    if (record?.status === 'solved') {
      current += 1
      longest = Math.max(longest, current)
    } else if (record?.status === 'revealed') {
      current = 0
    } else if (date < today) {
      current = 0
    }
  }
  return { current, longest }
}

export function computeStats(records: Records, today: string): Stats {
  const finished = Object.values(records).filter((r) => r.date <= today)
  const solved = finished.filter((r) => r.status === 'solved')
  const revealed = finished.filter((r) => r.status === 'revealed')

  const elapsedSeasonDays = seasonDays().filter((d) => d <= today && d >= SEASON_START).length
  const missed = Math.max(0, elapsedSeasonDays - finished.length)

  const durations = finished.map((r) => r.durationMs).filter((ms) => ms > 0)
  const solvedDurations = solved.map((r) => r.durationMs).filter((ms) => ms > 0)

  const clueBreakdown: [number, number, number] = [0, 0, 0]
  for (const record of solved) clueBreakdown[Math.min(3, Math.max(1, record.cluesUsed)) - 1] += 1

  const { current, longest } = computeStreaks(records, today)

  return {
    played: finished.length,
    solved: solved.length,
    revealed: revealed.length,
    missed,
    solveRate: finished.length ? solved.length / finished.length : 0,
    currentStreak: current,
    longestStreak: longest,
    clueBreakdown,
    averageDurationMs: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null,
    bestDurationMs: solvedDurations.length ? Math.min(...solvedDurations) : null,
    averageCluesUsed: solved.length
      ? solved.reduce((a, r) => a + r.cluesUsed, 0) / solved.length
      : null,
  }
}
