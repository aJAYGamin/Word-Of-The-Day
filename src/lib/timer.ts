import type { TimerState } from './types'

export function newTimer(now: number = Date.now()): TimerState {
  return { accumulatedMs: 0, runningSince: now, lastTickAt: now, manuallyPaused: false }
}

export function elapsedMs(timer: TimerState, now: number = Date.now()): number {
  if (timer.runningSince === null) return timer.accumulatedMs
  return timer.accumulatedMs + Math.max(0, now - timer.runningSince)
}

export function isRunning(timer: TimerState): boolean {
  return timer.runningSince !== null
}

export function pause(timer: TimerState, now: number = Date.now(), manual = false): TimerState {
  if (timer.runningSince === null) {
    return manual ? { ...timer, manuallyPaused: true } : timer
  }
  return {
    accumulatedMs: elapsedMs(timer, now),
    runningSince: null,
    lastTickAt: now,
    manuallyPaused: manual ? true : timer.manuallyPaused,
  }
}

export function resume(timer: TimerState, now: number = Date.now(), manual = false): TimerState {
  if (timer.runningSince !== null) return timer
  // An automatic resume (tab regained focus) must not undo a deliberate pause.
  if (timer.manuallyPaused && !manual) return timer
  return { ...timer, runningSince: now, lastTickAt: now, manuallyPaused: false }
}

/** Heartbeat, so a killed app can be reconciled to the last moment it was alive. */
export function tick(timer: TimerState, now: number = Date.now()): TimerState {
  if (timer.runningSince === null) return timer
  return { ...timer, lastTickAt: now }
}
