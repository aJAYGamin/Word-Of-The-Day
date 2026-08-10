import { describe, expect, it } from 'vitest'
import { reconcileTimer } from './storage'
import { elapsedMs, newTimer, pause, resume, tick } from './timer'

describe('timer', () => {
  it('accumulates only while running', () => {
    const t0 = newTimer(1_000)
    expect(elapsedMs(t0, 6_000)).toBe(5_000)

    const paused = pause(t0, 6_000)
    expect(elapsedMs(paused, 60_000)).toBe(5_000)

    const resumed = resume(paused, 60_000)
    expect(elapsedMs(resumed, 62_000)).toBe(7_000)
  })

  it('does not auto-resume a deliberate pause', () => {
    const manual = pause(newTimer(0), 1_000, true)
    const auto = resume(manual, 5_000)
    expect(auto.runningSince).toBeNull()

    const explicit = resume(manual, 5_000, true)
    expect(explicit.runningSince).toBe(5_000)
  })

  it('is idempotent when pausing or resuming twice', () => {
    const t = pause(newTimer(0), 1_000)
    expect(pause(t, 9_000)).toBe(t)
    const r = resume(t, 2_000)
    expect(resume(r, 9_000)).toBe(r)
  })
})

describe('reconcileTimer', () => {
  it('only banks time up to the last heartbeat when the app was killed', () => {
    // Started at 0, last alive at 30s, reopened the next morning.
    const killed = tick(newTimer(0), 30_000)
    const recovered = reconcileTimer(killed)

    expect(recovered.accumulatedMs).toBe(30_000)
    expect(recovered.runningSince).toBeNull()
    expect(elapsedMs(recovered, 86_400_000)).toBe(30_000)
  })

  it('leaves an already-paused timer alone', () => {
    const paused = pause(newTimer(0), 4_000)
    expect(reconcileTimer(paused)).toBe(paused)
  })
})
