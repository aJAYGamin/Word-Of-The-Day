import { formatDuration, formatShort } from './dates'
import type { DayRecord } from './types'

/**
 * A compact result summary: the day, how it went, and how long it took.
 * There's no leaderboard here — this exists so she can send you the result.
 */
export function buildShareText(record: DayRecord, note?: string): string {
  const clueDots =
    record.status === 'solved'
      ? Array.from({ length: 3 }, (_, i) => (i < record.cluesUsed ? '🟡' : '⬜')).join('')
      : '🟥🟥🟥'

  const headline =
    record.status === 'solved'
      ? `Solved on ${record.cluesUsed} clue${record.cluesUsed === 1 ? '' : 's'}`
      : 'Revealed'

  const lines = [
    `Word of the Day — ${formatShort(record.date)}`,
    `${clueDots}  ${headline}`,
    `⏱ ${formatDuration(record.durationMs)}`,
  ]
  if (note) lines.push('', note)
  return lines.join('\n')
}

/** Uses the native share sheet where it exists, clipboard everywhere else. */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (error) {
      // A cancelled share sheet is not a failure worth reporting.
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
