/** A single day's puzzle, as it appears in the word data file. */
export interface DayEntry {
  /** The answer. Case is irrelevant for matching; stored uppercase by convention. */
  word: string
  /** Exactly three clues, revealed one at a time. */
  clues: string[]
  /** Optional personal note shown on the result card once the day is over. */
  message?: string
}

export type WordData = Record<string, DayEntry>

export type DayStatus = 'solved' | 'revealed'

/** A finished day. Written once, then never mutated. */
export interface DayRecord {
  date: string
  status: DayStatus
  /** How many clues were on screen when the day ended (1-3). */
  cluesUsed: number
  /** Elapsed play time, excluding any paused stretches. */
  durationMs: number
  wrongGuesses: number
  completedAt: number
}

/**
 * Timer state is stored rather than derived so it survives the app closing.
 * `runningSince` is an epoch timestamp while the clock runs, null while paused.
 * `lastTickAt` is a heartbeat used to reconcile time if the app is killed
 * mid-puzzle — without it, a phone closed overnight would bank eight hours.
 */
export interface TimerState {
  accumulatedMs: number
  runningSince: number | null
  lastTickAt: number
  /** True only when she pressed pause, so returning to the tab won't auto-resume. */
  manuallyPaused: boolean
}

/** An in-flight day. Cleared into a DayRecord when the day ends. */
export interface DayProgress {
  date: string
  /** Clues currently visible (1-3). */
  cluesRevealed: number
  wrongGuesses: number
  timer: TimerState
  startedAt: number
}

export interface Settings {
  sound: boolean
  /** Testing aid: pretend today is this date. Null in normal use. */
  previewDate: string | null
}

export interface Store {
  version: 1
  records: Record<string, DayRecord>
  progress: Record<string, DayProgress>
  settings: Settings
  updatedAt: number
}
