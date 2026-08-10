import { isISODate } from './dates'
import type { DayProgress, DayRecord, Settings, Store, TimerState } from './types'

const KEY = 'wotd:store:v1'
const BACKUP_KEY = 'wotd:store:v1:backup'
const QUARANTINE_PREFIX = 'wotd:corrupt:'

export const DEFAULT_SETTINGS: Settings = {
  sound: false,
  previewDate: null,
}

export function emptyStore(): Store {
  return { version: 1, records: {}, progress: {}, settings: { ...DEFAULT_SETTINGS }, updatedAt: Date.now() }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function coerceTimer(raw: unknown): TimerState {
  const o = isObject(raw) ? raw : {}
  return {
    accumulatedMs: Math.max(0, num(o.accumulatedMs, 0)),
    runningSince: typeof o.runningSince === 'number' ? o.runningSince : null,
    lastTickAt: num(o.lastTickAt, 0),
    manuallyPaused: o.manuallyPaused === true,
  }
}

/**
 * Reconciles a timer that was left running when the app was closed or killed.
 * Only time up to the last heartbeat counts, so a phone left closed overnight
 * banks seconds rather than hours. The clock comes back paused.
 */
export function reconcileTimer(timer: TimerState): TimerState {
  if (timer.runningSince === null) return timer
  const until = Math.max(timer.runningSince, timer.lastTickAt)
  return {
    accumulatedMs: timer.accumulatedMs + (until - timer.runningSince),
    runningSince: null,
    lastTickAt: until,
    manuallyPaused: timer.manuallyPaused,
  }
}

function coerceRecord(date: string, raw: unknown): DayRecord | null {
  if (!isObject(raw)) return null
  const status = raw.status === 'solved' ? 'solved' : raw.status === 'revealed' ? 'revealed' : null
  if (!status) return null
  return {
    date,
    status,
    cluesUsed: Math.min(3, Math.max(1, Math.round(num(raw.cluesUsed, 1)))),
    durationMs: Math.max(0, num(raw.durationMs, 0)),
    wrongGuesses: Math.max(0, Math.round(num(raw.wrongGuesses, 0))),
    completedAt: num(raw.completedAt, 0),
  }
}

function coerceProgress(date: string, raw: unknown): DayProgress | null {
  if (!isObject(raw)) return null
  return {
    date,
    cluesRevealed: Math.min(3, Math.max(1, Math.round(num(raw.cluesRevealed, 1)))),
    wrongGuesses: Math.max(0, Math.round(num(raw.wrongGuesses, 0))),
    timer: reconcileTimer(coerceTimer(raw.timer)),
    startedAt: num(raw.startedAt, Date.now()),
  }
}

function coerceSettings(raw: unknown): Settings {
  const o = isObject(raw) ? raw : {}
  return {
    sound: o.sound === true,
    previewDate: isISODate(o.previewDate) ? o.previewDate : null,
  }
}

/**
 * Rebuilds a Store from unknown JSON, keeping every entry that can be salvaged
 * and dropping only the ones that can't. A single malformed day must never
 * cost her the rest of her history.
 */
export function parseStore(raw: unknown): Store {
  const o = isObject(raw) ? raw : {}
  const store = emptyStore()

  if (isObject(o.records)) {
    for (const [date, value] of Object.entries(o.records)) {
      if (!isISODate(date)) continue
      const record = coerceRecord(date, value)
      if (record) store.records[date] = record
    }
  }
  if (isObject(o.progress)) {
    for (const [date, value] of Object.entries(o.progress)) {
      if (!isISODate(date)) continue
      const progress = coerceProgress(date, value)
      // A day that already finished has no business keeping in-flight state.
      if (progress && !store.records[date]) store.progress[date] = progress
    }
  }
  store.settings = coerceSettings(o.settings)
  store.updatedAt = num(o.updatedAt, Date.now())
  return store
}

function readKey(storage: Storage, key: string): Store | null {
  const raw = storage.getItem(key)
  if (!raw) return null
  try {
    return parseStore(JSON.parse(raw))
  } catch {
    return null
  }
}

/**
 * Loads the store, falling back to the previous good snapshot if the main key
 * is unreadable. Anything unparseable is quarantined under its own key rather
 * than discarded, so a bad write is recoverable by hand instead of fatal.
 */
export function loadStore(storage: Storage = localStorage): Store {
  try {
    const primary = readKey(storage, KEY)
    if (primary) return primary

    const raw = storage.getItem(KEY)
    if (raw) {
      try {
        storage.setItem(`${QUARANTINE_PREFIX}${Date.now()}`, raw)
      } catch {
        // Quarantine is best effort; never let it block startup.
      }
    }

    const backup = readKey(storage, BACKUP_KEY)
    if (backup) return backup
  } catch {
    // Private-mode Safari and disabled storage both land here.
  }
  return emptyStore()
}

/**
 * Writes the store, keeping the last known-good value in a backup key. The
 * payload is serialized before anything is touched, so a value that can't be
 * stringified can't clobber what's already saved.
 */
export function saveStore(store: Store, storage: Storage = localStorage): boolean {
  let payload: string
  try {
    payload = JSON.stringify({ ...store, updatedAt: Date.now() })
  } catch {
    return false
  }
  try {
    const previous = storage.getItem(KEY)
    if (previous) storage.setItem(BACKUP_KEY, previous)
    storage.setItem(KEY, payload)
    return true
  } catch {
    return false
  }
}

export function exportStore(store: Store): string {
  return JSON.stringify({ app: 'word-of-the-day', exportedAt: new Date().toISOString(), ...store }, null, 2)
}

/**
 * Merges an exported file into the current store. Imports never delete: on a
 * date collision the finished day wins, and if both are finished the earlier
 * completion is kept, so re-importing an old backup can't erase newer results.
 */
export function mergeStores(current: Store, incoming: Store): Store {
  const records = { ...current.records }
  for (const [date, record] of Object.entries(incoming.records)) {
    const existing = records[date]
    if (!existing || record.completedAt < existing.completedAt) records[date] = record
  }
  const progress = { ...current.progress }
  for (const [date, entry] of Object.entries(incoming.progress)) {
    if (!records[date] && !progress[date]) progress[date] = entry
  }
  for (const date of Object.keys(records)) delete progress[date]

  return {
    version: 1,
    records,
    progress,
    settings: current.settings,
    updatedAt: Date.now(),
  }
}
