/**
 * All dates in this app are "YYYY-MM-DD" strings in the player's local
 * timezone. Nothing is stored as a UTC instant, because "which puzzle is
 * today" should follow the wall clock in front of her, not UTC.
 */

export const SEASON_START = '2026-09-01'
export const SEASON_END = '2026-12-31'

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const probe = new Date(y, m - 1, d)
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses to local midnight, avoiding the UTC shift `new Date("2026-09-01")` causes. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from `a` to `b`; negative when `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function isInSeason(iso: string): boolean {
  return iso >= SEASON_START && iso <= SEASON_END
}

/** Every date in the season, in order. 122 days for Sep 1 - Dec 31. */
export function seasonDays(): string[] {
  const out: string[] = []
  for (let d = SEASON_START; d <= SEASON_END; d = addDays(d, 1)) out.push(d)
  return out
}

/** Season days up to and including `today`, i.e. everything unlocked so far. */
export function unlockedDays(today: string): string[] {
  return seasonDays().filter((d) => d <= today)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatLong(iso: string): string {
  const d = fromISODate(iso)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatShort(iso: string): string {
  const d = fromISODate(iso)
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

export function monthLabel(iso: string): string {
  const d = fromISODate(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Formats a duration as m:ss, or h:mm:ss once it passes an hour. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
