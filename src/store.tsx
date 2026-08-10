import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getEntry } from './data/words'
import { isInSeason, todayISO } from './lib/dates'
import { isCorrectGuess } from './lib/normalize'
import { loadStore, mergeStores, parseStore, saveStore } from './lib/storage'
import { computeStats, type Stats } from './lib/stats'
import { elapsedMs, newTimer, pause, resume, tick } from './lib/timer'
import type { DayProgress, DayRecord, Settings, Store } from './lib/types'

export type DayState =
  | { kind: 'locked' }
  | { kind: 'offseason' }
  | { kind: 'error'; detail: string }
  | { kind: 'playable'; word: string; clues: string[]; message?: string; progress: DayProgress }
  | { kind: 'finished'; word: string; clues: string[]; message?: string; record: DayRecord }

interface AppValue {
  store: Store
  today: string
  stats: Stats
  storageHealthy: boolean
  dayState: (date: string) => DayState
  startDay: (date: string) => void
  revealNextClue: (date: string) => void
  submitGuess: (date: string, guess: string) => boolean
  revealWord: (date: string) => void
  setPaused: (date: string, paused: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
  importJSON: (text: string) => { ok: true; added: number } | { ok: false; error: string }
}

const AppContext = createContext<AppValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStore())
  const [storageHealthy, setStorageHealthy] = useState(true)
  const [today, setToday] = useState(() => todayISO())
  const firstRender = useRef(true)

  // The date can roll over while the app sits open on her home screen.
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayISO()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setStorageHealthy(saveStore(store))
  }, [store])

  const effectiveToday = store.settings.previewDate ?? today

  const dayState = useCallback(
    (date: string): DayState => {
      if (!isInSeason(date)) return { kind: 'offseason' }
      if (date > effectiveToday) return { kind: 'locked' }

      const result = getEntry(date)
      if (!result.ok) return { kind: 'error', detail: result.detail }
      const { word, clues, message } = result.entry

      const record = store.records[date]
      if (record) return { kind: 'finished', word, clues, message, record }

      const progress = store.progress[date] ?? {
        date,
        cluesRevealed: 1,
        wrongGuesses: 0,
        timer: { accumulatedMs: 0, runningSince: null, lastTickAt: 0, manuallyPaused: false },
        startedAt: 0,
      }
      return { kind: 'playable', word, clues, message, progress }
    },
    [effectiveToday, store.progress, store.records],
  )

  const mutateProgress = useCallback(
    (date: string, fn: (progress: DayProgress) => DayProgress) => {
      setStore((current) => {
        if (current.records[date]) return current
        const existing = current.progress[date]
        if (!existing) return current
        return { ...current, progress: { ...current.progress, [date]: fn(existing) } }
      })
    },
    [],
  )

  const startDay = useCallback((date: string) => {
    setStore((current) => {
      if (current.records[date]) return current
      const existing = current.progress[date]
      const now = Date.now()
      if (!existing) {
        return {
          ...current,
          progress: {
            ...current.progress,
            [date]: {
              date,
              cluesRevealed: 1,
              wrongGuesses: 0,
              timer: newTimer(now),
              startedAt: now,
            },
          },
        }
      }
      // Returning to a puzzle restarts the clock unless she paused on purpose.
      const timer = resume(existing.timer, now)
      if (timer === existing.timer) return current
      return { ...current, progress: { ...current.progress, [date]: { ...existing, timer } } }
    })
  }, [])

  const setPaused = useCallback(
    (date: string, shouldPause: boolean) => {
      mutateProgress(date, (progress) => ({
        ...progress,
        timer: shouldPause
          ? pause(progress.timer, Date.now(), true)
          : resume(progress.timer, Date.now(), true),
      }))
    },
    [mutateProgress],
  )

  const revealNextClue = useCallback(
    (date: string) => {
      mutateProgress(date, (progress) => ({
        ...progress,
        cluesRevealed: Math.min(3, progress.cluesRevealed + 1),
      }))
    },
    [mutateProgress],
  )

  const finish = useCallback((date: string, status: DayRecord['status']) => {
    setStore((current) => {
      if (current.records[date]) return current
      const progress = current.progress[date]
      if (!progress) return current
      const record: DayRecord = {
        date,
        status,
        cluesUsed: progress.cluesRevealed,
        durationMs: elapsedMs(progress.timer),
        wrongGuesses: progress.wrongGuesses,
        completedAt: Date.now(),
      }
      const remaining = { ...current.progress }
      delete remaining[date]
      return { ...current, records: { ...current.records, [date]: record }, progress: remaining }
    })
  }, [])

  const submitGuess = useCallback(
    (date: string, guess: string): boolean => {
      const state = dayState(date)
      if (state.kind !== 'playable') return false
      if (isCorrectGuess(guess, state.word)) {
        finish(date, 'solved')
        return true
      }
      mutateProgress(date, (progress) => ({ ...progress, wrongGuesses: progress.wrongGuesses + 1 }))
      return false
    },
    [dayState, finish, mutateProgress],
  )

  const revealWord = useCallback((date: string) => finish(date, 'revealed'), [finish])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setStore((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }, [])

  const importJSON = useCallback((text: string) => {
    try {
      const incoming = parseStore(JSON.parse(text))
      const incomingCount = Object.keys(incoming.records).length
      if (incomingCount === 0 && Object.keys(incoming.progress).length === 0) {
        return { ok: false as const, error: "That file didn't contain any saved days." }
      }
      let added = 0
      setStore((current) => {
        const before = Object.keys(current.records).length
        const merged = mergeStores(current, incoming)
        added = Object.keys(merged.records).length - before
        return merged
      })
      return { ok: true as const, added }
    } catch {
      return { ok: false as const, error: "That file couldn't be read as a backup." }
    }
  }, [])

  // Heartbeat: records that the app was alive, so a force-quit mid-puzzle can be
  // reconciled to this moment instead of banking every hour it was closed.
  useEffect(() => {
    const id = window.setInterval(() => {
      setStore((current) => {
        const entries = Object.entries(current.progress).filter(([, p]) => p.timer.runningSince !== null)
        if (entries.length === 0) return current
        const now = Date.now()
        const progress = { ...current.progress }
        for (const [date, value] of entries) progress[date] = { ...value, timer: tick(value.timer, now) }
        return { ...current, progress }
      })
    }, 5_000)
    return () => window.clearInterval(id)
  }, [])

  // Time spent with the app in the background is not time spent playing.
  // Only pausing happens here: resuming is the open puzzle's job, so a
  // half-finished day from last week doesn't quietly run its clock too.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return
      setStore((current) => {
        const dates = Object.keys(current.progress)
        if (dates.length === 0) return current
        const now = Date.now()
        const progress = { ...current.progress }
        for (const date of dates) {
          const entry = progress[date]
          progress[date] = { ...entry, timer: pause(entry.timer, now) }
        }
        return { ...current, progress }
      })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const stats = useMemo(() => computeStats(store.records, effectiveToday), [store.records, effectiveToday])

  const value = useMemo<AppValue>(
    () => ({
      store,
      today: effectiveToday,
      stats,
      storageHealthy,
      dayState,
      startDay,
      revealNextClue,
      submitGuess,
      revealWord,
      setPaused,
      updateSettings,
      importJSON,
    }),
    [
      store,
      effectiveToday,
      stats,
      storageHealthy,
      dayState,
      startDay,
      revealNextClue,
      submitGuess,
      revealWord,
      setPaused,
      updateSettings,
      importJSON,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
